// TEA cipher for MOD↔DFF conversion
// Ported from mod_dff.py (ishod.zip)

const KEY = new Uint8Array([
  0x41, 0x45, 0x70, 0x17, 0x49, 0x54, 0x87, 0x91,
  0x56, 0xAC, 0x01, 0x11, 0x12, 0x33, 0x01, 0x82
]);

const DELTA = 0x9E3779B9;
const N_ROUNDS = 16;

function getKeyWords(): [number, number, number, number] {
  const view = new DataView(KEY.buffer);
  return [
    view.getUint32(0, true),
    view.getUint32(4, true),
    view.getUint32(8, true),
    view.getUint32(12, true),
  ];
}

function uint32(n: number): number {
  return n >>> 0;
}

export function decryptMod(data: Uint8Array): Uint8Array {
  const result = new Uint8Array(data);
  const view = new DataView(result.buffer);
  const [k0, k1, k2, k3] = getKeyWords();

  for (let i = 0; i <= result.length - 8; i += 8) {
    let v0 = view.getUint32(i, true);
    let v1 = view.getUint32(i + 4, true);
    let msum = uint32(DELTA * N_ROUNDS);

    for (let r = 0; r < N_ROUNDS; r++) {
      v1 = uint32(v1 - (uint32((v0 << 4) + k2) ^ uint32(v0 + msum) ^ uint32((v0 >>> 5) + k3)));
      v0 = uint32(v0 - (uint32((v1 << 4) + k0) ^ uint32(v1 + msum) ^ uint32((v1 >>> 5) + k1)));
      msum = uint32(msum - DELTA);
    }

    view.setUint32(i, v0, true);
    view.setUint32(i + 4, v1, true);
  }

  return result;
}

export function encryptDff(data: Uint8Array): Uint8Array {
  const result = new Uint8Array(data);
  const view = new DataView(result.buffer);
  const [k0, k1, k2, k3] = getKeyWords();

  for (let i = 0; i <= result.length - 8; i += 8) {
    let v0 = view.getUint32(i, true);
    let v1 = view.getUint32(i + 4, true);
    let msum = 0;

    for (let r = 0; r < N_ROUNDS; r++) {
      msum = uint32(msum + DELTA);
      v0 = uint32(v0 + (uint32((v1 << 4) + k0) ^ uint32(v1 + msum) ^ uint32((v1 >>> 5) + k1)));
      v1 = uint32(v1 + (uint32((v0 << 4) + k2) ^ uint32(v0 + msum) ^ uint32((v0 >>> 5) + k3)));
    }

    view.setUint32(i, v0, true);
    view.setUint32(i + 4, v1, true);
  }

  return result;
}

// Detect if a file is MOD (encrypted) or DFF (RenderWare)
export function detectFileType(data: Uint8Array): 'mod' | 'dff' | 'unknown' {
  if (data.length < 4) return 'unknown';
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  const magic = view.getUint32(0, true);
  // DFF starts with RenderWare section type 0x10 or similar
  if (magic === 0x10 || magic === 0x1 || magic === 0x16) return 'dff';
  return 'mod';
}
