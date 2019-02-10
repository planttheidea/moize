import typescript from 'rollup-plugin-typescript';
import { terser } from 'rollup-plugin-terser';

import pkg from './package.json';

const EXTERNALS = [
  ...Object.keys(pkg.dependencies || {}),
  ...Object.keys(pkg.peerDependencies || {})
];

const UMD_CONFIG = {
  external: EXTERNALS,
  input: 'src/index.ts',
  output: {
    exports: 'default',
    file: pkg.browser,
    format: 'umd',
    globals: {
      'fast-equals': 'fe',
      'fast-stringify': 'stringify',
      'micro-memoize': 'memoize',
    },
    name: pkg.name,
    sourcemap: true,
  },
  plugins: [
    typescript({
      typescript: require('typescript'),
    }),
  ],
};

const FORMATTED_CONFIG = Object.assign({}, UMD_CONFIG, {
  output: [
    Object.assign({}, UMD_CONFIG.output, {
      file: pkg.main,
      format: 'cjs',
    }),
    Object.assign({}, UMD_CONFIG.output, {
      file: pkg.module,
      format: 'es',
    }),
  ],
});

const MINIFIED_CONFIG = Object.assign({}, UMD_CONFIG, {
  output: Object.assign({}, UMD_CONFIG.output, {
    file: pkg.browser.replace('.js', '.min.js'),
    sourcemap: false,
  }),
  plugins: UMD_CONFIG.plugins.concat([terser()]),
});

export default [UMD_CONFIG, FORMATTED_CONFIG, MINIFIED_CONFIG];
