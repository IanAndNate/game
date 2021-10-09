const webpack = require('webpack');
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const WorkboxWebpackPlugin = require("workbox-webpack-plugin");
const CopyWebpackPlugin = require('copy-webpack-plugin');

const config = {
    entry: [
        'react-hot-loader/patch',
        './src/index.tsx'
    ],
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'bundle.[hash].js',
        publicPath: '/'
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            }
        ]
    },
    resolve: {
        extensions: [
            '.js',
            '.jsx',
            '.ts',
            '.tsx'
        ],
        alias: {
            'react-dom': '@hot-loader/react-dom'
        }
    },
    devServer: {
        static: 'static'
    },
    plugins: [
        new HtmlWebpackPlugin ({
            inject: true,
            template: './src/index.html',
            filename: 'index.html'
        }),
        new WorkboxWebpackPlugin.InjectManifest({
            swSrc: "./src/sw.ts",
            swDest: "sw.js"
        }),
        new CopyWebpackPlugin({
            patterns: [
                { from: "static", to: "." }
            ]
        }),
    ]
};

module.exports = config;
