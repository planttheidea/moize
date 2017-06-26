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
    new webpack.LoaderOptionsPlugin({
      debug: false,
      minimize: true
    }),
    new webpack.optimize.OccurrenceOrderPlugin(),
    new webpack.optimize.ModuleConcatenationPlugin(),
    new webpack.optimize.UglifyJsPlugin({
      comments: false,
      compress: {
        booleans: true,
        comparisons: true,
        conditionals: true,
        dead_code: true,
        drop_console: true,
        drop_debugger: true,
        evaluate: true,
        if_return: true,
        join_vars: true,
        loops: true,
        properties: true,
        screw_ie8: true,
        sequences: true,
        unused: true,
        warnings: false
      },
      sourceMap: false
    }),
    new OptimizeJsPlugin({
      sourceMap: false
    })
  ])
});
