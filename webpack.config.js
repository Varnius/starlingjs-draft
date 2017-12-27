const path = require('path');

module.exports = {
    devtool: '#eval-cheap-module-source-map',
    entry: {
        demo: './examples/demo/src/index.js',
        quads: './examples/quads/index.js',
    },
    output: {
        path: '/dist',
        filename: '[name].bundle.js',
        publicPath: '/static/',
    },
    stats: {
        errorDetails: true,
    },
    module: {
        rules: [
            { test: /\.js?/, use: 'babel-loader', include: [path.join(__dirname, 'src'), path.join(__dirname, 'examples')] },
        ],
    },
};
