module.exports = {
  preset: 'jest-expo',
  testMatch: ['**/tests/**/*.test.ts', '**/tests/**/*.test.tsx', '**/test/**/*.test.ts', '**/test/**/*.test.tsx'],
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1' },
  clearMocks: true,
  collectCoverageFrom: ['src/core/**/*.{ts,tsx}', 'src/features/**/*.{ts,tsx}'],
};
