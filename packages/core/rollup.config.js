import typescript from '@rollup/plugin-typescript';
import terser from '@rollup/plugin-terser';
import localTypescript from 'typescript';

import pkg from './package.json';

const UMD_CONFIG = {
    input: 'src/index.ts',
    output: {
        exports: 'named',
        file: pkg.browser,
        format: 'umd',
        name: pkg.name,
        sourcemap: true,
    },
    plugins: [typescript({ typescript: localTypescript })],
};

const FORMATTED_CONFIG = {
    ...UMD_CONFIG,
    output: [
        { ...UMD_CONFIG.output, file: pkg.main, format: 'cjs' },
        { ...UMD_CONFIG.output, file: pkg.module, format: 'es' },
    ],
};

const MINIFIED_CONFIG = {
    ...UMD_CONFIG,
    output: {
        ...UMD_CONFIG.output,
        file: pkg.browser.replace('.js', '.min.js'),
        sourcemap: false,
    },
    plugins: [...UMD_CONFIG.plugins, terser()],
};

export default [UMD_CONFIG, FORMATTED_CONFIG, MINIFIED_CONFIG];
