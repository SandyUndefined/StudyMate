/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '.',
  testMatch: ['<rootDir>/src/**/__tests__/**/*.test.ts'],
  moduleNameMapper: {
    '^@studymate/shared$': '<rootDir>/../shared/src',
  },
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: {
        noUnusedLocals: false,
      },
    }],
  },
  clearMocks: true,
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/index.ts',
    '!src/**/__tests__/**',
  ],
  coverageReporters: ['text', 'lcov'],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 80,
      lines: 80,
    },
  },
}
