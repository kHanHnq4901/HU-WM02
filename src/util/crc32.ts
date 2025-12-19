export function makeCrc32Table(poly: number = 0x04C11DB7): number[] {
    const table: number[] = [];
    for (let i = 0; i < 256; i++) {
      let crc = i << 24;
      for (let j = 0; j < 8; j++) {
        if (crc & 0x80000000) {
          crc = ((crc << 1) ^ poly) >>> 0;
        } else {
          crc = (crc << 1) >>> 0;
        }
      }
      table.push(crc >>> 0);
    }
    return table;
  }
  
  const CRC32_TABLE = makeCrc32Table();
  
  export function crc32Stm32(data: Uint8Array): number {
    let crc = 0xffffffff;
  
    // pad về bội số 4 bằng 0xFF
    const padded =
      data.length % 4 === 0
        ? data
        : new Uint8Array([...data, ...new Array(4 - (data.length % 4)).fill(0xff)]);
  
    for (let i = 0; i < padded.length; i += 4) {
      const word =
        padded[i] |
        (padded[i + 1] << 8) |
        (padded[i + 2] << 16) |
        (padded[i + 3] << 24);
  
      for (const shift of [24, 16, 8, 0]) {
        const b = (word >> shift) & 0xff;
        crc =
          ((crc << 8) ^ CRC32_TABLE[((crc >>> 24) ^ b) & 0xff]) >>> 0;
      }
    }
  
    return crc >>> 0;
  }
  