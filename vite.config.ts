import { oxlintConfig } from 'oxlint-config-decent';
import { type UserConfig } from 'vite';
import { defineConfig } from 'vite-plus';

type LintConfig = ReturnType<typeof oxlintConfig>;

// The typescript-compat and vitest-compat plugins need the TypeScript JS API,
// which TypeScript 7 no longer ships. Opt out of them (and their rules) instead
// of carrying the @typescript/typescript6 side-by-side alias.
const baseLintConfig: LintConfig = oxlintConfig({
  enableReact: false,
  enableTestingLibrary: false,
  enableTypeScriptEstreePlugins: false,
  enableVitest: true,
});

const config: UserConfig = defineConfig({
  fmt: {
    printWidth: 200,
    singleQuote: true,
  },
  lint: {
    ...baseLintConfig,
    rules: {
      ...baseLintConfig.rules,
      // Every switch in this codebase handles the remaining union members in a
      // default clause; treat that as exhaustive.
      'typescript/switch-exhaustiveness-check': ['error', { considerDefaultExhaustiveForUnions: true }],
      // Since v66 this rule requires error constructors to be shaped as
      // (message, options). The published error classes here take other
      // signatures, e.g. (code, message) and (response); complying would be a
      // breaking API change. The rule has no configuration to relax this.
      'unicorn-compat/custom-error-definition': 'off',
    },
    overrides: [
      ...(baseLintConfig.overrides ?? []),
      {
        // Plain JavaScript helper scripts have no type annotations, so the
        // type-aware unsafe-* rules only produce noise for untyped imports.
        files: ['**/*.mjs', '**/*.cjs'],
        rules: {
          'typescript/no-unsafe-argument': 'off',
          'typescript/no-unsafe-assignment': 'off',
          'typescript/no-unsafe-call': 'off',
          'typescript/no-unsafe-member-access': 'off',
          'typescript/no-unsafe-return': 'off',
        },
      },
      {
        // CommonJS test fixtures exist specifically to exercise require().
        files: ['**/*.cjs'],
        rules: {
          'typescript/no-require-imports': 'off',
        },
      },
    ],
  },
  test: {
    testTimeout: 90_000,
    hookTimeout: 90_000,
  },
  pack: {
    entry: ['src/index.ts'],
    format: ['esm', 'cjs'],
    dts: { oxc: true },
  },
});

export default config;
