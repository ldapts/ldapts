'use strict';

module.exports = {
  arrowParens: 'always',
  bracketSpacing: true,
  printWidth: 200,
  quoteProps: 'as-needed',
  semi: true,
  singleQuote: true,
  useTabs: false,
  tabWidth: 2,
  trailingComma: 'all',

  overrides: [
    {
      files: '*.js',
      options: {
        parser: 'babel',
      },
    },
    {
      files: '*.json',
      options: {
        parser: 'json',
      },
    },
    {
      files: '*.ts',
      options: {
        parser: 'typescript',
      },
    },
  ],
};
