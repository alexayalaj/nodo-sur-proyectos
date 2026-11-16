module.exports = {
  testEnvironment: 'node',
  testMatch: ['<rootDir>/backend/tests/**/*.test.js'],
  globalSetup: '<rootDir>/backend/tests/helpers/globalSetup.js',
  globalTeardown: '<rootDir>/backend/tests/helpers/globalTeardown.js',
  setupFiles: ['<rootDir>/backend/tests/helpers/entorno.js'],
  collectCoverageFrom: ['backend/**/*.js', '!backend/tests/**', '!backend/scripts/**', '!backend/server.js'],
  coverageDirectory: 'coverage',
};
