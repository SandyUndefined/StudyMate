import type { Config } from 'jest'

const config: Config = {
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
        // Relax for tests — strict null checks still apply
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
  coverageThresholds: {
    global: {
      branches: 70,
      functions: 80,
      lines: 80,
    },
  },
}

export default config
