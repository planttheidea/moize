import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import babel from 'rollup-plugin-babel';
import { uglify } from 'rollup-plugin-uglify';

export default [
  {
    input: 'src/index.js',
    output: {
      exports: 'named',
      file: 'dist/moize.js',
      format: 'umd',
      name: 'moize',
      sourcemap: true,
    },
    plugins: [
      resolve({
        mainFields: ['module', 'jsnext:main', 'main'],
      }),
      commonjs({
        include: 'node_modules/micro-memoize/**',
      }),
      babel({
        exclude: 'node_modules/**',
      }),
    ],
  },
  {
    input: 'src/index.js',
    output: {
      exports: 'named',
      file: 'dist/moize.min.js',
      format: 'umd',
      name: 'moize',
    },
    plugins: [
      resolve({
        mainFields: ['module', 'jsnext:main', 'main'],
      }),
      commonjs({
        include: 'node_modules/micro-memoize/**',
        sourceMap: false,
      }),
      babel({
        exclude: 'node_modules/**',
      }),
      uglify(),
    ],
  },
];
