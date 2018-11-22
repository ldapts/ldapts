LDAPts
======

LDAP client based on [LDAPjs](https://github.com/joyent/node-ldapjs).

## Usage Examples

### Authenticate

```javascript
const { Client } = require('ldapts');

const url = 'ldap://127.0.0.1:1389';
const bindDN = 'uid=foo,dc=example,dc=com';
const password = 'bar';

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

const url = 'ldap://127.0.0.1:1389';
const bindDN = 'uid=foo,dc=example,dc=com';
const password = 'bar';
const searchDN = 'ou=Users,dc=example,dc=com';

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
    filter: 'cn=Foobar',
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
