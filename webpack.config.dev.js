'use strict';

const path = require('path');
const webpack = require('webpack');
const FlowBabelWebpackPlugin = require('flow-babel-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const defaultConfig = require('./webpack.config');

const PORT = 3000;

const loaders = defaultConfig.module.loaders.map((loaderObject) => {
  if (loaderObject.loader !== 'babel') {
    return Object.assign({}, loaderObject, {
      cacheable: true
    });
  }

  return Object.assign({}, loaderObject, {
    cacheable: true,
    include: loaderObject.include.concat([
      path.resolve(__dirname, 'DEV_ONLY')
    ]),
    query: {
      cacheDirectory: true,
      plugins: [
        'transform-decorators-legacy'
      ],
      presets: [
        'react'
      ]
    }
  });
});

module.exports = Object.assign({}, defaultConfig, {
  devServer: {
    contentBase: './dist',
    host: 'localhost',
    inline: true,
    lazy: false,
    noInfo: false,
    quiet: false,
    port: PORT,
    stats: {
      colors: true,
      progress: true
    }
  },

  entry: [
    path.resolve(__dirname, 'DEV_ONLY', 'App.js')
  ],

  eslint: Object.assign({}, defaultConfig.eslint, {
    failOnWarning: false
  }),

  module: Object.assign({}, defaultConfig.module, {
    loaders
  }),

  output: Object.assign({}, defaultConfig.output, {
    publicPath: `http://localhost:${PORT}/`
  }),

  plugins: defaultConfig.plugins.concat([
    new HtmlWebpackPlugin(),
    new FlowBabelWebpackPlugin()
  ])
});
