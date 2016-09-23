import { Schema, SchemaTag, uint8 } from './schemas';
import {
  BufferLike, createMask, createVariable, getBuffer,
  getBufferGetterName, strideof, systemLittleEndian
} from './utils';

/** Convert a buffer into its JavaScript representation */
export type Decoder<T extends Schema> = (buffer: BufferLike, result?: any, byteOffset?: number) => any;

/** Create a decode function for converting a buffer into its JavaScript representation */
export function createDecoder<T extends Schema>(schema: T): Decoder<T> {
  if (schema === undefined) {
    throw new TypeError('You must specify a type to convert with');
  }
  const decodeUnchecked = createUncheckedDecoder(schema);

  return function decode(buffer, result, byteOffset) {
    return decodeUnchecked(getBuffer(buffer), result, byteOffset);
  };
}

export type UncheckedDecoder<T extends Schema> = (buffer: Buffer, result?: any, byteOffset?: number) => any;

export function createUncheckedDecoder<T extends Schema>(schema: T): UncheckedDecoder<T> {
  const byteOffsetVar = createVariable('byteOffset');
  const resultVar = createVariable('result');

  return new Function(`
    return function decodeUnchecked(buffer, ${resultVar}, ${byteOffsetVar}) {
      "use strict";
      if (${byteOffsetVar} === undefined) {
        ${byteOffsetVar} = 0;
      }
      ${createDecoderCode(schema)}
      return ${resultVar};
    }
  `)();
}

export function createDecoderCode(schema: Schema, stackDepth = 0): string {
  const resultVar = createVariable('result', stackDepth);
  const byteOffsetVar = createVariable('byteOffset', stackDepth);
  const innerResultVar = createVariable('result', stackDepth + 1);
  const innerByteOffsetVar = createVariable('byteOffset', stackDepth + 1);

  switch (schema.tag) {
    case SchemaTag.Number: {
      const { numberTag, littleEndian = systemLittleEndian } = schema;
      const bufferGetterName = getBufferGetterName(numberTag, littleEndian);

      return `
        ${resultVar} = buffer.${bufferGetterName}(${byteOffsetVar}, true);
      `;
    }

    case SchemaTag.Bool: {
      return `
        ${createDecoderCode(uint8, stackDepth)}
        ${resultVar} = Boolean(${resultVar});
      `;
    }

    case SchemaTag.String: {
      const { byteLength, encoding } = schema;
      const indexVar = createVariable('i', stackDepth);
      const maxVar = createVariable('max', stackDepth);

      return `
        var ${indexVar} = ${byteOffsetVar};
        var ${maxVar} = ${byteOffsetVar} + ${byteLength};
        while (${indexVar} < ${maxVar} && buffer[${indexVar}]) {
          ${indexVar}++;
        }
        ${resultVar} = buffer.toString(${JSON.stringify(encoding)}, ${byteOffsetVar}, ${indexVar});
      `;
    }

    case SchemaTag.Array: {
      const { length, byteAlignment, elementSchema } = schema;
      const indexVar = createVariable('i', stackDepth);
      const stride = strideof(elementSchema, byteAlignment);

      return `
        if (${resultVar} === undefined) {
          ${resultVar} = new Array(${length});
        }
        var ${innerByteOffsetVar} = ${byteOffsetVar};
        for (var ${indexVar} = 0; ${indexVar} < ${length}; ++${indexVar}) {
          var ${innerResultVar} = ${resultVar}[${indexVar}];
          ${createDecoderCode(elementSchema, stackDepth + 1)}
          ${resultVar}[${indexVar}] = ${innerResultVar};
          ${innerByteOffsetVar} += ${stride};
        }
      `;
    }

    case SchemaTag.Tuple: {
      const { fields } = schema;

      return `
        if (${resultVar} === undefined) {
          ${resultVar} = new Array(${fields.length});
        }
        ${fields.map(({ schema: fieldSchema, byteOffset }, i) => `
          var ${innerResultVar} = ${resultVar}[${i}];
          var ${innerByteOffsetVar} = ${byteOffsetVar} + ${byteOffset};
          ${createDecoderCode(fieldSchema, stackDepth + 1)}
          ${resultVar}[${i}] = ${innerResultVar};
        `).join('\n')}
      `;
    }

    case SchemaTag.Struct: {
      const { fields } = schema;
      const emptyStruct = `{ ${fields.map(field => `${JSON.stringify(field.name)}: undefined`).join(', ')} }`;

      return `
        if (${resultVar} === undefined) {
          ${resultVar} = ${emptyStruct};
        }
        ${fields.map(({ name, schema: fieldSchema, byteOffset }) => `
          var ${innerResultVar} = ${resultVar}[${JSON.stringify(name)}];
          var ${innerByteOffsetVar} = ${byteOffsetVar} + ${byteOffset};
          ${createDecoderCode(fieldSchema, stackDepth + 1)}
          ${resultVar}[${JSON.stringify(name)}] = ${innerResultVar};
        `).join('\n')}
      `;
    }

    case SchemaTag.Bitfield: {
      const { elementSchema, fields } = schema;
      const emptyBitfield = `{ ${fields.map(field => `${JSON.stringify(field.name)}: undefined`).join(', ')} }`;

      return `
        if (${resultVar} === undefined) {
          ${resultVar} = ${emptyBitfield};
        }
        var ${innerByteOffsetVar} = ${byteOffsetVar};
        var ${innerResultVar};
        ${createDecoderCode(elementSchema, stackDepth + 1)}
        ${fields.map(({ name, bits }) => `
          ${resultVar}[${JSON.stringify(name)}] = ${innerResultVar} & ${createMask(bits)};
          ${innerResultVar} >>>= ${bits};
        `).join('\n')}
      `;
    }

    case SchemaTag.Buffer: {
      const { byteLength } = schema;

      return `
        if (${resultVar} === undefined ||
            ${resultVar}.buffer !== buffer.buffer ||
            ${resultVar}.byteOffset !== ${byteOffsetVar} ||
            ${resultVar}.byteLength !== ${byteLength}) {
          ${resultVar} = buffer.slice(${byteOffsetVar}, ${byteOffsetVar} + ${byteLength});
        }
      `;
    }

    default:
      throw new TypeError(`Invalid schema tag: ${(schema as Schema).tag}`);
  }
}