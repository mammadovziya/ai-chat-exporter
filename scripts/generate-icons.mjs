import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { deflateSync } from "node:zlib";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const iconDir = path.join(rootDir, "extension", "icons");
const sizes = [16, 32, 48, 128];

function makeCrcTable() {
  const table = new Uint32Array(256);
  for (let index = 0; index < 256; index += 1) {
    let value = index;
    for (let bit = 0; bit < 8; bit += 1) {
      value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
    }
    table[index] = value >>> 0;
  }
  return table;
}

const crcTable = makeCrcTable();

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data = Buffer.alloc(0)) {
  const typeBuffer = Buffer.from(type, "ascii");
  const length = Buffer.alloc(4);
  const crc = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 0);
  return Buffer.concat([length, typeBuffer, data, crc]);
}

function isInsideRoundedRect(x, y, left, top, width, height, radius) {
  const right = left + width - 1;
  const bottom = top + height - 1;
  const innerLeft = left + radius;
  const innerRight = right - radius;
  const innerTop = top + radius;
  const innerBottom = bottom - radius;

  if (x >= innerLeft && x <= innerRight && y >= top && y <= bottom) {
    return true;
  }
  if (x >= left && x <= right && y >= innerTop && y <= innerBottom) {
    return true;
  }

  const cornerX = x < innerLeft ? innerLeft : innerRight;
  const cornerY = y < innerTop ? innerTop : innerBottom;
  return ((x - cornerX) ** 2) + ((y - cornerY) ** 2) <= radius ** 2;
}

function setPixel(pixels, size, x, y, color) {
  if (x < 0 || y < 0 || x >= size || y >= size) {
    return;
  }

  const offset = ((y * size) + x) * 4;
  pixels[offset] = color[0];
  pixels[offset + 1] = color[1];
  pixels[offset + 2] = color[2];
  pixels[offset + 3] = color[3] ?? 255;
}

function fillRoundedRect(pixels, size, left, top, width, height, radius, color) {
  for (let y = Math.floor(top); y < Math.ceil(top + height); y += 1) {
    for (let x = Math.floor(left); x < Math.ceil(left + width); x += 1) {
      if (isInsideRoundedRect(x, y, left, top, width, height, radius)) {
        setPixel(pixels, size, x, y, color);
      }
    }
  }
}

function fillRect(pixels, size, left, top, width, height, color) {
  for (let y = Math.floor(top); y < Math.ceil(top + height); y += 1) {
    for (let x = Math.floor(left); x < Math.ceil(left + width); x += 1) {
      setPixel(pixels, size, x, y, color);
    }
  }
}

function drawLine(pixels, size, x1, y1, x2, y2, width, color) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const steps = Math.max(Math.abs(dx), Math.abs(dy), 1);
  const radius = Math.max(1, width / 2);

  for (let index = 0; index <= steps; index += 1) {
    const x = x1 + (dx * index / steps);
    const y = y1 + (dy * index / steps);
    fillRoundedRect(pixels, size, x - radius, y - radius, radius * 2, radius * 2, radius, color);
  }
}

function makeIcon(size) {
  const pixels = new Uint8Array(size * size * 4);

  fillRoundedRect(pixels, size, 0, 0, size, size, size * 0.22, [18, 49, 45, 255]);
  fillRoundedRect(pixels, size, size * 0.06, size * 0.06, size * 0.88, size * 0.88, size * 0.18, [23, 66, 57, 255]);

  const docLeft = size * 0.24;
  const docTop = size * 0.16;
  const docWidth = size * 0.48;
  const docHeight = size * 0.68;
  fillRoundedRect(pixels, size, docLeft, docTop, docWidth, docHeight, size * 0.07, [251, 250, 246, 255]);
  fillRect(pixels, size, docLeft + docWidth * 0.72, docTop, docWidth * 0.28, docHeight * 0.26, [230, 223, 210, 255]);

  const lineWidth = Math.max(2, Math.round(size * 0.055));
  drawLine(pixels, size, size * 0.34, size * 0.45, size * 0.61, size * 0.45, lineWidth, [45, 116, 104, 255]);
  drawLine(pixels, size, size * 0.34, size * 0.56, size * 0.54, size * 0.56, lineWidth, [45, 116, 104, 255]);
  drawLine(pixels, size, size * 0.34, size * 0.67, size * 0.49, size * 0.67, lineWidth, [45, 116, 104, 255]);

  const arrow = [217, 122, 74, 255];
  const arrowWidth = Math.max(2, Math.round(size * 0.08));
  drawLine(pixels, size, size * 0.58, size * 0.73, size * 0.84, size * 0.73, arrowWidth, arrow);
  drawLine(pixels, size, size * 0.75, size * 0.62, size * 0.86, size * 0.73, arrowWidth, arrow);
  drawLine(pixels, size, size * 0.75, size * 0.84, size * 0.86, size * 0.73, arrowWidth, arrow);

  return pixels;
}

function encodePng(size, pixels) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;

  const stride = (size * 4) + 1;
  const raw = Buffer.alloc(stride * size);
  for (let y = 0; y < size; y += 1) {
    raw[y * stride] = 0;
    Buffer.from(pixels.buffer, y * size * 4, size * 4).copy(raw, (y * stride) + 1);
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pngChunk("IHDR", ihdr),
    pngChunk("IDAT", deflateSync(raw, { level: 9 })),
    pngChunk("IEND")
  ]);
}

await mkdir(iconDir, { recursive: true });

for (const size of sizes) {
  await writeFile(path.join(iconDir, `icon${size}.png`), encodePng(size, makeIcon(size)));
}

console.log(`Generated ${sizes.length} extension icons in ${path.relative(rootDir, iconDir)}`);
