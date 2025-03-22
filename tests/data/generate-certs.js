/* eslint-disable */

import forge from 'node-forge';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get script directory
const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const certsDir = path.join(scriptDir, 'certs');

// Create certs directory if it doesn't exist
if (!fs.existsSync(certsDir)) {
  fs.mkdirSync(certsDir, { recursive: true });
}

// Helper function to generate a key pair
function generateKeyPair() {
  return forge.pki.rsa.generateKeyPair({ bits: 2048 });
}

// Helper function to write PEM files
function writePem(filename, pem) {
  fs.writeFileSync(path.join(certsDir, filename), pem);
  if (filename.endsWith('-key.pem')) {
    fs.chmodSync(path.join(certsDir, filename), '600'); // Only works on Unix-like systems
  }
}

// Generate CA
const caKeys = generateKeyPair();
const caCert = forge.pki.createCertificate();
caCert.publicKey = caKeys.publicKey;
caCert.serialNumber = '01';
caCert.validity.notBefore = new Date();
caCert.validity.notAfter = new Date();
caCert.validity.notAfter.setFullYear(caCert.validity.notBefore.getFullYear() + 2); // 2 years
const caAttrs = [{ name: 'commonName', value: 'My Root CA' }];
caCert.setSubject(caAttrs);
caCert.setIssuer(caAttrs);
caCert.setExtensions([{ name: 'basicConstraints', cA: true }]);
caCert.sign(caKeys.privateKey, forge.md.sha256.create());

// Generate server certificate
const serverKeys = generateKeyPair();
const serverCert = forge.pki.createCertificate();
serverCert.publicKey = serverKeys.publicKey;
serverCert.serialNumber = '02';
serverCert.validity.notBefore = new Date();
serverCert.validity.notAfter = new Date();
serverCert.validity.notAfter.setFullYear(serverCert.validity.notBefore.getFullYear() + 1); // 1 year
serverCert.setSubject([{ name: 'commonName', value: 'ldap.local' }]);
serverCert.setIssuer(caAttrs);
serverCert.setExtensions([
  { name: 'subjectAltName', altNames: [{ type: 2, value: 'ldap.local' }] }, // DNSName
  { name: 'keyUsage', digitalSignature: true, keyEncipherment: true },
  { name: 'extKeyUsage', serverAuth: true }
]);
serverCert.sign(caKeys.privateKey, forge.md.sha256.create());

// Generate client certificate
const clientKeys = generateKeyPair();
const clientCert = forge.pki.createCertificate();
clientCert.publicKey = clientKeys.publicKey;
clientCert.serialNumber = '03';
clientCert.validity.notBefore = new Date();
clientCert.validity.notAfter = new Date();
clientCert.validity.notAfter.setFullYear(clientCert.validity.notBefore.getFullYear() + 1); // 1 year
clientCert.setSubject([{ name: 'commonName', value: 'ldap-client' }]);
clientCert.setIssuer(caAttrs);
clientCert.setExtensions([
  { name: 'keyUsage', digitalSignature: true },
  { name: 'extKeyUsage', clientAuth: true }
]);
clientCert.sign(caKeys.privateKey, forge.md.sha256.create());

// Write certificates and keys to PEM files
writePem('ca.pem', forge.pki.certificateToPem(caCert));
writePem('server.pem', forge.pki.certificateToPem(serverCert));
writePem('server-key.pem', forge.pki.privateKeyToPem(serverKeys.privateKey));
writePem('client.pem', forge.pki.certificateToPem(clientCert));
writePem('client-key.pem', forge.pki.privateKeyToPem(clientKeys.privateKey));

// Note: Not writing ca-key.pem (deleted in original script for security)

console.log(`Generated ca.pem, server.pem, server-key.pem, client.pem, and client-key.pem in ${certsDir}`);
