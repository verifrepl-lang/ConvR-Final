// Pure JS PNG decoder/encoder using pako for deflate/inflate
// Used for HP icon recoloring

import { inflate, deflate } from 'pako';

const PNG_MAGIC = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);

// CRC32 table
const crcTable = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c;
  }
  return table;
})();

function crc32(data: Uint8Array, start = 0, end = data.length): number {
  let crc = 0xffffffff;
  for (let i = start; i < end; i++) {
    crc = crcTable[(crc ^ data[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function readUint32BE(buf: Uint8Array, offset: number): number {
  return ((buf[offset] << 24) | (buf[offset + 1] << 16) | (buf[offset + 2] << 8) | buf[offset + 3]) >>> 0;
}

function writeUint32BE(buf: Uint8Array, offset: number, value: number): void {
  buf[offset] = (value >>> 24) & 0xff;
  buf[offset + 1] = (value >>> 16) & 0xff;
  buf[offset + 2] = (value >>> 8) & 0xff;
  buf[offset + 3] = value & 0xff;
}

interface PngImage {
  width: number;
  height: number;
  bitDepth: number;
  colorType: number;
  rgba: Uint8Array; // RGBA pixels, width*height*4 bytes
}

// Defilter PNG scanline
function unfilter(
  filterType: number,
  scanline: Uint8Array,
  prev: Uint8Array,
  bytesPerPixel: number
): Uint8Array {
  const out = new Uint8Array(scanline.length);
  for (let i = 0; i < scanline.length; i++) {
    const x = scanline[i];
    const a = i >= bytesPerPixel ? out[i - bytesPerPixel] : 0;
    const b = prev[i];
    const c = i >= bytesPerPixel ? prev[i - bytesPerPixel] : 0;

    let val: number;
    switch (filterType) {
      case 0: val = x; break;
      case 1: val = x + a; break;
      case 2: val = x + b; break;
      case 3: val = x + Math.floor((a + b) / 2); break;
      case 4: {
        const p = a + b - c;
        const pa = Math.abs(p - a);
        const pb = Math.abs(p - b);
        const pc = Math.abs(p - c);
        val = x + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c);
        break;
      }
      default: val = x;
    }
    out[i] = val & 0xff;
  }
  return out;
}

export function parsePng(data: Uint8Array): PngImage {
  // Validate magic
  for (let i = 0; i < 8; i++) {
    if (data[i] !== PNG_MAGIC[i]) throw new Error('Not a PNG file');
  }

  let offset = 8;
  let width = 0, height = 0, bitDepth = 0, colorType = 0;
  const idatChunks: Uint8Array[] = [];

  while (offset < data.length) {
    const length = readUint32BE(data, offset);
    const typeBytes = data.slice(offset + 4, offset + 8);
    const type = String.fromCharCode(...typeBytes);
    const chunkData = data.slice(offset + 8, offset + 8 + length);

    if (type === 'IHDR') {
      width = readUint32BE(chunkData, 0);
      height = readUint32BE(chunkData, 4);
      bitDepth = chunkData[8];
      colorType = chunkData[9];
    } else if (type === 'IDAT') {
      idatChunks.push(chunkData);
    } else if (type === 'IEND') {
      break;
    }

    offset += 12 + length;
  }

  // Concatenate IDAT chunks and inflate
  let totalLen = 0;
  for (const c of idatChunks) totalLen += c.length;
  const idatData = new Uint8Array(totalLen);
  let pos = 0;
  for (const c of idatChunks) {
    idatData.set(c, pos);
    pos += c.length;
  }

  const rawData: Uint8Array = inflate(idatData) as Uint8Array;

  // Calculate bytes per pixel
  const channels = colorType === 2 ? 3 : colorType === 6 ? 4 : colorType === 0 ? 1 : colorType === 4 ? 2 : 3;
  const bytesPerPixel = Math.ceil(channels * bitDepth / 8);
  const stride = width * bytesPerPixel;

  const rgba = new Uint8Array(width * height * 4);
  let rawOffset = 0;
  let prev: Uint8Array<ArrayBuffer> = new Uint8Array(stride);

  for (let y = 0; y < height; y++) {
    const filterType = rawData[rawOffset++];
    const scanline = rawData.slice(rawOffset, rawOffset + stride);
    rawOffset += stride;

    const row = unfilter(filterType, scanline, prev, bytesPerPixel);
    prev = row as Uint8Array<ArrayBuffer>;

    for (let x = 0; x < width; x++) {
      const rgbaIdx = (y * width + x) * 4;
      const rowIdx = x * bytesPerPixel;

      if (colorType === 6) {
        // RGBA
        rgba[rgbaIdx] = row[rowIdx];
        rgba[rgbaIdx + 1] = row[rowIdx + 1];
        rgba[rgbaIdx + 2] = row[rowIdx + 2];
        rgba[rgbaIdx + 3] = row[rowIdx + 3];
      } else if (colorType === 2) {
        // RGB
        rgba[rgbaIdx] = row[rowIdx];
        rgba[rgbaIdx + 1] = row[rowIdx + 1];
        rgba[rgbaIdx + 2] = row[rowIdx + 2];
        rgba[rgbaIdx + 3] = 255;
      } else if (colorType === 4) {
        // Grayscale + Alpha
        rgba[rgbaIdx] = row[rowIdx];
        rgba[rgbaIdx + 1] = row[rowIdx];
        rgba[rgbaIdx + 2] = row[rowIdx];
        rgba[rgbaIdx + 3] = row[rowIdx + 1];
      } else {
        // Grayscale
        rgba[rgbaIdx] = row[rowIdx];
        rgba[rgbaIdx + 1] = row[rowIdx];
        rgba[rgbaIdx + 2] = row[rowIdx];
        rgba[rgbaIdx + 3] = 255;
      }
    }
  }

  return { width, height, bitDepth, colorType, rgba };
}

export function encodePng(width: number, height: number, rgba: Uint8Array): Uint8Array {
  const bytesPerPixel = 4;
  const stride = width * bytesPerPixel;

  // Build raw image data with filter bytes (use filter type 0 = None)
  const rawSize = height * (1 + stride);
  const raw = new Uint8Array(rawSize);
  for (let y = 0; y < height; y++) {
    const rowStart = y * stride;
    raw[y * (1 + stride)] = 0; // filter type: None
    raw.set(rgba.slice(rowStart, rowStart + stride), y * (1 + stride) + 1);
  }

  const compressed = deflate(raw, { level: 6 });

  // Build PNG
  const parts: Uint8Array[] = [];

  function makeChunk(type: string, data: Uint8Array): Uint8Array {
    const typeBytes = new Uint8Array([...type].map(c => c.charCodeAt(0)));
    const buf = new Uint8Array(12 + data.length);
    writeUint32BE(buf, 0, data.length);
    buf.set(typeBytes, 4);
    buf.set(data, 8);
    const crcInput = new Uint8Array(4 + data.length);
    crcInput.set(typeBytes, 0);
    crcInput.set(data, 4);
    writeUint32BE(buf, 8 + data.length, crc32(crcInput));
    return buf;
  }

  // Magic
  parts.push(PNG_MAGIC);

  // IHDR
  const ihdr = new Uint8Array(13);
  writeUint32BE(ihdr, 0, width);
  writeUint32BE(ihdr, 4, height);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 6;  // color type RGBA
  ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  parts.push(makeChunk('IHDR', ihdr));

  // IDAT
  parts.push(makeChunk('IDAT', compressed));

  // IEND
  parts.push(makeChunk('IEND', new Uint8Array(0)));

  let total = 0;
  for (const p of parts) total += p.length;
  const result = new Uint8Array(total);
  let off = 0;
  for (const p of parts) {
    result.set(p, off);
    off += p.length;
  }

  return result;
}

// Recolor all non-transparent pixels to target hex color
export function recolorPng(data: Uint8Array, hexColor: string): Uint8Array {
  const clean = hexColor.replace(/^#/, '');
  const tr = parseInt(clean.substring(0, 2), 16);
  const tg = parseInt(clean.substring(2, 4), 16);
  const tb = parseInt(clean.substring(4, 6), 16);

  const img = parsePng(data);
  const newRgba = new Uint8Array(img.rgba.length);

  for (let i = 0; i < img.width * img.height; i++) {
    const alpha = img.rgba[i * 4 + 3];
    if (alpha > 0) {
      newRgba[i * 4] = tr;
      newRgba[i * 4 + 1] = tg;
      newRgba[i * 4 + 2] = tb;
      newRgba[i * 4 + 3] = alpha;
    } else {
      newRgba[i * 4] = 0;
      newRgba[i * 4 + 1] = 0;
      newRgba[i * 4 + 2] = 0;
      newRgba[i * 4 + 3] = 0;
    }
  }

  return encodePng(img.width, img.height, newRgba);
}
