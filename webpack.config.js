const path = require('path');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
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
        use: [{
          loader: 'worker-loader',
          options: {
            inline: false,
            name: '[name].js'
          }
        }, babelLoader]
      }, {
        test: /\.(png|jpg|gif)$/,
        use: [{
          loader: 'file-loader',
          options: { name: '[path][name].[ext]' }
        },
        ...(!devMode ? [{
          loader: 'image-webpack-loader',
          options: {
            mozjpeg: { progressive: true, quality: 65 },
            optipng: { enabled: false },
            pngquant: { quality: '65-90', speed: 4 }
          }
        }] : [])]
      }, {
        test: /\.stl$/,
        use: {
          loader: 'file-loader'
        }
      }, {
        test: /\.glsl$/,
        use: ['raw-loader']
      }
    ]
  },
  plugins: analyzeBundle ? [new BundleAnalyzerPlugin()] : [
    new HTMLWebpackPlugin({
      favicon: 'favicon.ico',
      title: 'Doodle3D Slicer',
      template: require('html-webpack-template'),
      inject: false,
      hash: !devMode,
      appMountId: 'app'
    }),
  ],
  devtool: devMode ? 'source-map' : false,
  devServer: {
    contentBase: 'dist'
  }
};
