import test from 'ava';
import {
  encode, decode, systemLittleEndian,
  sizeof, alignof, strideof,
  array, struct, tuple, bitfield, string,
  bool, int8, uint8,
  int16, int16le, int16be,
  uint16, uint16le, uint16be,
  int32, int32le, int32be,
  uint32, uint32le, uint32be,
  uint64, uint64le, uint64be,
  float32, float32le, float32be,
  float64, float64le, float64be,
} from '../';


/* eslint-disable no-param-reassign */
function testEncodeDecode(t, type, input, expectedEncoded, expectedDecoded) {
  if (typeof expectedEncoded !== 'object') {
    expectedEncoded = [expectedEncoded];
  }

  const encoded = encode(type, input);
  t.deepEqual(new Uint8Array(encoded), new Uint8Array(expectedEncoded));

  const decoded = decode(type, encoded);
  t.deepEqual(decoded, expectedDecoded);
}

// Flip pairs of 2 bytes
function swap2(arrayBuffer) {
  const dv = new DataView(arrayBuffer);
  for (let i = 0, len = dv.byteLength; i < len; i += 2) {
    dv.setUint16(i, dv.getUint16(i, true), false);
  }
}

// Flip tuples of 4 bytes
function swap4(arrayBuffer) {
  const dv = new DataView(arrayBuffer);
  for (let i = 0, len = dv.byteLength; i < len; i += 4) {
    dv.setUint32(i, dv.getUint32(i, true), false);
  }
}

// Flip tuples of 8 bytes
function swap8(arrayBuffer) {
  const dv = new DataView(arrayBuffer);
  for (let i = 0, len = dv.byteLength; i < len; i += 8) {
    const lo = dv.getUint32(i, true);
    const hi = dv.getUint32(i + 4, true);
    dv.setUint32(i, hi, false);
    dv.setUint32(i + 4, lo, false);
  }
}

test('bool', t => {
  const type = bool;

  t.is(type.tag, 'Bool');
  t.is(sizeof(type), 1);
  t.is(alignof(type), 1);
  t.is(type.littleEndian, systemLittleEndian);

  t.true(decode(type, encode(type, true)));
  t.false(decode(type, encode(type, false)));
});

test('int8', t => {
  const type = int8;

  t.is(type.tag, 'Int8');
  t.is(sizeof(type), 1);
  t.is(alignof(type), 1);
  t.is(type.littleEndian, systemLittleEndian);

  const inputData = [
    -129, -128, -127,
    -1, 0, 1,
    126, 127, 128,
  ];

  const expectedBytes = new Uint8Array(new Int8Array(inputData).buffer);

  const decodedData = [
    127, -128, -127,
    -1, 0, 1,
    126, 127, -128,
  ];

  testEncodeDecode(t, array(type, inputData.length), inputData, expectedBytes, decodedData);
});


test('uint8', t => {
  const type = uint8;

  t.is(type.tag, 'UInt8');
  t.is(sizeof(type), 1);
  t.is(alignof(type), 1);
  t.is(type.littleEndian, systemLittleEndian);

  const inputData = [
    -1, 0, 1,
    254, 255, 256,
  ];

  const expectedBytes = new Int8Array(inputData).buffer;

  const decodedData = [
    255, 0, 1,
    254, 255, 0,
  ];

  testEncodeDecode(t, array(type, inputData.length), inputData, expectedBytes, decodedData);
});


test('int16', t => {
  const type = int16;

  t.is(type.tag, 'Int16');
  t.is(sizeof(type), 2);
  t.is(alignof(type), 2);
  t.is(type.littleEndian, systemLittleEndian);

  const inputData = [
    -32769, -32768, -32767,
    -1, 0, 1,
    32766, 32767, 32768,
  ];

  const decodedData = [
    32767, -32768, -32767,
    -1, 0, 1,
    32766, 32767, -32768,
  ];

  const expectedBytes = new Int16Array(inputData).buffer;

  testEncodeDecode(t, array(type, inputData.length), inputData, expectedBytes, decodedData);

  testEncodeDecode(t, array(type, inputData.length), inputData, expectedBytes, decodedData);

  if (!systemLittleEndian) {
    swap2(expectedBytes);
  }

  testEncodeDecode(t, array(int16le, inputData.length), inputData, expectedBytes, decodedData);

  swap2(expectedBytes);

  testEncodeDecode(t, array(int16be, inputData.length), inputData, expectedBytes, decodedData);
});


test('int16le', t => {
  const type = int16le;

  t.is(type.tag, 'Int16');
  t.is(sizeof(type), 2);
  t.is(alignof(type), 2);
  t.is(type.littleEndian, true);
});


test('int16be', t => {
  const type = int16be;

  t.is(type.tag, 'Int16');
  t.is(sizeof(type), 2);
  t.is(alignof(type), 2);
  t.is(type.littleEndian, false);
});


test('uint16', t => {
  const type = uint16;

  t.is(type.tag, 'UInt16');
  t.is(sizeof(type), 2);
  t.is(alignof(type), 2);
  t.is(type.littleEndian, systemLittleEndian);

  const inputData = [
    -1, 0, 1,
    65534, 65535, 65536,
  ];

  const decodedData = [
    65535, 0, 1,
    65534, 65535, 0,
  ];

  const expectedBytes = new Uint16Array(inputData).buffer;

  testEncodeDecode(t, array(type, inputData.length), inputData, expectedBytes, decodedData);

  if (!systemLittleEndian) {
    swap2(expectedBytes);
  }

  testEncodeDecode(t, array(uint16le, inputData.length), inputData, expectedBytes, decodedData);

  swap2(expectedBytes);

  testEncodeDecode(t, array(uint16be, inputData.length), inputData, expectedBytes, decodedData);
});


test('uint16le', t => {
  const type = uint16le;

  t.is(type.tag, 'UInt16');
  t.is(sizeof(type), 2);
  t.is(alignof(type), 2);
  t.is(type.littleEndian, true);
});


test('uint16be', t => {
  const type = uint16be;

  t.is(type.tag, 'UInt16');
  t.is(sizeof(type), 2);
  t.is(alignof(type), 2);
  t.is(type.littleEndian, false);
});


test('int32', t => {
  const type = int32;

  t.is(type.tag, 'Int32');
  t.is(sizeof(type), 4);
  t.is(alignof(type), 4);
  t.is(type.littleEndian, systemLittleEndian);

  const inputData = [
    -2147483649, -2147483648, -2147483647,
    -1, 0, 1,
    2147483646, 2147483647, 2147483648,
  ];

  const decodedData = [
    2147483647, -2147483648, -2147483647,
    -1, 0, 1,
    2147483646, 2147483647, -2147483648,
  ];

  const expectedBytes = new Int32Array(inputData).buffer;

  testEncodeDecode(t, array(type, inputData.length), inputData, expectedBytes, decodedData);

  if (!systemLittleEndian) {
    swap4(expectedBytes);
  }

  testEncodeDecode(t, array(int32le, inputData.length), inputData, expectedBytes, decodedData);

  swap4(expectedBytes);

  testEncodeDecode(t, array(int32be, inputData.length), inputData, expectedBytes, decodedData);
});


test('int32le', t => {
  const type = int32le;

  t.is(type.tag, 'Int32');
  t.is(sizeof(type), 4);
  t.is(alignof(type), 4);
  t.is(type.littleEndian, true);
});


test('int32be', t => {
  const type = int32be;

  t.is(type.tag, 'Int32');
  t.is(sizeof(type), 4);
  t.is(alignof(type), 4);
  t.is(type.littleEndian, false);
});


test('uint32', t => {
  const type = uint32;

  t.is(type.tag, 'UInt32');
  t.is(sizeof(type), 4);
  t.is(alignof(type), 4);
  t.is(type.littleEndian, systemLittleEndian);

  const inputData = [
    -1, 0, 1,
    4294967294, 4294967295, 4294967296,
  ];

  const decodedData = [
    4294967295, 0, 1,
    4294967294, 4294967295, 0,
  ];

  const expectedBytes = new Uint32Array(inputData).buffer;

  testEncodeDecode(t, array(type, inputData.length), inputData, expectedBytes, decodedData);

  if (!systemLittleEndian) {
    swap4(expectedBytes);
  }

  testEncodeDecode(t, array(uint32le, inputData.length), inputData, expectedBytes, decodedData);

  swap4(expectedBytes);

  testEncodeDecode(t, array(uint32be, inputData.length), inputData, expectedBytes, decodedData);
});


test('int32le', t => {
  const type = uint32le;

  t.is(type.tag, 'UInt32');
  t.is(sizeof(type), 4);
  t.is(alignof(type), 4);
  t.is(type.littleEndian, true);
});


test('uint32be', t => {
  const type = uint32be;

  t.is(type.tag, 'UInt32');
  t.is(sizeof(type), 4);
  t.is(alignof(type), 4);
  t.is(type.littleEndian, false);
});

test('uint64', t => {
  const type = uint64;

  t.is(type.tag, 'UInt64');
  t.is(sizeof(type), 8);
  t.is(alignof(type), 8);
  t.is(type.littleEndian, systemLittleEndian);

  const data = { hi: 0xFFFFFFFF, lo: 0 };

  const encoded = encode(type, data);
  const decoded = decode(type, encoded);

  t.deepEqual(decoded, data);
});


test('uint64le', t => {
  const type = uint64le;

  t.is(type.tag, 'UInt64');
  t.is(sizeof(type), 8);
  t.is(alignof(type), 8);
  t.is(type.littleEndian, true);

  const data = { hi: 0xFFFFFFFF, lo: 0 };

  const encoded = encode(type, data);
  const decoded = decode(type, encoded);

  t.deepEqual(decoded, data);
});


test('uint64be', t => {
  const type = uint64be;

  t.is(type.tag, 'UInt64');
  t.is(sizeof(type), 8);
  t.is(alignof(type), 8);
  t.is(type.littleEndian, false);

  const data = { hi: 0xFFFFFFFF, lo: 0 };

  const encoded = encode(type, data);
  const decoded = decode(type, encoded);

  t.deepEqual(decoded, data);
});


test('float32', t => {
  const type = float32;

  t.is(type.tag, 'Float32');
  t.is(sizeof(type), 4);
  t.is(alignof(type), 4);
  t.is(type.littleEndian, systemLittleEndian);

  const MIN_VALUE_F32 = Math.pow(2, -126);
  const MAX_VALUE_F32 = (1 - Math.pow(2, -24)) * Math.pow(2, 128);

  const testData = [
    -Infinity,
    -0,
    0,
    MIN_VALUE_F32,
    MAX_VALUE_F32,
    Infinity,
  ];

  const expectedBytes = new Float32Array(testData).buffer;

  testEncodeDecode(t, array(type, testData.length), testData, expectedBytes, testData);

  if (!systemLittleEndian) {
    swap4(expectedBytes);
  }

  testEncodeDecode(t, array(float32le, testData.length), testData, expectedBytes, testData);

  swap4(expectedBytes);

  testEncodeDecode(t, array(float32be, testData.length), testData, expectedBytes, testData);
});


test('float32le', t => {
  const type = float32le;

  t.is(type.tag, 'Float32');
  t.is(sizeof(type), 4);
  t.is(alignof(type), 4);
  t.is(type.littleEndian, true);
});


test('float32be', t => {
  const type = float32be;

  t.is(type.tag, 'Float32');
  t.is(sizeof(type), 4);
  t.is(alignof(type), 4);
  t.is(type.littleEndian, false);
});


test('float64', t => {
  const type = float64;

  t.is(type.tag, 'Float64');
  t.is(sizeof(type), 8);
  t.is(alignof(type), 8);
  t.is(type.littleEndian, systemLittleEndian);

  const testData = [
    -Infinity,
    -0,
    0,
    Number.MIN_VALUE,
    Number.MAX_VALUE,
    Infinity,
  ];

  const expectedBytes = new Float64Array(testData).buffer;

  testEncodeDecode(t, array(type, testData.length), testData, expectedBytes, testData);

  if (!systemLittleEndian) {
    swap8(expectedBytes);
  }

  testEncodeDecode(t, array(float64le, testData.length), testData, expectedBytes, testData);

  swap8(expectedBytes);

  testEncodeDecode(t, array(float64be, testData.length), testData, expectedBytes, testData);
});


test('float64le', t => {
  const type = float64le;

  t.is(type.tag, 'Float64');
  t.is(sizeof(type), 8);
  t.is(alignof(type), 8);
  t.is(type.littleEndian, true);
});


test('float64be', t => {
  const type = float64be;

  t.is(type.tag, 'Float64');
  t.is(sizeof(type), 8);
  t.is(alignof(type), 8);
  t.is(type.littleEndian, false);
});


test('array', t => {
  t.throws(() => array());
  t.throws(() => array(uint32));

  const type = array(uint16, 10);

  t.is(type.tag, 'Array');
  t.is(type.length, 10);
  t.is(sizeof(type), 20);
  t.is(alignof(type), 2);
  t.is(type.element.tag, 'UInt16');
  t.is(type.element.byteLength, 2);
  t.is(type.element.byteAlignment, 2);
});


test('tuple', t => {
  const type = tuple(float32, uint16);

  const data = [1.5, 2];
  const encoded = encode(type, data);
  const decoded = decode(type, encoded);

  t.deepEqual(data, decoded);
});


test('bitfield', t => {
  t.throws(() => bitfield());
  t.throws(() => bitfield({ a: 20, b: 20 }));

  const type = bitfield({
    hello: 1,
    there: 7,
    how: 11,
    are: 8,
    you: 5,
  });

  const data = {
    hello: 1,
    there: 2,
    how: 3,
    are: 4,
    you: 5,
  };

  const encoded = encode(type, data);
  const decoded = decode(type, encoded);

  t.deepEqual(data, decoded);
});


test('string, default args', t => {
  t.throws(() => string());

  const type = string(20);

  t.is(type.tag, 'String');
  t.is(sizeof(type), 20);
  t.is(alignof(type), 1);
  t.is(type.encoding, 'utf8');

  const data = 'hello world';
  const encoded = encode(type, data);
  const decoded = decode(type, encoded);

  t.is(decoded, data);
});


test('string', t => {
  const type = string(10, 'ascii');

  t.is(type.tag, 'String');
  t.is(sizeof(type), 10);
  t.is(alignof(type), 1);
  t.is(type.encoding, 'ascii');
});


test('struct, same types', t => {
  t.throws(() => struct());

  const type = struct({
    x: float32,
    y: float32,
    z: float32,
  });

  t.is(type.tag, 'Struct');
  t.is(sizeof(type), 12);
  t.is(alignof(type), 4);
  t.true(Array.isArray(type.members));

  const [x, y, z] = type.members;

  t.is(x.byteOffset, 0);
  t.is(x.element.tag, 'Float32');

  t.is(y.byteOffset, 4);
  t.is(y.element.tag, 'Float32');

  t.is(z.byteOffset, 8);
  t.is(z.element.tag, 'Float32');

  const data = {
    x: -1,
    y: 0,
    z: Infinity,
  };

  const encoded = encode(type, data);
  const decoded = decode(type, encoded);

  const otherDecoded = encode(array(float32, 3), [-1, 0, Infinity]);
  t.deepEqual(new Uint8Array(encoded), new Uint8Array(otherDecoded));

  t.deepEqual(decoded, data);
});


test('struct, different types', t => {
  const type = struct({
    a: uint8,
    b: int16,
    c: int32,
    d: uint8,
  });

  t.is(type.tag, 'Struct');
  t.is(sizeof(type), 9);
  t.is(strideof(type), 12);
  t.is(alignof(type), 4);

  const [a, b, c, d] = type.members;

  t.is(a.name, 'a');
  t.is(a.byteOffset, 0);
  t.is(a.element.tag, 'UInt8');

  t.is(b.name, 'b');
  t.is(b.byteOffset, 2);
  t.is(b.element.tag, 'Int16');

  t.is(c.name, 'c');
  t.is(c.byteOffset, 4);
  t.is(c.element.tag, 'Int32');

  t.is(d.name, 'd');
  t.is(d.byteOffset, 8);
  t.is(d.element.tag, 'UInt8');
});


test('struct, manually reordered', t => {
  const type = struct({
    a: uint8,
    d: uint8,
    b: int16,
    c: int32,
  });

  t.is(type.tag, 'Struct');
  t.is(sizeof(type), 8);
  t.is(alignof(type), 4);

  const [a, d, b, c] = type.members;

  t.is(a.name, 'a');
  t.is(a.byteOffset, 0);
  t.is(a.element.tag, 'UInt8');

  t.is(d.name, 'd');
  t.is(d.byteOffset, 1);
  t.is(d.element.tag, 'UInt8');

  t.is(b.name, 'b');
  t.is(b.byteOffset, 2);
  t.is(b.element.tag, 'Int16');

  t.is(c.name, 'c');
  t.is(c.byteOffset, 4);
  t.is(c.element.tag, 'Int32');
});


test('struct, auto-reordered', t => {
  const type = struct({
    a: uint8,
    b: int16,
    c: int32,
    d: uint8,
  }, { reorder: true });

  const type2 = struct({
    a: uint8,
    d: uint8,
    b: int16,
    c: int32,
  });

  t.deepEqual(type, type2);
});


test('struct, packed', t => {
  const type = struct({
    a: uint8,
    b: int16,
    c: int32,
    d: uint8,
  }, { pack: 1 });

  t.is(sizeof(type), 8);
  t.is(alignof(type), 1);
});


test('encode', t => {
  const type = struct({
    x: float32,
    y: float32,
    z: float32,
  });

  const data = {
    x: 34,
    y: 12,
    z: 0,
  };

  t.throws(() => encode());
  t.throws(() => encode(type));
  t.throws(() => encode(type, data, null));
  t.throws(() => encode(type, data, 5));
  t.throws(() => encode(type, data, [1, 2, 3]));

  const buffer = encode(type, data);
  t.true(buffer instanceof ArrayBuffer);
  t.is(buffer.byteLength, sizeof(type));

  const existingBuffer = new ArrayBuffer(sizeof(type));
  const clonedBuffer = existingBuffer.slice(0);
  const returnedBuffer = encode(type, data, existingBuffer);
  t.is(returnedBuffer, existingBuffer);
  t.notDeepEqual(new Uint8Array(returnedBuffer), new Uint8Array(clonedBuffer));

  const tooSmallBuffer = new ArrayBuffer(sizeof(type) - 1);
  t.throws(() => encode(type, data, tooSmallBuffer));

  const floatArray = new Float32Array(3);
  const clonedArray = new Float32Array(floatArray);
  const returnedArray = encode(type, data, floatArray);
  t.is(returnedArray, floatArray);
  t.notDeepEqual(returnedArray, clonedArray);
  t.deepEqual(returnedArray, Object.keys(data).map(key => data[key]));
});


test('decode', t => {
  const type = struct({
    x: float32,
    y: float32,
    z: float32,
  });

  const buffer = new Float32Array([1, 2, 3]).buffer;

  const expected = { x: 1, y: 2, z: 3 };

  const decoded = decode(type, buffer);
  t.deepEqual(decoded, expected);

  const targetObject = {};
  const initialState = {};
  const decoded2 = decode(type, buffer, targetObject);
  t.is(decoded2, targetObject);
  t.notDeepEqual(decoded2, initialState);

  const tooSmallBuffer = new ArrayBuffer(sizeof(type) - 1);
  t.throws(() => decode(type, tooSmallBuffer));

  t.throws(() => decode());
  t.throws(() => decode(type));
  t.throws(() => decode(type, null));
});