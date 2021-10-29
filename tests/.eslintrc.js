module.exports = {
  // Override our default settings just for this directory
  env: {
    mocha: true,
    es6: true,
  },
  globals: {
    describe: true,
    before: true,
    after: true,
    beforeEach: true,
    afterEach: true,
    it: true,
  },
  rules: {
    'max-classes-per-file': 'off',
    '@typescript-eslint/unbound-method': 'off',
    '@typescript-eslint/no-unsafe-call': 'off',
    '@typescript-eslint/no-unsafe-argument': 'off',
    '@typescript-eslint/no-unsafe-member-access': 'off',
  },
};
