module.exports = {
  mode: "development",
  devtool: "inline-source-map",
  entry: {
    packet: "./src/packet"
  },
  output: {
    library: "Packet",
    libraryExport: "default",
    libraryTarget: "umd",
    globalObject: 'this',
    filename: "[name].js"
  },
  resolve: {
    extensions: [".ts", ".tsx", ".js"]
  },
  module: {
    rules: [
      { test: /\.tsx?$/, loader: "ts-loader" }
    ]
  }
}
