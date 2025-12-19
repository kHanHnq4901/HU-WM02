export function endianness() {
  var b = new ArrayBuffer(4);
  var a = new Uint32Array(b);
  var c = new Uint8Array(b);
  a[0] = 0xdeadbeef;
  if (c[0] === 0xef) {
    return 'LE';
  }
  if (c[0] === 0xde) {
    return 'BE';
  }
  throw new Error('unknown endianness');
}
