import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import forge from 'node-forge';

// Get script directory (ESM equivalent of __dirname)
// eslint-disable-next-line no-redeclare
const __filename = fileURLToPath(import.meta.url);
const scriptDir = path.dirname(__filename);
const certsDir = path.join(scriptDir, 'certs');

// Create certs directory if it doesn't exist
await fs.mkdir(certsDir, { recursive: true })

function generateKeyPair() {
  return forge.pki.rsa.generateKeyPair({ bits: 2048 });
}

async function writePem(filename, pem) {
  // eslint-disable-next-line security/detect-non-literal-fs-filename
  await fs.writeFile(path.join(certsDir, filename), pem.replace(/\r\n/g, '\n')); // Force LF
  if (filename.endsWith('-key.pem')) {
    try {
      // eslint-disable-next-line security/detect-non-literal-fs-filename
      await fs.chmod(path.join(certsDir, filename), '600');
    } catch {
      // Ignore on Windows
    }
  }
}

// Generate CA
const caKeys = generateKeyPair();
const caCert = forge.pki.createCertificate();
caCert.publicKey = caKeys.publicKey;
caCert.serialNumber = '01';
caCert.validity.notBefore = new Date();
caCert.validity.notAfter = new Date(caCert.validity.notBefore.getTime() + 730 * 24 * 60 * 60 * 1000); // 2 years
const caAttrs = [{ name: 'commonName', value: 'My Root CA' }];
caCert.setSubject(caAttrs);
caCert.setIssuer(caAttrs);
caCert.setExtensions([{ name: 'basicConstraints', cA: true, critical: true }]);
caCert.sign(caKeys.privateKey, forge.md.sha256.create());

// Generate server certificate
const serverKeys = generateKeyPair();
const serverCert = forge.pki.createCertificate();
serverCert.publicKey = serverKeys.publicKey;
serverCert.serialNumber = '02';
serverCert.validity.notBefore = new Date();
serverCert.validity.notAfter = new Date(serverCert.validity.notBefore.getTime() + 365 * 24 * 60 * 60 * 1000); // 1 year
serverCert.setSubject([{ name: 'commonName', value: 'ldap.local' }]);
serverCert.setIssuer(caAttrs);
serverCert.setExtensions([
  {
    name: 'subjectAltName',
    altNames: [
      { type: 2, value: 'ldap.local' }, // type 2 is DNSName
      { type: 2, value: 'localhost' }
    ]
  },
  { name: 'keyUsage', digitalSignature: true, keyEncipherment: true, critical: true },
  { name: 'extKeyUsage', serverAuth: true, critical: true },
  { name: 'basicConstraints', cA: false },
]);
serverCert.sign(caKeys.privateKey, forge.md.sha256.create());

// Generate client certificate
const clientKeys = generateKeyPair();
const clientCert = forge.pki.createCertificate();
clientCert.publicKey = clientKeys.publicKey;
clientCert.serialNumber = '03';
clientCert.validity.notBefore = new Date();
clientCert.validity.notAfter = new Date(clientCert.validity.notBefore.getTime() + 365 * 24 * 60 * 60 * 1000); // 1 year
clientCert.setSubject([{ name: 'commonName', value: 'ldap-client' }]);
clientCert.setIssuer(caAttrs);
clientCert.setExtensions([
  { name: 'keyUsage', digitalSignature: true, critical: true },
  { name: 'extKeyUsage', clientAuth: true, critical: true },
  { name: 'basicConstraints', cA: false },
]);
clientCert.sign(caKeys.privateKey, forge.md.sha256.create());

// Write files
await Promise.all([
  writePem('ca.pem', forge.pki.certificateToPem(caCert)),
  writePem('server.pem', forge.pki.certificateToPem(serverCert)),
  writePem('server-key.pem', forge.pki.privateKeyToPem(serverKeys.privateKey)),
  writePem('client.pem', forge.pki.certificateToPem(clientCert)),
  writePem('client-key.pem', forge.pki.privateKeyToPem(clientKeys.privateKey)),
]);
// eslint-disable-next-line no-console
console.log(`Generated ca.pem, server.pem, server-key.pem, client.pem, and client-key.pem in ${certsDir}`);
