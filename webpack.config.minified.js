'use strict';

const webpack = require('webpack');
const OptimizeJsPlugin = require('optimize-js-plugin');

const defaultConfig = require('./webpack.config');

module.exports = Object.assign({}, defaultConfig, {
  devtool: undefined,

  output: Object.assign({}, defaultConfig.output, {
    filename: 'moize.min.js'
  }),

  plugins: defaultConfig.plugins.concat([
    new webpack.optimize.UglifyJsPlugin({
      compress: {
        booleans: true,
        conditionals: true,
        drop_console: true,
        drop_debugger: true,
        join_vars: true,
        screw_ie8: true,
        sequences: true,
        warnings: false
      }
    }),
    new OptimizeJsPlugin()
  ])
});
