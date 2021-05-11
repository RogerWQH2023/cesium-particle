const path = require('path');
const webpack = require('webpack');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

const cesiumSource = 'node_modules/cesium/Source';
const NODE_ENV = process.env.NODE_ENV;
const prdWebpackConfig= {
  mode: 'production',
  entry: path.resolve(__dirname, 'src/index.js'),
  output: {
    path: path.join(__dirname, 'lib'),
    filename: "cesium-particle.js",
    libraryTarget: 'commonjs2'  //模块输出方式
  },
  resolve: {
    extensions: ['.js', '.json'],
    alias: {
      'cesium': path.resolve(__dirname, cesiumSource)
    },
    fallback: {
      fs: false
    }
  },
  externals: {
    cesium: 'cesium' //打包时候排除cesium
  },
  module: {
    rules: [
      {
        test: /(\.js)$/,
        exclude: /node_modules/,
        loader: 'babel-loader'
      },
      {
        test: /\.(frag|vert)$/,
        loader: 'webpack-glsl-loader'
      }
    ]
  }
};

if (NODE_ENV !== 'publish') {
  prdWebpackConfig.plugins.push(new BundleAnalyzerPlugin())
}

module.exports = prdWebpackConfig;
