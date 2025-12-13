export default {
  branches: [
    'main',
    {
      name: 'beta',
      prerelease: 'beta',
    },
  ],
  plugins: [
    [
      '@semantic-release/commit-analyzer',
      {
        preset: 'angular',
        releaseRules: [
          { type: 'docs', release: 'patch' },
          { type: 'feat', release: 'minor' },
          { type: 'fix', release: 'patch' },
          { type: 'test', release: 'patch' },
          { type: 'chore', scope: 'deps', release: false },
          { type: 'chore', release: 'patch' },
        ],
        parserOpts: {
          // eslint-disable-next-line security/detect-unsafe-regex
          headerPattern: /^(\w+)(?:\([^)]+\))?: (.+)$/,
          headerCorrespondence: ['type', 'subject'],
        },
      },
    ],
    '@semantic-release/release-notes-generator',
    [
      '@semantic-release/changelog',
      {
        changelogFile: 'CHANGELOG.md',
      },
    ],
    '@semantic-release/npm',
    [
      '@semantic-release/github',
      {
        assets: [],
      },
    ],
    [
      '@semantic-release/git',
      {
        assets: ['CHANGELOG.md', 'package.json', 'package-lock.json'],
        message: `chore: release \${nextRelease.version} [skip ci]\n\n\${nextRelease.notes}`,
      },
    ],
  ],
};
