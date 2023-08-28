/* eslint-disable @typescript-eslint/no-var-requires */

import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import ESLintWebpackPlugin from 'eslint-webpack-plugin';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import webpack from 'webpack';

const ROOT = dirname(fileURLToPath(import.meta.url));
const PORT = 3000;

export default {
    devServer: {
        port: 3000,
    },

    devtool: 'source-map',

    entry: join(ROOT, 'dev-playground', 'index.ts'),

    mode: 'development',

    module: {
        rules: [
            {
                include: [
                    resolve(ROOT, 'dev-playground'),
                    resolve(ROOT, 'src'),
                    resolve(ROOT, '..', '..', '..', 'core'),
                ],
                loader: 'babel-loader',
                options: {
                    cacheDirectory: true,
                    presets: [
                        '@babel/preset-typescript',
                        ['@babel/preset-env', { loose: true, modules: false }],
                    ],
                },
                test: /\.(js|ts|tsx)$/,
            },
        ],
    },

    output: {
        filename: 'moize-plugins.js',
        library: 'moize-plugins',
        libraryTarget: 'umd',
        path: resolve(ROOT, 'dist'),
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
