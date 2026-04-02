import type { Config } from 'jest';

const config: Config = {
  preset:              'ts-jest',
  testEnvironment:     'node',
  rootDir:             '.',
  testMatch:           ['**/tests/**/*.test.ts'],
  moduleNameMapper:    { '^@/(.*)$': '<rootDir>/src/$1' },
  setupFiles:          ['dotenv/config'],
  globals: {
    'ts-jest': { tsconfig: { strict: false } },
  },
};

export default config;
