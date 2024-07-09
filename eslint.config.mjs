import { defaultConfig } from 'eslint-config-decent';
import tsEslint from 'typescript-eslint';

export default tsEslint.config(...defaultConfig(), {
  files: ['tests/**/*.ts'],
  rules: {
    '@typescript-eslint/no-confusing-void-expression': 'off',
  },
});
