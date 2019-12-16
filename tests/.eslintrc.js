module.exports = {
  // Override our default settings just for this directory
  env: {
    mocha: true,
    es6: true
  },
  globals: {
    describe: true,
    before: true,
    after: true,
    beforeEach: true,
    afterEach: true,
    it: true
  },
  rules: {
    'max-classes-per-file': 'off',
  },
};
