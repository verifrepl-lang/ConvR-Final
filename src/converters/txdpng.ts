// TXD ↔ PNG converter
// Parses RenderWare TXD format and decodes DXT1/3/5 textures
// Ported from txd_png.py (ishod.zip)

function readUint32LE(buf: Uint8Array, offset: number): number {
  return (buf[offset] | (buf[offset + 1] << 8) | (buf[offset + 2] << 16) | (buf[offset + 3] << 24)) >>> 0;
}

function readUint16LE(buf: Uint8Array, offset: number): number {
  return (buf[offset] | (buf[offset + 1] << 8)) >>> 0;
}

function readString(buf: Uint8Array, offset: number, length: number): string {
  let str = '';
  for (let i = 0; i < length; i++) {
    if (buf[offset + i] === 0) break;
    str += String.fromCharCode(buf[offset + i]);
  }
  return str;
}

// DXT color decoding
function r5g6b5toRgb(color: number): [number, number, number] {
  const r = ((color >> 11) & 0x1f) * 255 / 31;
  const g = ((color >> 5) & 0x3f) * 255 / 63;
  const b = (color & 0x1f) * 255 / 31;
  return [Math.round(r), Math.round(g), Math.round(b)];
}

function decodeDxt1Block(block: Uint8Array, offset: number): Uint8Array {
  const c0 = readUint16LE(block, offset);
  const c1 = readUint16LE(block, offset + 2);
  const bits = readUint32LE(block, offset + 4);

  const [r0, g0, b0] = r5g6b5toRgb(c0);
  const [r1, g1, b1] = r5g6b5toRgb(c1);

  const colors: [number, number, number, number][] = [
    [r0, g0, b0, 255],
    [r1, g1, b1, 255],
    c0 > c1
      ? [Math.round((2 * r0 + r1) / 3), Math.round((2 * g0 + g1) / 3), Math.round((2 * b0 + b1) / 3), 255]
      : [Math.round((r0 + r1) / 2), Math.round((g0 + g1) / 2), Math.round((b0 + b1) / 2), 255],
    c0 > c1
      ? [Math.round((r0 + 2 * r1) / 3), Math.round((g0 + 2 * g1) / 3), Math.round((b0 + 2 * b1) / 3), 255]
      : [0, 0, 0, 0],
  ];

  const pixels = new Uint8Array(16 * 4);
  for (let i = 0; i < 16; i++) {
    const idx = (bits >> (i * 2)) & 3;
    pixels[i * 4] = colors[idx][0];
    pixels[i * 4 + 1] = colors[idx][1];
    pixels[i * 4 + 2] = colors[idx][2];
    pixels[i * 4 + 3] = colors[idx][3];
  }
  return pixels;
}

function decodeDxt3Alpha(block: Uint8Array, offset: number): Uint8Array {
  const alpha = new Uint8Array(16);
  for (let i = 0; i < 8; i++) {
    const byte = block[offset + i];
    alpha[i * 2] = (byte & 0x0f) * 17;
    alpha[i * 2 + 1] = ((byte >> 4) & 0x0f) * 17;
  }
  return alpha;
}

function decodeDxt5Alpha(block: Uint8Array, offset: number): Uint8Array {
  const a0 = block[offset];
  const a1 = block[offset + 1];

  const alphas: number[] = [a0, a1];
  if (a0 > a1) {
    for (let i = 1; i < 7; i++) alphas.push(Math.round((a0 * (7 - i) + a1 * i) / 7));
  } else {
    for (let i = 1; i < 5; i++) alphas.push(Math.round((a0 * (5 - i) + a1 * i) / 5));
    alphas.push(0);
    alphas.push(255);
  }

  // Read 6 bytes = 48 bits = 16 x 3-bit indices
  let bits = 0n;
  for (let i = 5; i >= 0; i--) {
    bits = (bits << 8n) | BigInt(block[offset + 2 + i]);
  }

  const alpha = new Uint8Array(16);
  for (let i = 0; i < 16; i++) {
    const idx = Number((bits >> BigInt(i * 3)) & 7n);
    alpha[i] = alphas[idx];
  }
  return alpha;
}

function decodeDxt1(data: Uint8Array, width: number, height: number): Uint8Array {
  const rgba = new Uint8Array(width * height * 4);
  let blockOffset = 0;
  const blocksX = Math.ceil(width / 4);
  const blocksY = Math.ceil(height / 4);

  for (let by = 0; by < blocksY; by++) {
    for (let bx = 0; bx < blocksX; bx++) {
      const pixels = decodeDxt1Block(data, blockOffset);
      blockOffset += 8;

      for (let py = 0; py < 4; py++) {
        for (let px = 0; px < 4; px++) {
          const x = bx * 4 + px;
          const y = by * 4 + py;
          if (x < width && y < height) {
            const dst = (y * width + x) * 4;
            const src = (py * 4 + px) * 4;
            rgba[dst] = pixels[src];
            rgba[dst + 1] = pixels[src + 1];
            rgba[dst + 2] = pixels[src + 2];
            rgba[dst + 3] = pixels[src + 3];
          }
        }
      }
    }
  }
  return rgba;
}

function decodeDxt3(data: Uint8Array, width: number, height: number): Uint8Array {
  const rgba = new Uint8Array(width * height * 4);
  let blockOffset = 0;
  const blocksX = Math.ceil(width / 4);
  const blocksY = Math.ceil(height / 4);

  for (let by = 0; by < blocksY; by++) {
    for (let bx = 0; bx < blocksX; bx++) {
      const alpha = decodeDxt3Alpha(data, blockOffset);
      const pixels = decodeDxt1Block(data, blockOffset + 8);
      blockOffset += 16;

      for (let py = 0; py < 4; py++) {
        for (let px = 0; px < 4; px++) {
          const x = bx * 4 + px;
          const y = by * 4 + py;
          if (x < width && y < height) {
            const dst = (y * width + x) * 4;
            const src = py * 4 + px;
            rgba[dst] = pixels[src * 4];
            rgba[dst + 1] = pixels[src * 4 + 1];
            rgba[dst + 2] = pixels[src * 4 + 2];
            rgba[dst + 3] = alpha[src];
          }
        }
      }
    }
  }
  return rgba;
}

function decodeDxt5(data: Uint8Array, width: number, height: number): Uint8Array {
  const rgba = new Uint8Array(width * height * 4);
  let blockOffset = 0;
  const blocksX = Math.ceil(width / 4);
  const blocksY = Math.ceil(height / 4);

  for (let by = 0; by < blocksY; by++) {
    for (let bx = 0; bx < blocksX; bx++) {
      const alpha = decodeDxt5Alpha(data, blockOffset);
      const pixels = decodeDxt1Block(data, blockOffset + 8);
      blockOffset += 16;

      for (let py = 0; py < 4; py++) {
        for (let px = 0; px < 4; px++) {
          const x = bx * 4 + px;
          const y = by * 4 + py;
          if (x < width && y < height) {
            const dst = (y * width + x) * 4;
            const src = py * 4 + px;
            rgba[dst] = pixels[src * 4];
            rgba[dst + 1] = pixels[src * 4 + 1];
            rgba[dst + 2] = pixels[src * 4 + 2];
            rgba[dst + 3] = alpha[src];
          }
        }
      }
    }
  }
  return rgba;
}

export interface TxdTexture {
  name: string;
  width: number;
  height: number;
  rgba: Uint8Array;
}

const D3DFMT_DXT1 = 0x31545844;
const D3DFMT_DXT3 = 0x33545844;
const D3DFMT_DXT5 = 0x35545844;
const D3DFMT_A8R8G8B8 = 21;
const D3DFMT_R8G8B8 = 20;

// Parse TXD file and extract all textures as RGBA
export function parseTxd(data: Uint8Array): TxdTexture[] {
  const textures: TxdTexture[] = [];
  let offset = 0;

  function readSection(): { type: number; size: number; data: Uint8Array } | null {
    if (offset + 12 > data.length) return null;
    const type = readUint32LE(data, offset);
    const size = readUint32LE(data, offset + 4);
    // const version = readUint32LE(data, offset + 8);
    const sectionData = data.slice(offset + 12, offset + 12 + size);
    offset += 12 + size;
    return { type, size, data: sectionData };
  }

  // Find TEXDICTIONARY section (0x16)
  let foundDict = false;
  while (offset < data.length) {
    const section = readSection();
    if (!section) break;

    if (section.type === 0x16) {
      foundDict = true;
      // Parse texture count from struct data (first sub-section)
      let innerOffset = 0;
      const inner = section.data;

      // TEXDICTIONARY has: struct section, then texture natives
      // Skip struct section header
      if (inner.length >= 12 && readUint32LE(inner, 0) === 0x01) {
        const structSize = readUint32LE(inner, 4);
        innerOffset = 12 + structSize;
      }

      // Now parse texture native sections
      while (innerOffset < inner.length) {
        if (innerOffset + 12 > inner.length) break;
        const secType = readUint32LE(inner, innerOffset);
        const secSize = readUint32LE(inner, innerOffset + 4);

        if (secType === 0x15) {
          // TEXTURENATIVE
          const texSection = inner.slice(innerOffset + 12, innerOffset + 12 + secSize);
          const tex = parseTextureNative(texSection);
          if (tex) textures.push(tex);
        }

        innerOffset += 12 + secSize;
      }
      break;
    }
  }

  if (!foundDict && textures.length === 0) {
    // Try direct texture native parsing
    offset = 0;
    while (offset < data.length) {
      const section = readSection();
      if (!section) break;
      if (section.type === 0x15) {
        const tex = parseTextureNative(section.data);
        if (tex) textures.push(tex);
      }
    }
  }

  return textures;
}

function parseTextureNative(data: Uint8Array): TxdTexture | null {
  try {
    // Skip struct section header if present
    let offset = 0;
    if (data.length >= 12 && readUint32LE(data, 0) === 0x01) {
      const structSize = readUint32LE(data, 4);
      offset = 12;
      data = data.slice(offset, offset + structSize);
      offset = 0;
    }

    // Platform ID
    const platformId = readUint32LE(data, offset); offset += 4;
    if (platformId !== 8 && platformId !== 9) {
      // Skip non-PC/mobile platforms
    }

    // Filter flags
    offset += 4;

    // Texture name (32 bytes) + alpha name (32 bytes)
    const name = readString(data, offset, 32); offset += 32;
    offset += 32; // alpha name

    // Format
    const format = readUint32LE(data, offset); offset += 4;
    const hasAlpha = data[offset++];
    const width = readUint16LE(data, offset); offset += 2;
    const height = readUint16LE(data, offset); offset += 2;
    const depth = data[offset++];
    const mipCount = data[offset++];
    const texType = data[offset++];
    const compression = data[offset++];

    // Data size
    const dataSize = readUint32LE(data, offset); offset += 4;
    const rasterData = data.slice(offset, offset + dataSize);

    let rgba: Uint8Array;

    if (format === D3DFMT_DXT1) {
      rgba = decodeDxt1(rasterData, width, height);
    } else if (format === D3DFMT_DXT3) {
      rgba = decodeDxt3(rasterData, width, height);
    } else if (format === D3DFMT_DXT5) {
      rgba = decodeDxt5(rasterData, width, height);
    } else if (format === D3DFMT_A8R8G8B8 || depth === 32) {
      // ARGB → RGBA
      rgba = new Uint8Array(width * height * 4);
      for (let i = 0; i < width * height; i++) {
        rgba[i * 4] = rasterData[i * 4 + 2];     // R (was B)
        rgba[i * 4 + 1] = rasterData[i * 4 + 1]; // G
        rgba[i * 4 + 2] = rasterData[i * 4];     // B (was R)
        rgba[i * 4 + 3] = rasterData[i * 4 + 3]; // A
      }
    } else if (format === D3DFMT_R8G8B8 || depth === 24) {
      rgba = new Uint8Array(width * height * 4);
      for (let i = 0; i < width * height; i++) {
        rgba[i * 4] = rasterData[i * 3 + 2];
        rgba[i * 4 + 1] = rasterData[i * 3 + 1];
        rgba[i * 4 + 2] = rasterData[i * 3];
        rgba[i * 4 + 3] = 255;
      }
    } else {
      return null;
    }

    return { name: name || 'texture', width, height, rgba };
  } catch {
    return null;
  }
}

// Encode RGBA pixels as a simple TXD with one uncompressed RGBA texture
export function encodeTxd(name: string, width: number, height: number, rgba: Uint8Array): Uint8Array {
  function makeSection(type: number, data: Uint8Array): Uint8Array {
    const header = new Uint8Array(12);
    header[0] = type & 0xff; header[1] = (type >> 8) & 0xff;
    header[2] = (type >> 16) & 0xff; header[3] = (type >> 24) & 0xff;
    const size = data.length;
    header[4] = size & 0xff; header[5] = (size >> 8) & 0xff;
    header[6] = (size >> 16) & 0xff; header[7] = (size >> 24) & 0xff;
    header[8] = 0x0C; header[9] = 0x02; header[10] = 0; header[11] = 0;
    const result = new Uint8Array(12 + data.length);
    result.set(header, 0);
    result.set(data, 12);
    return result;
  }

  // ARGB raster data
  const rasterData = new Uint8Array(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    rasterData[i * 4] = rgba[i * 4 + 2];   // B → ARGB[B]
    rasterData[i * 4 + 1] = rgba[i * 4 + 1];
    rasterData[i * 4 + 2] = rgba[i * 4];   // R
    rasterData[i * 4 + 3] = rgba[i * 4 + 3];
  }

  // Texture native struct
  const texNameBytes = new Uint8Array(32);
  const nameBytes = [...name.substring(0, 31)].map(c => c.charCodeAt(0));
  texNameBytes.set(nameBytes, 0);

  const alphaNameBytes = new Uint8Array(32);

  const texStruct = new Uint8Array(12 + 64 + 4 + 1 + 2 + 2 + 4 + 4);
  let o = 0;
  // platform = 8 (PC)
  texStruct[o++] = 8; texStruct[o++] = 0; texStruct[o++] = 0; texStruct[o++] = 0;
  // filter flags
  texStruct[o++] = 0x02; texStruct[o++] = 0x06; texStruct[o++] = 0; texStruct[o++] = 0;
  // name
  texStruct.set(texNameBytes, o); o += 32;
  // alpha name
  texStruct.set(alphaNameBytes, o); o += 32;
  // format D3DFMT_A8R8G8B8 = 21
  texStruct[o++] = 21; texStruct[o++] = 0; texStruct[o++] = 0; texStruct[o++] = 0;
  // hasAlpha
  texStruct[o++] = 1;
  // width
  texStruct[o++] = width & 0xff; texStruct[o++] = (width >> 8) & 0xff;
  // height
  texStruct[o++] = height & 0xff; texStruct[o++] = (height >> 8) & 0xff;
  // depth = 32, mipCount = 1, texType = 0, compression = 0
  texStruct[o++] = 32; texStruct[o++] = 1; texStruct[o++] = 0; texStruct[o++] = 0;
  // dataSize
  const ds = rasterData.length;
  texStruct[o++] = ds & 0xff; texStruct[o++] = (ds >> 8) & 0xff;
  texStruct[o++] = (ds >> 16) & 0xff; texStruct[o++] = (ds >> 24) & 0xff;

  // Texture native = struct + raster data + extension
  const texStructSection = makeSection(0x01, texStruct);
  const rasterSection = rasterData;
  const extensionSection = makeSection(0x03, new Uint8Array(0));

  const texNativeData = new Uint8Array(
    texStructSection.length + rasterSection.length + extensionSection.length
  );
  texNativeData.set(texStructSection, 0);
  texNativeData.set(rasterSection, texStructSection.length);
  texNativeData.set(extensionSection, texStructSection.length + rasterSection.length);

  const texNativeSection = makeSection(0x15, texNativeData);

  // Texture dict struct (count = 1)
  const dictStruct = new Uint8Array(4);
  dictStruct[0] = 1; // texture count
  const dictStructSection = makeSection(0x01, dictStruct);

  const dictExtension = makeSection(0x03, new Uint8Array(0));

  const dictData = new Uint8Array(
    dictStructSection.length + texNativeSection.length + dictExtension.length
  );
  dictData.set(dictStructSection, 0);
  dictData.set(texNativeSection, dictStructSection.length);
  dictData.set(dictExtension, dictStructSection.length + texNativeSection.length);

  return makeSection(0x16, dictData);
}
