import type { Config } from 'jest'
import nextJest from 'next/jest.js'

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
})

const config: Config = {
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  testMatch: ['<rootDir>/__tests__/**/*.test.(ts|tsx|mts)'],
  collectCoverageFrom: [
    '<rootDir>/lib/**/*.ts',
    '<rootDir>/workers/**/*.ts',
    '<rootDir>/services/**/*.ts',
    '<rootDir>/store/**/*.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 60,
      lines: 60,
      statements: 60,
    },
  },
}

export default createJestConfig(config)