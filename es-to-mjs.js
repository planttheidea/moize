const fs = require('fs-extra');
const path = require('path');

const ES_DIRECTORY = path.join(__dirname, 'es');
const MJS_DIRECTORY = path.join(__dirname, 'mjs');

fs.readdirSync(ES_DIRECTORY).forEach((file) => {
  const fullPathJsFilename = path.resolve(ES_DIRECTORY, file);
  const fullPathMjsFilename = path.resolve(MJS_DIRECTORY, `${file.slice(0, -3)}.mjs`);

  fs.copySync(fullPathJsFilename, fullPathMjsFilename);

  console.log(`es/${file} -> mjs/${file.slice(0, -3)}.mjs`);
});
