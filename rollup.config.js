import babel from 'rollup-plugin-babel';
import commonjs from 'rollup-plugin-commonjs';
import resolve from 'rollup-plugin-node-resolve';
import {uglify} from 'rollup-plugin-uglify';

export default [
  {
    input: 'src/index.js',
    output: {
      exports: 'named',
      name: 'moize',
      file: 'dist/moize.js',
      format: 'umd',
      sourcemap: true
    },
    plugins: [
      resolve({
        jsnext: true,
        main: true,
        module: true
      }),
      commonjs({
        include: 'node_modules/micro-memoize/**'
      }),
      babel({
        exclude: 'node_modules/**'
      })
    ]
  },
  {
    input: 'src/index.js',
    output: {
      exports: 'named',
      name: 'moize',
      file: 'dist/moize.min.js',
      format: 'umd'
    },
    plugins: [
      resolve({
        jsnext: true,
        main: true,
        module: true
      }),
      commonjs({
        include: 'node_modules/micro-memoize/**',
        sourceMap: false
      }),
      babel({
        exclude: 'node_modules/**'
      }),
      uglify()
    ]
  }
];
