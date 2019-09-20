const webpack = require('webpack')
const path = require('path')
const fs = require('fs')

const HtmlWebpackPlugin = require('html-webpack-plugin')
const ExtractTextPlugin = require('extract-text-webpack-plugin')
const UglifyJSPlugin = require('uglifyjs-webpack-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const CompressionPlugin = require('compression-webpack-plugin')
const CleanWebpackPlugin = require('clean-webpack-plugin')
const GitRevisionPlugin = require('git-revision-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')


const Dotenv = require('dotenv-webpack')
const { envPath, defaultEnvPath } = require('./config')

require('@babel/polyfill')

const extractCSS = new ExtractTextPlugin('bundle-[hash:6].css')
const gitRevisionPlugin = new GitRevisionPlugin()

module.exports = {
  devtool: false,
  mode: 'production',
  entry: [
    '@babel/polyfill',
    path.resolve(__dirname, 'src/index.js'),
  ],
  output: {
    filename: '[name].[hash].bundle.js',
    chunkFilename: '[name].[chunkhash].js',
    publicPath: '/',
    path: path.resolve(__dirname, 'dist'),
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules\/(?!(dom7|swiper)\/).*/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              '@babel/preset-env',
              '@babel/preset-react',

            ],
            plugins: [
              '@babel/plugin-transform-arrow-functions',
            ]
          }
        }
      },
      {
        test: /\.css$/,
        use: extractCSS.extract({
          fallback: 'style-loader',
          use: [
            {
              loader: 'css-loader',
              options: { minimize: true },
            },
          ],
        })
      },
      {
        test: /\.scss$/,
        use: extractCSS.extract({
          use: [
            {
              loader: 'css-loader',
              options: { minimize: true },
            },
            {
              loader: 'sass-loader',
              options: {
                includePaths: [path.resolve(__dirname, 'src/styles')],
              },
            },
          ],
        }),
      },
    ],
  },
  resolve: {
    modules: [
      'node_modules',
      path.resolve(__dirname, 'src'),
    ],
    extensions: ['.js'],
    alias: {
      constants: path.resolve(__dirname, 'src/constants/'),
      components: path.resolve(__dirname, 'src/components/'),
      utils: path.resolve(__dirname, 'src/utils/'),
      contracts: path.resolve(__dirname, 'contracts'),
      klaytn: path.resolve(__dirname, 'src/klaytn/'),
      reducers: path.resolve(__dirname, 'src/reducers/'),
      actions: path.resolve(__dirname, 'src/actions'),
      images: path.resolve(__dirname, 'static/images/'),
      pages: path.resolve(__dirname, 'src/pages/'),
    },
  },
  optimization: {
    minimizer: [
      new UglifyJSPlugin({
        uglifyOptions: {
          compress: {
            drop_console: true,
          }
        }
      }),
    ],
    splitChunks: {
      automaticNameDelimiter: '~',
      cacheGroups: {
        commons: {
          test: /[\\/]node_modules[\\/]/,
          chunks: 'all',
          name: 'vendor',
          enforce: true,
        },
      },
    },    
  },
  plugins: [
    new CleanWebpackPlugin('dist', { root: __dirname }),
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, 'static/index.html'),
      inject: 'body',
    }),
    extractCSS,
    new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),
    new webpack.NoEmitOnErrorsPlugin(),
    new webpack.DefinePlugin({
      'DEV': false,
      'process.env.version': JSON.stringify(gitRevisionPlugin.commithash().slice(0, 7)),
      DEPLOYED_ADDRESS: JSON.stringify(fs.readFileSync('deployedAddress', 'utf8').replace(/\n|\r/g, "")),
      DEPLOYED_ABI: fs.existsSync('deployedABI') && fs.readFileSync('deployedABI', 'utf8'),
    }),
    new CompressionPlugin(),
    new CopyWebpackPlugin([
      {
        from: path.resolve(__dirname, 'static'),
        to: path.resolve(__dirname, 'dist'),
      },
    ]),
    new Dotenv({
      path: envPath,
      defaults: defaultEnvPath,
      systemvars: true,
    }),
    new MiniCssExtractPlugin({
      filename: 'bundle.[chunkHash].css',
      chunkFilename: 'bundle.[chunkHash].css',
    }),
  ],
}
