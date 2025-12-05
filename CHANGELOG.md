## [8.0.13](https://github.com/ldapts/ldapts/compare/v8.0.12...v8.0.13) (2025-12-05)

### Bug Fixes

- Remove uuid package to fix cjs imports ([6914379](https://github.com/ldapts/ldapts/commit/6914379c7ebe1c652f4b644846ede3da58f4e9c4)), closes [#277](https://github.com/ldapts/ldapts/issues/277)

## [8.0.12](https://github.com/ldapts/ldapts/compare/v8.0.11...v8.0.12) (2025-12-04)

## [8.0.11](https://github.com/ldapts/ldapts/compare/v8.0.10...v8.0.11) (2025-12-03)

## [8.0.10](https://github.com/ldapts/ldapts/compare/v8.0.9...v8.0.10) (2025-12-03)

### Bug Fixes

- **deps:** update all dependencies ([#268](https://github.com/ldapts/ldapts/issues/268)) ([223b403](https://github.com/ldapts/ldapts/commit/223b403b47b36b3342da35e797acfeb13887a4ce))

## [8.0.9](https://github.com/ldapts/ldapts/compare/v8.0.8...v8.0.9) (2025-07-28)

## [8.0.8](https://github.com/ldapts/ldapts/compare/v8.0.7...v8.0.8) (2025-07-21)

### Bug Fixes

- avoid extra properties on Entry objects for case mis-match ([#247](https://github.com/ldapts/ldapts/issues/247)) ([d56e2f6](https://github.com/ldapts/ldapts/commit/d56e2f619a34c3fc8caaf623442fd212c55cb5dc))

## [8.0.7](https://github.com/ldapts/ldapts/compare/v8.0.6...v8.0.7) (2025-07-21)

## [8.0.6](https://github.com/ldapts/ldapts/compare/v8.0.5...v8.0.6) (2025-07-14)

## [8.0.5](https://github.com/ldapts/ldapts/compare/v8.0.4...v8.0.5) (2025-07-07)

## [8.0.4](https://github.com/ldapts/ldapts/compare/v8.0.3...v8.0.4) (2025-06-30)

## [8.0.3](https://github.com/ldapts/ldapts/compare/v8.0.2...v8.0.3) (2025-06-30)

## [8.0.2](https://github.com/ldapts/ldapts/compare/v8.0.1...v8.0.2) (2025-06-26)

## [8.0.1](https://github.com/ldapts/ldapts/compare/v8.0.0...v8.0.1) (2025-05-29)

### Bug Fixes

- **deps:** update all dependencies ([#211](https://github.com/ldapts/ldapts/issues/211)) ([02c585f](https://github.com/ldapts/ldapts/commit/02c585f63ff19c6a476197e7ad4e833be01ceec5))

# [8.0.0](https://github.com/ldapts/ldapts/compare/v7.4.0...v8.0.0) (2025-05-05)

- feat!: remove Node.js v18 support ([#203](https://github.com/ldapts/ldapts/issues/203)) ([da031c0](https://github.com/ldapts/ldapts/commit/da031c078d7bd12ad7c348086fa214bc673a3fc2))

### Bug Fixes

- optional scope for semantic release ([#189](https://github.com/ldapts/ldapts/issues/189)) ([6e36018](https://github.com/ldapts/ldapts/commit/6e360182f5f42fa69120aa0829cecf665b9f8744))

### BREAKING CHANGES

- Drop support for Node.js v18. Minimum required version is now Node.js v20.

* Updated engines field in package.json
* Updated CI configuration to test on supported versions only

- Run CI jobs for PRs targeting main

# [7.4.0](https://github.com/ldapts/ldapts/compare/v7.3.3...v7.4.0) (2025-04-07)

### Features

- ensure socket is destroyed after unbind and connection errors ([#180](https://github.com/ldapts/ldapts/issues/180)) ([bcf433c](https://github.com/ldapts/ldapts/commit/bcf433c884b192a0e1af6032dfe34dc09c3c8493))

# 7.3.3 - 2024-03-24

- feat: MoreResultsToReturn error, useful for informing end users by @ayZagen in <https://github.com/ldapts/ldapts/pull/173>
- fix: message timers are not cleared by @ayZagen in <https://github.com/ldapts/ldapts/pull/172>
- fix: ensure connectTimer is cleared by @ayZagen in <https://github.com/ldapts/ldapts/pull/174>
- Replace JumpCloud with local openldap image. Thank you @ayZagen!
- Update npms

# 7.3.2 - 2024-03-10

- Update npms

# 7.3.1 - 2024-01-08

- Include Filter type definition. Fix #164. Thank you @ddequidt!
- Update npms

# 7.3.0 - 2024-12-17

- Update npms
- Use node protocol for built-in modules. #163 Than you @ayZagen!

# 7.2.2 - 2024-11-29

- Fix modifyDN newSuperior not working with the long form. #162 Thank you @Oh-suki!
- Update npms

# 7.2.1 - 2024-09-30

- Fix Property 'asyncDispose' does not exist on type 'SymbolConstructor'. #158 Thank you @ayZagen!
- Update npms

# 7.2.0 - 2024-09-10

- Make Client disposable. #155 Thank you @ayZagen!
- Allow search to be paginated via searchPaginated. #156 Thank you @ayZagen!
- Allow subordinates to be used as search scope. #157 Thank you @ayZagen!
- Update npms

# 7.1.1 - 2024-08-26

- Update npms
- Replace deprecated `parse` from url module with `parseURL` from whatwg-url
- Replace deprecated `string#substr` and `buffer#slice` usage

# 7.1.0 - 2024-07-09

- Ensure errors have name and prototype set
- Update npms
- Update eslint to use flat config

# 7.0.12 - 2024-05-13

- Update npms

# 7.0.11 - 2024-04-08

- Fix DN clone method when RDNs array is not empty. Fix #149
- Update npms

# 7.0.10 - 2024-03-11

- Update npms

# 7.0.9 - 2024-02-07

- Update npms

# 7.0.8 - 2024-01-05

- Update npms

# 7.0.7 - 2023-11-28

- Update npms

# 7.0.6 - 2023-10-27

- Update npms

# 7.0.5 - 2023-10-10

- Fix CommonJS package issues. NOTE: All exports are at the root level now. For example:
  `import { Control } from 'ldapts/controls';` is now `import { Control } from 'ldapts';`
- Include `src` in npm package

# 7.0.4 - 2023-10-09

- Fix toString output for OrFilter and NotFilter

# 7.0.3 - 2023-10-06

- Fix asn1 import statements

# 7.0.2 - 2023-10-06

- Update some missing import/export statements to include extensions
- Enable `allowSyntheticDefaultImports` to fix asn1 import statements

# 7.0.1 - 2023-10-05

- Update import/export statements to include extensions

# 7.0.0 - 2023-10-05

- Drop Node.js 16 support
- Updated to ES module
- Changed mocha test runner to use tsx instead of ts-node
- Update npms

# 6.0.0 - 2023-07-24

- Update npms
- Fix lots of linting issues
- Change `Client.messageDetailsByMessageId` to be a map
- Fix `Client._send` signature to return `undefined`
- Change `MessageResponseStatus`, `ProtocolOperation`, and `SearchFilter` from enum to a const
- Enforce `toString()` definition for filters

# 5.0.0 - 2023-07-18

- Drop Node.js 14 support
- Update npms
- Add OpenLDAP test server! Fix #135 Thanks @tsaarni!
- Allow for optional password by setting a default empty string. Fix #134 Thanks @wattry, @TimoHocker, and @thernstig!
- Fix reading controls from responses. Fix #106

# 4.2.6 - 2023-04-28

- Update npms

# 4.2.5 - 2023-04-17

- Update npms

# 4.2.4 - 2023-02-21

- Check for socket if short-circuiting `_connect()`

# 4.2.3 - 2023-02-20

- Update npms
- Fix socket connection not established error. Fix #127 Thanks @Templum!

# 4.2.2 - 2023-01-03

- Update npms
- Enable noUncheckedIndexedAccess compiler option

# 4.2.1 - 2022-10-11

- Update npms

# 4.2.0 - 2022-09-14

- Add DIGEST-MD5 and SCRAM-SHA-1 SASL mechanisms (PR #120). Thanks @TimoHocker!
- Update npms

# 4.1.1 - 2022-08-30

- Update npms

# 4.1.0 - 2022-06-24

- Remove automatically appending ;binary to attributes. Fix #114
- Update npms

# 4.0.0 - 2022-05-23

- Drop Node.js 12 support
- Update npms

# 3.2.4 - 2022-04-13

- Update npms

# 3.2.3 - 2022-03-22

- Update npms

# 3.2.2 - 2022-02-22

- Update npms
- Update husky to support Apple silicon Homebrew package links

# 3.2.1 - 2021-12-30

- Update npms
- Expand type definition version constraints. Fix #108

# 3.2.0 - 2021-12-21

- Fix SASL authentication. Thanks @wattry!
- Update npms

# 3.1.2 - 2021-11-16

- Update npms

# 3.1.1 - 2021-10-29

- Update npms
- Format markdown files

# 3.1.0 - 2021-09-20

- Allow EqualityFilter to accept Buffer as a value

# 3.0.7 - 2021-09-14

- Update npms

# 3.0.6

- Update npms

# 3.0.5

- Add documentation for `explicitBufferAttributes`
- Format and lint markdown files

# 3.0.4

- Fix relative path in source maps. Fixes #102. Thanks @stevenhair!

# 3.0.3

- Update npms

# 3.0.2

- Update npms

# 3.0.1

- Fix "Unhandled promise rejection" when calling modify without password. Fix #88. Thanks @ctaschereau!
- Enable TypeScript lint checks: [`noPropertyAccessFromIndexSignature`](https://www.typescriptlang.org/tsconfig#noPropertyAccessFromIndexSignature) and [`noImplicitOverride`](https://www.typescriptlang.org/tsconfig#noImplicitOverride)
- Update npms

# 3.0.0

- Drop Node.js 10 support
- Add Node.js v16 to CI tests
- Update npms
- Allow `timeLimit: 0` in search options. Fix #97. Thanks @liudonghua123!

# 2.12.0

- Export error classes. Fix #93
- Redact password field from debug logging during send(). Fix #94
- Update npms
- Enable package-lock.json to speed up CI builds

# 2.11.1

- Update npms

# 2.11.0

- Update npms
- Sort union/intersection members
- Revert remove sequence identifier for SASL authentication

# 2.10.1

- Update npms
- Fix documentation for SASL authentication
- Remove sequence identifier for SASL authentication

# 2.10.0

- Add support for PLAIN and EXTERNAL SASL authentication to bind request

# 2.9.1

- Simplify control import directives

# 2.9.0

- Update npms
- Improve Control usability and provide example test for search with a custom Control. Fix #91

# 2.8.1

- Fix null/undefined values for attributes when calling add(). Fix #88

# 2.8.0

- Fix modifyDN to ignore escaped commas when determining NewSuperior. PR #87 Thanks @hasegawa-jun!
- Add tests for modifyDN
- Update npms
- Format code with prettier

# 2.7.0

- Support NewSuperior with modifyDN. PR #84 Thanks @IsraelFrid!
- Update npms

# 2.6.1

- Added documentation for `explicitBufferAttributes` attribute

# 2.6.0

- Update npms
- Expose parsedBuffers on Attribute and added `explicitBufferAttributes` to search options. Fix #72 and Fix #82

# 2.5.1

- Update npms

# 2.5.0

- Update @types/node npm to latest version. Fix #73
- Add mocharc file

# 2.4.0

- Add Buffer as value type for client.exop(). Fixes #74

# 2.3.0

- Update npms
- Update Typescript to v3.9

# 2.2.1

- Update npms

# 2.2.0

- Support `startTLS` for upgrading an existing connection to be encrypted. Fix #71
- Fix type of `tlsOptions` to `tls.ConnectionOptions` in `Client` constructor options
- Fix sending exop with empty/undefined value
- Add `.id` to internal socket to allow cleanup when unbinding after startTLS

# 2.1.0

- Use secure connection if `tlsOptions` is specified or if url starts with `ldaps:` when constructing a client. Fix #71

# 2.0.3

- Update npms
- Make typescript linter rules more strict

# 2.0.2

- Ignore case when determining if attribute is binary. Fix #11

# 2.0.1

- Documentation updates

# 2.0.0

- Drop support for Node.js v8
- Update to Typescript 3.7
- Fix exop response overwriting status and error message. Fixes #52
- Update npms
- Improve documentation. Lots of :heart: for ldapjs docs, [ldapwiki](https://ldapwiki.com/), and [ldap.com](https://ldap.com/ldapv3-wire-protocol-reference/) docs. Fix #31

# 1.10.0

- Include original error message with exceptions. Fix #36
- Include all requested attributes with search results. Fix #22
- Add isConnected to Client. Fix #25
- Try to fix socket ending and reference handling issues. Thanks @december1981! Fix #24
- Update npms

# 1.9.0

- Export Change and Attribute classes. Thanks @willmcenaney!
- Parse search filter before sending partial request. Thanks @markhatchell!

# 1.8.0

- Remove "dist" folder from published npm
- Include type definitions as "dependencies" instead of "devDependencies"
- Update npms

# 1.7.0

- Add DN class as alternate option for specifying DNs. Thanks @adrianplavka!
- Update npms

# 1.6.0

- Fix incorrectly escaping search filter names/values. Fix #18

# 1.5.1

- Do not throw "Size limit exceeded" error if `sizeLimit` is defined and the server responds with `4` (Size limit exceeded).

  Note: It seems that items are returned even though the return status is `4` (Size limit exceeded).

  I'm not really sure what to do in that case. At this time, I decided against throwing an error and instead
  just returning the results returned thus far. That approach works with JumpCloud and forumsys' ldap servers

# 1.5.0

- Update dependencies
- Only include PagedResultsControl if `searchOptions.paged` is specified. Fixes #17
- Make Filter.escape() public. Thanks @stiller-leser!
- Fix FilterParser parsing of ExtensibleFilters to include attribute type. Hopefully fixes #16

# 1.4.2

- Update dependencies
- Add documentation for search options

# 1.4.1

- Fix 'Socket connection not established' when server closes the connection (Fix #13). Thanks @trevh3!

# 1.4.0

- Support binary attribute values (Fix #11)

# 1.3.0

- Add Entry interface for SearchEntry. Thanks @hikaru7719!

# 1.2.3

- Move asn1 type definitions to DefinitelyTyped

# 1.2.2

- Fix error message for InvalidCredentialsError

# 1.2.1

- Provide exports for public classes: errors, filters, and messages (Fix #4)

# 1.2.0

- Fix escaping filter attribute names and values

# 1.1.4

- Fix Add and Modify to handle the response from the server. Thanks @adrianplavka!

# 1.1.3

- Update dev dependencies

# 1.1.2

- Fix ECONNRESET issue connecting to non-secure endpoint
- Throw an error for each message on socket error

# 1.1.1

- Add original string to error message when parsing filters
- Adjust parsing & and | in filters
- Add more filter parsing tests

# 1.1.0

- Add client.add() and client.modify()

# 1.0.6

- Use hex for message type code in closed message error message
- Add additional test for calling unbind() multiple times

# 1.0.5

- Add message name to error message when socket is closed before message response

# 1.0.4

- Add type definitions for asn1
- Add message type id to error when cleaning pending messages.
- Force protocolOperation to be defined for Message types

# 1.0.3

- Verify the socket exists before sending unbind message

# 1.0.2

- Setup prepublish to always build.
- Push fix from 1.0.1

# 1.0.1

- Fix search to return attribute values by default

# 1.0.0

- Initial release
