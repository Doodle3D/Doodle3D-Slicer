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
    plugins: [require('babel-plugin-transform-object-rest-spread')],
    babelrc: false
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
      'doodle3d-slicer': path.resolve(__dirname, '../src/index.js'),
      'clipper-lib': '@doodle3d/clipper-lib',
      'clipper-js': '@doodle3d/clipper-js'
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
        use: 'yml-loader'
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
