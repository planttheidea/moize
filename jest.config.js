module.exports = {
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  roots: ['<rootDir>'],
  setupFiles: ['<rootDir>/jest.init.js'],
  transform: {
    '\\.(js|ts|tsx)$': 'babel-jest',
  },
  testRegex: '/__tests__/.*\\.(ts|tsx|js)$',
  verbose: true,
};
