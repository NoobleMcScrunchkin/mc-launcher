const path = require("path");

module.exports = {
	/**
	 * This is the main entry point for your application, it's the first file
	 * that runs in the main process.
	 */
	entry: "./src/index.ts",
	output: {
		path: path.resolve(__dirname, ".webpack/main"),
		publicPath: "/",
		filename: "index.js",
	},
	devServer: {
		historyApiFallback: true,
	},
	// Put your normal webpack config below here
	module: {
		rules: require("./webpack.rules"),
	},
	resolve: {
		extensions: [".js", ".ts", ".jsx", ".tsx", ".css", ".json"],
		fallback: {
			fs: false,
			path: false,
			https: false,
		},
	},
};
