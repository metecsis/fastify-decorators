module.exports = {
  preset: 'ts-jest',
  testEnvironment: './jest.environment.cjs',
  globals: {
    'ts-jest': {
      tsconfig: './tsconfig.spec.json',
    },
  },
  moduleNameMapper: {
    'fastify-decorators/plugins': 'fastify-decorators/plugins/index.cjs',
    'fastify-decorators/testing': 'fastify-decorators/testing/index.cjs',
    'fastify-decorators': 'fastify-decorators/index.cjs',
  },
};
