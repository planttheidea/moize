/* eslint-disable @typescript-eslint/no-var-requires */

const fs = require('fs');
const path = require('path');

const pkg = require('./package.json');

const SOURCE = path.join(__dirname, pkg.module);
const SOURCE_MAP = `${SOURCE}.map`;
const DESTINATION = path.join(__dirname, 'mjs', 'index.mjs');
const DESTINATION_MAP = `${DESTINATION}.map`;

const getFileName = (filename) => {
  const split = filename.split('/');

  return split[split.length - 1];
};

try {
  if (!fs.existsSync(path.join(__dirname, 'mjs'))) {
    fs.mkdirSync(path.join(__dirname, 'mjs'));
  }

  fs.copyFileSync(SOURCE, DESTINATION);

  const contents = fs
    .readFileSync(DESTINATION, { encoding: 'utf8' })
    .replace('fast-equals', 'fast-equals/dist/fast-equals.mjs')
    .replace('fast-stringify', 'fast-stringify/mjs/index.mjs')
    .replace('micro-memoize', 'micro-memoize/mjs/index.mjs')
    .replace(/\/\/# sourceMappingURL=(.*)/, (match, value) => {
      return match.replace(value, 'index.mjs.map');
    });

  fs.writeFileSync(DESTINATION, contents, { encoding: 'utf8' });

  console.log(`Copied ${getFileName(SOURCE)} to ${getFileName(DESTINATION)}`);

  fs.copyFileSync(SOURCE_MAP, DESTINATION_MAP);

  console.log(`Copied ${getFileName(SOURCE_MAP)} to ${getFileName(DESTINATION_MAP)}`);
} catch (error) {
  console.error(error);

  process.exit(1);
}
