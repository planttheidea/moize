const ESLintWebpackPlugin = require('eslint-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');
const webpack = require('webpack');

const ROOT = path.resolve(__dirname, '..');
const PORT = 3000;

module.exports = {
    cache: true,

    devServer: {
        host: 'localhost',
        port: PORT,
    },

    devtool: 'source-map',

    entry: [path.resolve(ROOT, 'DEV_ONLY', 'index.ts')],

    mode: 'development',

    module: {
        rules: [
            {
                include: [
                    path.resolve(ROOT, 'src'),
                    path.resolve(ROOT, 'DEV_ONLY'),
                ],
                loader: require.resolve('babel-loader'),
                options: {
                    cacheDirectory: true,
                },
                test: /\.(js|ts|tsx)$/,
            },
        ],
    },

    output: {
        filename: 'moize.js',
        library: 'moize',
        libraryTarget: 'umd',
        path: path.resolve(ROOT, 'dist'),
        publicPath: `http://localhost:${PORT}/`,
        umdNamedDefine: true,
    },

    plugins: [
        new webpack.EnvironmentPlugin(['NODE_ENV']),
        new HtmlWebpackPlugin(),
        new ESLintWebpackPlugin(),
    ],

    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
    },
};
