module.exports = {
    devtool: '#eval-cheap-module-source-map',
    entry: './src/index.js',
    output: {
        path: '/dist',
        filename: 'bundle.js',
    },
    stats: {
        errorDetails: true,
    },
    module: {
        rules: [
            { test: /\.js?/, use: 'babel-loader', include: 'src' },
        ],
    },
};
