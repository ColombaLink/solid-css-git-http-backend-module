module.exports = {
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.json',
    },
  },
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },

  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/test/util/SetupTests.ts'],
  collectCoverage: true,
  coverageReporters: ['text', 'lcov'],
  coveragePathIgnorePatterns: [
    '/dist/',
    '/node_modules/',
    '/test/',
  ],
  moduleNameMapper: {
    '^jose/(.*)$': '<rootDir>/node_modules/jose/dist/node/cjs/$1',
  },
  // Slower machines had problems calling the WebSocket integration callbacks on time
  testTimeout: 600_000,
};
