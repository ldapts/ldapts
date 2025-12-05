'use strict';

/**
 * Test that the package can be imported from CommonJS
 * This catches issues like ESM-only dependencies breaking CJS builds
 */
const assert = require('node:assert');

const ldapts = require('../dist/index.cjs');

assert(ldapts.Client, 'Client should be exported');
assert(typeof ldapts.Client === 'function', 'Client should be a constructor');

// eslint-disable-next-line no-console
console.log('✓ CJS import successful');
