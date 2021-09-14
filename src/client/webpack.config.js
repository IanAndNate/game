const webpack = require('webpack');
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const config = {
    entry: [
        'react-hot-loader/patch',
        './index.js'
    ],
    output: {
        path: path.resolve(__dirname, '../server/static'),
        filename: 'bundle.[hash].js'
    },
    module: {
        rules: [
            {
                test: /\.(js|jsx)$/,
                use: 'babel-loader',
                exclude: /node_modules/
            }
        ]
    },
    resolve: {
        extensions: [
            '.js',
            '.jsx'
        ],
        alias: {
            'react-dom': '@hot-loader/react-dom'
        }
    },
    devServer: {
        contentBase: './dist'
    },
    plugins: [
        new HtmlWebpackPlugin ({
            inject: true,
            template: '../server/static/index.html'
        })
    ]
};

module.exports = config;
