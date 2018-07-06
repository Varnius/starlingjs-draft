const webpack = require('webpack')
const path = require('path')

module.exports = {
  devtool: 'source-map',
  entry: path.join(__dirname, './src/index.js'),
  output: {
    path: path.join(__dirname, './dist'),
    filename: 'bundle.js'
    //sourceMapFilename: '[file].map',
  },
  stats: {
    errorDetails: true
  },
  module: {
    rules: [
      {
        test: /\.js?/,
        use: 'babel-loader',
        include: path.join(__dirname, 'src')
      }
    ]
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify('production')
    }),
    new webpack.optimize.UglifyJsPlugin({ sourceMap: true })
  ]
}
