const fs = require('fs');
const path = require('path');
const util = require('util');

const writeFile = util.promisify(fs.writeFile);
const readFile = util.promisify(fs.readFile);

async function write(filePath, data) {
  const p = path.resolve(__dirname, filePath);
  await writeFile(p, JSON.stringify(data, null, 2));
  console.log(`Exported file into ${p}`);
}

async function read(filePath) {
  const p = path.resolve(__dirname, filePath);
  const rs = await readFile(p);
  return rs.toString('utf-8');
}

module.exports = {
  write,
  read
}
