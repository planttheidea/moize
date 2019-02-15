module.exports = {
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  roots: ['<rootDir>'],
  transform: {
    '\\.(ts|tsx)$': 'ts-jest',
  },
  testRegex: '/__tests__/.*\\.(ts|tsx|js)$',
  verbose: true,
};
