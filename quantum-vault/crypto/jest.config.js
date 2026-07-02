module.exports = {
  testEnvironment: 'node',
  coverageThreshold: {
    global: {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    }
  },
  collectCoverageFrom: [
    '**/*.js',
    '!**/node_modules/**',
    '!**/tests/**',
    '!**/benchmarks/**',
    '!jest.config.js'
  ],
  testMatch: [
    '**/tests/**/*.test.js'
  ],
  coverageDirectory: 'coverage',
  verbose: true
};
