import { Type } from './interfaces';

export class Converter<T extends Type> {
  constructor(type: T, options?: { cache?: boolean; });
  decode(buffer: ArrayBuffer | ArrayBufferView, data?: any, startOffset?: number): any;
  encode(data: any): ArrayBuffer;
  encode<BufferType extends ArrayBuffer | ArrayBufferView>(data: any, buffer: BufferType, startOffset?: number): BufferType;
}

export function decode(type: Type, buffer: ArrayBuffer | ArrayBufferView, data?: any, startOffset?: number): any;
export function encode(type: Type, data: any): ArrayBuffer;
export function encode<T extends ArrayBuffer | ArrayBufferView>(type: Type, data: any, buffer: T, startOffset?: number): T;
