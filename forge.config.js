const { spawn } = require("child_process");
const fs = require("fs-extra");
const path = require("path");

const config = {
	packagerConfig: {
		asar: true,
		extraResource: ["intermediate.pem"],
	},
	makers: [
		{
			name: "@electron-forge/maker-squirrel",
			config: {
				name: "mc-launcher",
			},
		},
		{
			name: "@electron-forge/maker-zip",
			platforms: ["darwin"],
		},
		{
			name: "@electron-forge/maker-deb",
			config: {},
			platforms: ["linux"],
		},
		{
			name: "@electron-forge/maker-rpm",
			config: {},
		},
		{
			name: "@electron-forge/maker-dmg",
			config: {},
		},
	],
	plugins: [
		[
			"@electron-forge/plugin-webpack",
			{
				mainConfig: "./webpack.main.config.js",
				devContentSecurityPolicy: "connect-src 'self' https://api.myapp.com 'unsafe-eval'",
				renderer: {
					config: "./webpack.renderer.config.js",
					entryPoints: [
						{
							html: "./src/index.html",
							js: "./src/renderer.ts",
							name: "dashboard",
						},
					],
				},
			},
		],
	],
};

module.exports = config;
