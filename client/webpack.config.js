const webpack = require('webpack');
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const WorkboxWebpackPlugin = require("workbox-webpack-plugin");


const config = {
    entry: [
        'react-hot-loader/patch',
        './index.tsx'
    ],
    output: {
        path: path.resolve(__dirname, '../static'),
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
        static: '../static'
    },
    plugins: [
        new HtmlWebpackPlugin ({
            inject: true,
            template: './index.html',
            filename: '../static/index.html'
        }),
        new WorkboxWebpackPlugin.InjectManifest({
            swSrc: "./sw.ts",
            swDest: "../static/sw.js"
        })
    ]
};

module.exports = config;
