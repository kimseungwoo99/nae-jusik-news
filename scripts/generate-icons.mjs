import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const outputDirectory = path.join(process.cwd(), "public", "icons");

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const name = Buffer.from(type);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const checksum = Buffer.alloc(4);
  checksum.writeUInt32BE(crc32(Buffer.concat([name, data])));
  return Buffer.concat([length, name, data, checksum]);
}

function makeIcon(size, fileName) {
  const pixels = Buffer.alloc((size * 4 + 1) * size);
  const background = [11, 107, 83, 255];
  const foreground = [255, 255, 255, 255];

  const setPixel = (x, y, color) => {
    if (x < 0 || x >= size || y < 0 || y >= size) return;
    const offset = y * (size * 4 + 1) + 1 + x * 4;
    pixels.set(color, offset);
  };

  const roundedRect = (left, top, right, bottom, radius, color) => {
    for (let y = top; y < bottom; y += 1) {
      for (let x = left; x < right; x += 1) {
        const nearLeft = x < left + radius;
        const nearRight = x >= right - radius;
        const nearTop = y < top + radius;
        const nearBottom = y >= bottom - radius;
        let inside = true;
        if ((nearLeft || nearRight) && (nearTop || nearBottom)) {
          const centerX = nearLeft ? left + radius : right - radius - 1;
          const centerY = nearTop ? top + radius : bottom - radius - 1;
          inside = (x - centerX) ** 2 + (y - centerY) ** 2 <= radius ** 2;
        }
        if (inside) setPixel(x, y, color);
      }
    }
  };

  roundedRect(0, 0, size, size, Math.round(size * 0.22), background);
  roundedRect(
    Math.round(size * 0.23),
    Math.round(size * 0.21),
    Math.round(size * 0.77),
    Math.round(size * 0.76),
    Math.round(size * 0.055),
    foreground,
  );
  roundedRect(
    Math.round(size * 0.17),
    Math.round(size * 0.31),
    Math.round(size * 0.28),
    Math.round(size * 0.76),
    Math.round(size * 0.04),
    foreground,
  );
  roundedRect(
    Math.round(size * 0.34),
    Math.round(size * 0.32),
    Math.round(size * 0.49),
    Math.round(size * 0.47),
    Math.round(size * 0.025),
    background,
  );
  [0.35, 0.45, 0.56, 0.65].forEach((position, index) => {
    const left = index < 2 ? Math.round(size * 0.55) : Math.round(size * 0.34);
    roundedRect(
      left,
      Math.round(size * position),
      Math.round(size * 0.68),
      Math.round(size * position + size * 0.032),
      Math.max(1, Math.round(size * 0.012)),
      background,
    );
  });

  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header[8] = 8;
  header[9] = 6;

  const png = Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", header),
    chunk("IDAT", deflateSync(pixels, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
  writeFileSync(path.join(outputDirectory, fileName), png);
}

mkdirSync(outputDirectory, { recursive: true });
makeIcon(180, "apple-touch-icon.png");
makeIcon(192, "icon-192.png");
makeIcon(512, "icon-512.png");
console.log("PWA icons generated in public/icons");
