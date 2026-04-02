module.exports = {
  preset: '@shelf/jest-mongodb',
  testEnvironment: 'node',
  setupFilesAfterEnv: [],
  globalSetup: undefined,
  globalTeardown: undefined,
  testMatch: ["**/tests/**/*.js"],
  coverageDirectory: "coverage",
  collectCoverageFrom: ["server.js", "routes/**/*.js", "models/**/*.js", "middleware/**/*.js", "utils/**/*.js"],
};
