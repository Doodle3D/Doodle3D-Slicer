const path = require('path');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const HTMLWebpackPlugin = require('html-webpack-plugin');

const devMode = process.env.NODE_ENV !== 'production';
const analyzeBundle = process.env.ANALYZE_BUNDLE;

const babelLoader = {
  loader: 'babel-loader',
  options: {
    presets: [
      require('babel-preset-env'),
      require('babel-preset-stage-0'),
      require('babel-preset-react')
    ],
    plugins: [
      require('babel-plugin-transform-class-properties'),
      require('babel-plugin-transform-object-rest-spread'),
      require('babel-plugin-transform-runtime'),
      require('babel-plugin-transform-es2015-classes')
    ],
    babelrc: false
  }
};

module.exports = {
  entry: './index.js',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist')
  },
  resolve: {
    alias: {
      'doodle3d-slicer': path.resolve(__dirname, 'src/'),
      'clipper-lib': '@doodle3d/clipper-lib',
      'clipper-js': '@doodle3d/clipper-js',
      'doodle3d-core': `@doodle3d/doodle3d-core/${devMode ? 'module' : 'lib'}`,
      'cal': '@doodle3d/cal'
    }
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: babelLoader
      }, { // make THREE global available to three.js examples
        test: /three\/examples\/.+\.js/,
        use: 'imports-loader?THREE=three'
      }, {
        test: /\.yml$/,
        use: 'yml-loader'
      }, {
        test: /\.worker\.js$/,
        use: ['worker-loader', babelLoader]
      }, {
        test: /\.(png|jpg|gif)$/,
        use: ['url-loader?name=images/[name].[ext]']
      }, {
        test: /\.glsl$/,
        use: ['raw-loader']
      }
    ]
  },
  plugins: analyzeBundle ? [new BundleAnalyzerPlugin()] : [
    new HTMLWebpackPlugin({
      title: 'Doodle3D Slicer',
      template: require('html-webpack-template'),
      inject: false,
      appMountId: 'app'
    })
  ],
  devtool: "source-map",
  devServer: {
    contentBase: 'dist'
  }
};
