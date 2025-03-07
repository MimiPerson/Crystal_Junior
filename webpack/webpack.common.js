const webpack = require("webpack");
const path = require("path");
const CopyPlugin = require("copy-webpack-plugin");
const srcDir = path.join(__dirname, "..", "src");
const dotenv = require("dotenv");

dotenv.config();

module.exports = {
  entry: {
    popup: path.join(srcDir, "popup.tsx"),
    options: path.join(srcDir, "options.tsx"),
    background: path.join(srcDir, "background.ts"),
    content_script: path.join(srcDir, "content_script.tsx"),
  },
  output: {
    path: path.join(__dirname, "../dist/js"),
    filename: "[name].js",
  },
  optimization: {
    splitChunks: {
      name: "vendor",
      chunks(chunk) {
        return chunk.name !== "background";
      },
    },
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: [".ts", ".tsx", ".js"],
  },
  resolve: {
    extensions: [".ts", ".tsx", ".js"],
    fallback: { crypto: false, os: false, path: false },
  },
  plugins: [
    new CopyPlugin({
      patterns: [{ from: ".", to: "../", context: "public" }],
      options: {},
    }),
    new webpack.DefinePlugin({
      "process.env.API_KEY": JSON.stringify(process.env.API_KEY),
    }),
  ],
};
