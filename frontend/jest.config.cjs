module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>'],
  moduleFileExtensions: ['ts', 'tsx', 'js'],
  testMatch: ['**/__tests__/**/*.test.(ts|tsx)'],
  moduleNameMapper: {
    '^expo-constants$': '<rootDir>/__mocks__/expo-constants.ts',
  },
  globals: {
    'ts-jest': { tsconfig: { isolatedModules: true } }
  }
};
