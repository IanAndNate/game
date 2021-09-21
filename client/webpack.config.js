const webpack = require('webpack');
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const config = {
    entry: [
        'react-hot-loader/patch',
        './index.js'
    ],
    output: {
        path: path.resolve(__dirname, '../static'),
        filename: 'bundle.[hash].js',
        publicPath: '/'
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
        contentBase: '../static'
    },
    plugins: [
        new HtmlWebpackPlugin ({
            inject: true,
            template: './index.html',
            filename: '../static/index.html'
        })
    ]
};

module.exports = config;
