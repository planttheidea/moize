const fs = require('fs-extra');
const path = require('path');

const MJS_DIRECTORY = path.join(__dirname, 'mjs');

fs.readdirSync(MJS_DIRECTORY).forEach((file) => {
  const fullPathJsFilename = path.resolve(MJS_DIRECTORY, file);
  const fullPathMjsFilename = path.resolve(MJS_DIRECTORY, `${file.slice(0, -3)}.mjs`);

  fs.moveSync(fullPathJsFilename, fullPathMjsFilename);

  console.log(`mjs/${file} -> mjs/${file.slice(0, -3)}.mjs`);
});
