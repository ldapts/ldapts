LDAPts
======

[![NPM version](https://img.shields.io/npm/v/ldapts.svg?style=flat)](https://npmjs.org/package/ldapts)
[![node version](https://img.shields.io/node/v/ldapts.svg?style=flat)](https://nodejs.org)
[![Known Vulnerabilities](https://snyk.io/test/npm/ldapts/badge.svg)](https://snyk.io/test/npm/ldapts)

LDAP client based on [LDAPjs](https://github.com/joyent/node-ldapjs).

## Usage Examples

### Authenticate

```javascript
const { Client } = require('ldapts');

const url = 'ldap://ldap.forumsys.com:389';
const bindDN = 'cn=read-only-admin,dc=example,dc=com';
const password = 'password';

const client = new Client({
  url,
});

let isAuthenticated;
try {
  await client.bind(bindDN, password);
  isAuthenticated = true;
} catch (ex) {
  isAuthenticated = false;
} finally {
  await client.unbind();
}

```

### Search

```javascript
const { Client } = require('ldapts');

const url = 'ldaps://ldap.jumpcloud.com';
const bindDN = 'uid=tony.stark,ou=Users,o=5be4c382c583e54de6a3ff52,dc=jumpcloud,dc=com';
const password = 'MyRedSuitKeepsMeWarm';
const searchDN = 'ou=Users,o=5be4c382c583e54de6a3ff52,dc=jumpcloud,dc=com';

const client = new Client({
  url,
  tlsOptions: {
    rejectUnauthorized: args.rejectUnauthorized,
  },
});

try {
  await client.bind(bindDN, password);

  const {
    searchEntries,
    searchReferences,
  } = await client.search(searchDN, {
    scope: 'sub',
    filter: '(mail=peter.parker@marvel.com)',
  });
} catch (ex) {
  throw ex;
} finally {
  await client.unbind();
}

```

### Delete Active Directory entry

```javascript
const { Client } = require('ldapts');

const url = 'ldap://127.0.0.1:1389';
const bindDN = 'uid=foo,dc=example,dc=com';
const password = 'bar';
const dnToDelete = 'uid=foobar,dc=example,dc=com';

const client = new Client({
  url,
});

try {
  await client.bind(bindDN, password);

  await client.del(dnToDelete);
} catch (ex) {
  if (ex typeof InvalidCredentialsError) {
    // Handle authentication specifically
  }

  throw ex;
} finally {
  await client.unbind();
}

```
