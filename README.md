LDAPts
======

LDAP client based on [LDAPjs](https://github.com/joyent/node-ldapjs).

## Usage

```javascript
const { Client } = require('ldapts');

const url = 'ldap://127.0.0.1:1389';
const bindDN = 'uid=foo,dc=example,dc=com';
const password = 'bar';

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
    searchReferralUris,
  } = await client.search(searchDN, {
    paged: {
      pageSize: 200,
    },
  });
} catch (ex) {
  await client.unbind();
  throw ex;
}

```
