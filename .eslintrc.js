'use strict';

module.exports = {
  'root': true,
  'plugins': [
    'jsdoc',
    'mocha',
    'promise',
    'security',
    '@typescript-eslint'
  ],
  extends: [
    'eslint:recommended',
    'airbnb-base',
  ],
  'env': {
    'node': true,
    'es6': true
  },
  'settings': {
    'import/resolver': {
      'node': {
        'extensions': ['.js', '.ts']
      }
    }
  },
  rules: {
    'curly': ['error', 'all'],
    'callback-return': ['error', ['callback', 'cb', 'next', 'done']],
    'class-methods-use-this': 'off',
    'consistent-return': 'off',
    'handle-callback-err': ['error', '^.*err' ],
    'new-cap': 'off',
    'no-console': 'error',
    'no-else-return': 'error',
    'no-eq-null': 'off',
    'no-global-assign': 'error',
    'no-loop-func': 'off',
    'no-lone-blocks': 'error',
    'no-negated-condition': 'error',
    'no-shadow': 'off',
    'no-template-curly-in-string': 'error',
    'no-undef': 'error',
    'no-underscore-dangle': 'off',
    'no-unsafe-negation': 'error',
    'no-use-before-define': ['error', 'nofunc'],
    'no-useless-rename': 'error',
    'padding-line-between-statements': ['error',
      { 'blankLine': 'always', 'prev': [
          'directive',
          'block',
          'block-like',
          'multiline-block-like',
          'cjs-export',
          'cjs-import',
          'class',
          'export',
          'import',
          'if'
        ], 'next': '*' },
      { 'blankLine': 'never', 'prev': 'directive', 'next': 'directive' },
      { 'blankLine': 'any', 'prev': '*', 'next': ['if', 'for', 'cjs-import', 'import'] },
      { 'blankLine': 'any', 'prev': ['export', 'import'], 'next': ['export', 'import'] },
      { 'blankLine': 'always', 'prev': '*', 'next': ['try', 'function', 'switch'] },
      { 'blankLine': 'always', 'prev': 'if', 'next': 'if' },
      { 'blankLine': 'never', 'prev': ['return', 'throw'], 'next': '*' }
    ],
    'strict': ['error', 'safe'],
    'no-new': 'off',
    'no-empty': 'error',
    'no-empty-function': 'error',
    'valid-jsdoc': 'off',
    'yoda': 'error',

    'import/extensions': 'off',
    'import/no-unresolved': 'off',

    'jsdoc/check-alignment': 'error',
    'jsdoc/check-indentation': 'off',
    'jsdoc/check-param-names': 'off',
    'jsdoc/check-tag-names': 'error',
    'jsdoc/check-types': 'error',
    'jsdoc/newline-after-description': 'off',
    'jsdoc/no-undefined-types': 'off',
    'jsdoc/require-description': 'off',
    'jsdoc/require-description-complete-sentence': 'off',
    'jsdoc/require-example': 'off',
    'jsdoc/require-hyphen-before-param-description': 'error',
    'jsdoc/require-param': 'error',
    'jsdoc/require-param-description': 'off',
    'jsdoc/require-param-name': 'error',
    'jsdoc/require-param-type': 'error',
    'jsdoc/require-returns-description': 'off',
    'jsdoc/require-returns-type': 'error',
    'jsdoc/valid-types': 'error',

    'promise/always-return': 'error',
    'promise/always-catch': 'off',
    'promise/catch-or-return': ['error', {'allowThen': true }],
    'promise/no-native': 'off',
    'promise/param-names': 'error',

    'security/detect-buffer-noassert': 'error',
    'security/detect-child-process': 'error',
    'security/detect-disable-mustache-escape': 'error',
    'security/detect-eval-with-expression': 'error',
    'security/detect-new-buffer': 'error',
    'security/detect-no-csrf-before-method-override': 'error',
    'security/detect-non-literal-fs-filename': 'error',
    'security/detect-non-literal-regexp': 'error',
    'security/detect-non-literal-require': 'off',
    'security/detect-object-injection': 'off',
    'security/detect-possible-timing-attacks': 'error',
    'security/detect-pseudoRandomBytes': 'error',
    'security/detect-unsafe-regex': 'error',

    // Override airbnb
    'eqeqeq': ['error', 'smart'],
    'func-names': 'error',
    'id-length': ['error', {'exceptions': ['_', '$', 'e', 'i', 'j', 'k', 'q', 'x', 'y']}],
    'no-param-reassign': 'off', // Work toward enforcing this rule
    'radix': 'off',
    'spaced-comment': 'off',
    'max-len': 'off',
    'no-continue': 'off',
    'no-plusplus': 'off',
    'no-prototype-builtins': 'off',
    'no-restricted-syntax': [
      'error',
      'DebuggerStatement',
      'LabeledStatement',
      'WithStatement'
    ],
    'no-restricted-properties': ['error', {
      'object': 'arguments',
      'property': 'callee',
      'message': 'arguments.callee is deprecated'
    }, {
      'property': '__defineGetter__',
      'message': 'Please use Object.defineProperty instead.'
    }, {
      'property': '__defineSetter__',
      'message': 'Please use Object.defineProperty instead.'
    }],
    'no-useless-escape': 'off',
    'object-shorthand': ['error', 'always', {
      'ignoreConstructors': false,
      'avoidQuotes': true,
      'avoidExplicitReturnArrows': true
    }],
    // 'prefer-arrow-callback': ['error', { 'allowNamedFunctions': true }],
    'prefer-spread': 'error',
    'prefer-destructuring': 'off'
  },
  overrides: [{
    files: [
      '**/*.tests.ts',
    ],
    rules: {
      'mocha/no-async-describe': 'error',
      'mocha/no-exclusive-tests': 'error',
      'mocha/no-global-tests': 'error',
      'mocha/no-identical-title': 'error',
      'mocha/no-nested-tests': 'error',
      'mocha/no-pending-tests': 'error',
    }
  }, {
    files: [
      '*.ts',
    ],
    parser: '@typescript-eslint/parser',
    parserOptions: {
      project: './tsconfig.lint.json',
    },
    extends: [
      'eslint:recommended',
      'airbnb-base',
      'plugin:@typescript-eslint/recommended',
      'plugin:import/typescript',
    ],
    rules: {
      'class-methods-use-this': 'off',
      'indent': 'off',
      'max-len': 'off',
      'no-dupe-class-members': 'off',
      'no-extra-semi': 'off',
      'no-new': 'off',
      'no-param-reassign': 'off',
      'no-underscore-dangle': 'off',
      'no-useless-constructor': 'off',
      'no-unused-expressions': 'error',
      'no-restricted-syntax': [
        'error',
        'DebuggerStatement',
        'LabeledStatement',
        'WithStatement'
      ],

      'import/prefer-default-export': 'off',
      'import/no-cycle': 'off',
      'import/no-extraneous-dependencies': 'off',
      'import/extensions': ['error', 'never'],

      '@typescript-eslint/array-type': ['error', { default: 'array' }],
      '@typescript-eslint/await-thenable': 'error',
      '@typescript-eslint/adjacent-overload-signatures': 'error',
      '@typescript-eslint/class-name-casing': 'error',
      '@typescript-eslint/consistent-type-assertions': 'error',
      '@typescript-eslint/consistent-type-definitions': 'error',
      '@typescript-eslint/no-extraneous-class': 'error',
      '@typescript-eslint/explicit-function-return-type': 'error',
      '@typescript-eslint/explicit-member-accessibility': ["error"],
      '@typescript-eslint/generic-type-naming': 'error',
      '@typescript-eslint/interface-name-prefix': ['error', 'never'],
      '@typescript-eslint/member-ordering': ['error', {
        default: [
          // Index signature
          'signature',
          // Fields
          'private-field',
          'public-field',
          'protected-field',
          // Constructors
          'public-constructor',
          'protected-constructor',
          'private-constructor',
          // Methods
          'public-method',
          'protected-method',
          'private-method',
        ],
      }],
      '@typescript-eslint/no-array-constructor': 'error',
      '@typescript-eslint/no-empty-interface': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-extra-semi': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-for-in-array': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error',
      '@typescript-eslint/no-parameter-properties': ['error', { allows: ['readonly'] }],
      '@typescript-eslint/no-require-imports': 'error',
      '@typescript-eslint/no-this-alias': 'error',
      '@typescript-eslint/no-throw-literal': 'error',
      '@typescript-eslint/no-unnecessary-type-assertion': 'error',
      '@typescript-eslint/no-unused-expressions': 'error',
      '@typescript-eslint/no-useless-constructor': 'error',
      '@typescript-eslint/no-unused-vars': 'error',
      '@typescript-eslint/prefer-for-of': 'error',
      '@typescript-eslint/prefer-includes': 'error',
      '@typescript-eslint/prefer-regexp-exec': 'warn',
      '@typescript-eslint/prefer-string-starts-ends-with': 'error',
      '@typescript-eslint/promise-function-async': 'off',
      '@typescript-eslint/require-await': 'error',
      '@typescript-eslint/restrict-plus-operands': 'error',
      '@typescript-eslint/unbound-method': 'error',
      '@typescript-eslint/unified-signatures': 'error',
    },
  }]
};
