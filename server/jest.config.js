require('dotenv').config({path: '.env.test'});

/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testPathIgnorePatterns: ["<rootDir>/node_modules", "<rootDir>/dist"],
  setupFilesAfterEnv: ["<rootDir>/test/dbSetup.js"],
};