// BTX ↔ KTX header manipulation
// BTX is KTX2 with a 4-byte header prepended: 02 00 00 00
// Note: actual ASTC encoding/decoding is not supported in pure JS

export const BTX_HEADER = new Uint8Array([0x02, 0x00, 0x00, 0x00]);

// Remove BTX header → returns KTX2 data
export function btxToKtx(data: Uint8Array): Uint8Array {
  if (data.length < 4) throw new Error('Файл слишком маленький');
  return data.slice(4);
}

// Add BTX header to KTX2 data
export function ktxToBtx(data: Uint8Array): Uint8Array {
  const result = new Uint8Array(4 + data.length);
  result.set(BTX_HEADER, 0);
  result.set(data, 4);
  return result;
}

// Detect if file is BTX (starts with 02 00 00 00) or KTX (starts with KTX magic)
export function detectBtxFile(data: Uint8Array): 'btx' | 'ktx' | 'unknown' {
  if (data.length < 4) return 'unknown';
  if (data[0] === 0x02 && data[1] === 0x00 && data[2] === 0x00 && data[3] === 0x00) return 'btx';
  // KTX2 magic: AB 4B 54 58 20 32 30 BB 0D 0A 1A 0A
  if (data[0] === 0xAB && data[1] === 0x4B && data[2] === 0x54 && data[3] === 0x58) return 'ktx';
  return 'unknown';
}
