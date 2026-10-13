// Generates the favicons in public/ from the Nano Stores logo: the round logo
// for browsers, a full-bleed square for iOS and maskable Android icons.
// The output is committed; run it again only when the logo changes.
// https://evilmartians.com/chronicles/how-to-favicon-in-2021-six-files-that-fit-most-needs
import { writeFile } from 'node:fs/promises'
import sharp from 'sharp'

const mark =
  '<path fill="#fff" fill-rule="evenodd" d="M269.463 385 122 281.746l86.384-33.697 126.397 88.503L269.463 385zM231.036 115l147.463 103.254-86.384 33.697-126.397-88.503L231.036 115z"/>'
const circle = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500"><circle cx="250" cy="250" r="250"/>${mark}</svg>`
// The mark stays within 0.28 of the size from the center, inside the 0.4
// safe zone of maskable icons, so the square needs no extra padding.
const square = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500"><rect width="500" height="500"/>${mark}</svg>`

const out = new URL('../public/', import.meta.url)

function png(svg, size) {
  return sharp(Buffer.from(svg), { density: 300 })
    .resize(size)
    .png({ compressionLevel: 9 })
    .toBuffer()
}

// An ICO file can hold a PNG image as is: a 6-byte header, one 16-byte
// directory entry and the PNG data.
function ico(image, size) {
  const header = Buffer.alloc(22)
  header.writeUInt16LE(1, 2)
  header.writeUInt16LE(1, 4)
  header.writeUInt8(size, 6)
  header.writeUInt8(size, 7)
  header.writeUInt16LE(1, 10)
  header.writeUInt16LE(32, 12)
  header.writeUInt32LE(image.length, 14)
  header.writeUInt32LE(header.length, 18)
  return Buffer.concat([header, image])
}

await writeFile(new URL('icon.svg', out), circle + '\n')
await writeFile(new URL('favicon.ico', out), ico(await png(circle, 32), 32))
await writeFile(new URL('icon-192.png', out), await png(circle, 192))
await writeFile(new URL('icon-512.png', out), await png(circle, 512))
await writeFile(new URL('icon-mask.png', out), await png(square, 512))
await writeFile(new URL('apple-touch-icon.png', out), await png(square, 180))
