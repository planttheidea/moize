/* eslint-disable @typescript-eslint/no-var-requires */

const fs = require('fs');
const path = require('path');

const pkg = require('./package.json');

const BASE_PATH = __dirname;
const SOURCE_ENTRY = path.join(BASE_PATH, pkg.module);
const SOURCE_MAP = `${SOURCE_ENTRY}.map`;
const SOURCE_TYPES = path.join(BASE_PATH, 'index.d.ts');
const DESTINATION = 'mjs';
const DESTINATION_ENTRY = path.join(BASE_PATH, DESTINATION, 'index.mjs');
const DESTINATION_MAP = `${DESTINATION_ENTRY}.map`;
const DESTINATION_TYPES = path.join(BASE_PATH, DESTINATION, 'index.d.mts');

function getFileName(filename) {
    return filename.replace(`${BASE_PATH}/`, '');
}

try {
    if (!fs.existsSync(path.join(__dirname, 'mjs'))) {
        fs.mkdirSync(path.join(__dirname, 'mjs'));
    }

    fs.copyFileSync(SOURCE_ENTRY, DESTINATION_ENTRY);

    const contents = fs
        .readFileSync(DESTINATION_ENTRY, { encoding: 'utf8' })
        .replace('fast-equals', 'fast-equals/dist/fast-equals.mjs')
        .replace('fast-stringify', 'fast-stringify/mjs/index.mjs')
        .replace('micro-memoize', 'micro-memoize/mjs/index.mjs')
        .replace(/\/\/# sourceMappingURL=(.*)/, (match, value) => {
            return match.replace(value, 'index.mjs.map');
        });

    fs.writeFileSync(DESTINATION_ENTRY, contents, { encoding: 'utf8' });

    console.log(
        `Copied ${getFileName(SOURCE_ENTRY)} to ${getFileName(
            DESTINATION_ENTRY
        )}`
    );

    fs.copyFileSync(SOURCE_MAP, DESTINATION_MAP);

    console.log(`Copied ${SOURCE_MAP} to ${getFileName(DESTINATION_MAP)}`);

    fs.copyFileSync(SOURCE_TYPES, DESTINATION_TYPES);

    console.log(
        `Copied ${getFileName(SOURCE_TYPES)} to ${getFileName(
            DESTINATION_TYPES
        )}`
    );
} catch (error) {
    console.error(error);

    process.exit(1);
}
