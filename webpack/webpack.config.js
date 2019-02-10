const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');
const webpack = require('webpack');

const ROOT = path.resolve(__dirname, '..');

module.exports = {
  devServer: {
    contentBase: './dist',
    inline: true,
    port: 3000,
    stats: {
      assets: false,
      chunkModules: false,
      chunks: true,
      colors: true,
      hash: false,
      timings: true,
      version: false,
    },
  },

  devtool: '#source-map',

  entry: path.join(ROOT, 'DEV_ONLY', 'index.tsx'),

  mode: 'development',

  module: {
    rules: [
      {
        enforce: 'pre',
        include: [path.resolve(ROOT, 'src')],
        loader: 'eslint-loader',
        test: /\.ts$/,
      },
      {
        include: [path.resolve(ROOT, 'src'), /DEV_ONLY/],
        loader: 'ts-loader',
        test: /\.tsx?$/,
      },
    ],
  },

  node: {
    fs: 'empty',
  },

  output: {
    filename: 'moize.js',
    library: 'moize',
    libraryTarget: 'umd',
    path: path.resolve(ROOT, 'dist'),
    umdNamedDefine: true,
  },

  plugins: [new webpack.EnvironmentPlugin(['NODE_ENV']), new HtmlWebpackPlugin()],

  resolve: {
    extensions: ['.ts', '.js', '.tsx', '.jsx'],
  },
};
