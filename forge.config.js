const { spawn } = require("child_process");
const fs = require("fs-extra");
const path = require("path");

const config = {
	packagerConfig: {
		asar: true,
		extraResource: ["intermediate.pem", "icons/app.ico"],
		icon: "./icons/cube.ico",
	},
	config: {
		forge: {
			packagerConfig: {
				icon: "./icons/cube",
			},
		},
	},
	publishers: [
		{
			name: "@electron-forge/publisher-github",
			config: {
				repository: {
					owner: "NoobleMcScrunchkin",
					name: "mc-launcher",
				},
				prerelease: false,
			},
		},
	],
	makers: [
		{
			name: "@electron-forge/maker-squirrel",
			config: {
				name: "mc-launcher",
				setupIcon: "./icons/cube.ico",
				options: {
					icon: "./icons/cube.ico",
				},
				// remoteReleases: "https://github.com/NoobleMcScrunchkin/mc-launcher",
			},
		},
		{
			name: "@electron-forge/maker-zip",
			platforms: ["darwin"],
		},
		{
			name: "@electron-forge/maker-deb",
			config: {
				options: {
					icon: "./icons/cube.png",
				},
			},
			platforms: ["linux"],
		},
		{
			name: "@electron-forge/maker-rpm",
			config: {},
		},
		{
			name: "@electron-forge/maker-dmg",
			config: {
				options: {
					icon: "./icons/cube.icns",
				},
			},
		},
	],
	plugins: [
		{
			name: "@electron-forge/plugin-webpack",
			config: {
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
		},
	],
};

module.exports = config;
