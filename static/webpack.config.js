const path = require('path')

module.exports = {
  entry: {
    main: path.resolve(__dirname, './staff.js'),
  },
  output: {
    path: path.resolve(__dirname, './dist'),
    filename: 'staff.bundle.js',
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
  },
  target : 'node', 
  resolve: {
  fallback: {
    fs: false
   }
  } 
}

