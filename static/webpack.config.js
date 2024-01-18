const path = require('path')

module.exports = {
  entry: {
    main: path.resolve(__dirname, './staffIndex.js'),
  },
  output: {
    path: path.resolve(__dirname, './dist'),
    filename: '[name].bundle.js',
  },
  resolve: {
        extensions: ['.ts', '.tsx', '.js', '.json']
  },
  module: {
        rules: [{
            // Include ts, tsx, js, and jsx files.
            test: /\.(ts|js)x?$/,
            exclude: /node_modules/,
            use: {
             loader: 'babel-loader',
             }
        }],
  }
}

