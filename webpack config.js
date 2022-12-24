const path = require('path');

module.exports = {
  output: {
    path: path.resolve(__dirname, 'server'),
    filename: 'server.js',
  },
  module: {
    rules: [{ test: /\.txt$/, use: 'raw-loader' }],
  },
};