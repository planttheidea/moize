'use strict';

const FlowBabelWebpackPlugin = require('flow-babel-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');
const webpack = require('webpack');

const ROOT = path.resolve(__dirname, '..');
const PORT = 3000;

module.exports = {
  cache: true,

  devServer: {
    contentBase: path.join(ROOT, 'dist'),
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

  devtool: '#source-map',

  entry: [path.resolve(ROOT, 'DEV_ONLY', 'App.js')],

  mode: 'development',

  module: {
    rules: [
      {
        enforce: 'pre',
        include: [path.resolve(ROOT, 'src')],
        loader: 'eslint-loader',
        options: {
          configFile: '.eslintrc',
          failOnError: true,
          failOnWarning: false,
          fix: true,
          formatter: require('eslint-friendly-formatter')
        },
        test: /\.js$/
      },
      {
        include: [path.resolve(ROOT, 'src'), path.resolve(ROOT, 'DEV_ONLY')],
        options: {
          cacheDirectory: true,
          presets: ['react']
        },
        test: /\.js$/,
        loader: 'babel-loader'
      }
    ]
  },

  output: {
    filename: 'moize.js',
    library: 'moize',
    libraryTarget: 'umd',
    path: path.resolve(ROOT, 'dist'),
    publicPath: `http://localhost:${PORT}/`,
    umdNamedDefine: true
  },

  plugins: [new webpack.EnvironmentPlugin(['NODE_ENV']), new HtmlWebpackPlugin(), new FlowBabelWebpackPlugin()]
};
