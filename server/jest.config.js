import dotenv from 'dotenv';

dotenv.config({path: '.env.test'});

/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
export default {
	// https://kulshekhar.github.io/ts-jest/docs/guides/esm-support/
	preset: 'ts-jest/presets/default-esm',
	globals: {
		'ts-jest': {
			useESM: true,
		},
	},
	moduleNameMapper: {
		'^(\\.{1,2}/.*)\\.js$': '$1',
	},
	testEnvironment: 'node',
	testPathIgnorePatterns: ["<rootDir>/node_modules", "<rootDir>/dist", "<rootDir>/assemblyscript"],
	setupFilesAfterEnv: ["<rootDir>/test/dbSetup.js"],
};
