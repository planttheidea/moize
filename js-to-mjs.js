const fs = require('fs');
const path = require('path');

const pkg = require('./package.json');

const SOURCE = path.join(__dirname, pkg.module);
const DESTINATION = path.join(__dirname, pkg.module.replace('esm', 'mjs'));

const getFileName = (filename) => {
  const split = filename.split('/');

  return split[split.length - 1];
};

fs.copyFile(SOURCE, DESTINATION, (error) => {
  if (error) {
    throw error;
  }

  console.log(`Copied ${getFileName(SOURCE)} to ${getFileName(DESTINATION)}`);
});
