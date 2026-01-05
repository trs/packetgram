module.exports = {
  mode: "development",
  devtool: "inline-source-map",
  entry: {
    packet: "./src/packet"
  },
  output: {
    path: require("path").resolve(__dirname, "dist"),
    library: {
      name: "Packet",
      export: "default",
      type: "umd"
    },
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
