const path = require('path');
// const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const HTMLWebpackPlugin = require('html-webpack-plugin');

const babelLoader = {
  loader: 'babel-loader',
  options: {
    presets: [
      ['latest', { 
        'modules': false, 
        'loose': true 
      }]
    ],
    plugins: [require('babel-plugin-transform-object-rest-spread')]
  }
}

module.exports = {
  entry: './index.js',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist')
  },
  resolve: {
    alias: {
      'doodle3d-slicer': path.resolve(__dirname, '../src/index.js')
    }
  },
  module: {
    rules:  [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: babelLoader
      },
      {
        test: /\.yml$/,
        use: [ 'json-loader', 'yaml-frontmatter-loader' ]
      },
      {
        test: /\.worker\.js$/,
        use: ['worker-loader', babelLoader]
      }
    ]
  },
  plugins: [
    new HTMLWebpackPlugin({
      title: 'Doodle3D Slicer - Simple example'
    }),
  ],
  devtool: "source-map",
  devServer: {
    contentBase: 'dist'
  }
};
