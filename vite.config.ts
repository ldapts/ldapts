import { oxlintConfig } from 'eslint-config-decent/oxlint';
import { type UserConfig } from 'vite';
import { defineConfig } from 'vite-plus';

type LintConfig = ReturnType<typeof oxlintConfig>;
type LintRules = NonNullable<LintConfig['rules']>;

const baseLintConfig: LintConfig = oxlintConfig({ enableReact: false, enableTestingLibrary: false, enableVitest: true });

// These compat plugins import @typescript-eslint/typescript-estree, which cannot
// load alongside typescript 7 (it supports typescript <6.1 only). Drop them and
// their rules (member-ordering, explicit-member-accessibility, and a few vitest
// padding/style rules) until typescript-eslint supports typescript 7.
const estreeDependentPlugins = new Set(['@typescript-eslint/eslint-plugin', '@vitest/eslint-plugin']);
const estreeDependentRulePrefixes = ['typescript-compat/', 'vitest-compat/'];

function withoutEstreeDependentRules(rules: LintRules | undefined): LintRules {
  return Object.fromEntries(Object.entries(rules ?? {}).filter(([ruleName]) => !estreeDependentRulePrefixes.some((prefix) => ruleName.startsWith(prefix))));
}

const config: UserConfig = defineConfig({
  fmt: {
    printWidth: 200,
    singleQuote: true,
  },
  lint: {
    ...baseLintConfig,
    jsPlugins: (baseLintConfig.jsPlugins ?? []).filter((plugin) => !estreeDependentPlugins.has(typeof plugin === 'string' ? plugin : plugin.specifier)),
    rules: {
      ...withoutEstreeDependentRules(baseLintConfig.rules),
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
      ...(baseLintConfig.overrides ?? [])
        .map((override) => ({
          ...override,
          rules: withoutEstreeDependentRules(override.rules),
        }))
        .filter((override) => Object.keys(override.rules).length > 0 || override.jsPlugins),
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
