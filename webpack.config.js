var path = require('path');
var webpack = require('webpack');
var BundleTracker = require('webpack-bundle-tracker');
new BundleTracker({filename: './webpack-stats.json'})

module.exports = {
    context: __dirname,
    entry: './assets/js/index',
    output: {
        path: path.resolve('./assets/bundles/'),
        filename: 'app.js'
    },
    plugins: [
        new BundleTracker({filename: './webpack-stats.json'})
      ],
    module: {
    rules: [
        {
        test: /\.vue$/,
        loader: 'vue-loader',
        options: {
            loaders: {
            js: 'babel-loader'
            }
        }
        },
        {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
        }
    ]
    },
    resolve: {
        alias: {vue: 'vue/dist/vue.js'}
    }
};