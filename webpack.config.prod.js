const webpack = require('webpack');

module.exports = {
    devtool: 'source-map',
    entry: './src/index.js',
    output: {
        path: '/dist',
        filename: '[name].bundle.js',
        sourceMapFilename: '[file].map',
    },
    stats: {
        errorDetails: true,
    },
    module: {
        rules: [
            { test: /\.js?/, use: 'babel-loader', include: 'src' },
        ],
    },
    plugins: [
        new webpack.DefinePlugin({
            'process.env.NODE_ENV': JSON.stringify('production'),
        }),
        new webpack.optimize.UglifyJsPlugin({ sourceMap: true }),
    ],
};
