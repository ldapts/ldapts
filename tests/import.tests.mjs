/**
 * Test that the package can be imported from ESM
 */
import assert from 'node:assert';

import * as ldapts from '../dist/index.mjs';

assert(ldapts.Client, 'Client should be exported');
assert(typeof ldapts.Client === 'function', 'Client should be a constructor');

// eslint-disable-next-line no-console
console.log('✓ ESM import successful');
