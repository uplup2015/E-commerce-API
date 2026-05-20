/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  clearMocks: true,
  testMatch: ['**/__tests__/**/*.test.ts'],
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
  modulePathIgnorePatterns: ['<rootDir>/.claude', '<rootDir>/dist'],
  testPathIgnorePatterns: ['<rootDir>/.claude', '<rootDir>/dist', '<rootDir>/node_modules'],
};
