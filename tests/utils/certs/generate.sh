#!/bin/sh

# Create CA keystore
openssl genrsa -out ca.key.pem 4096
# Create Self-signed CA certificate
openssl req -new -x509 -nodes -days 365200 -key ca.key.pem -out ca.crt.pem -subj "/C=US/ST=Wisconsin/L=Milwaukee/O=ldapts/OU=Org/CN=ldapts.github.com"

# Generate server private key
openssl genrsa -out server-private.key.pem 4096
# Create server CSR
openssl req -new -key server-private.key.pem -out server-private.csr.pem -subj "/C=US/ST=Wisconsin/L=Milwaukee/O=ldapts/OU=Org/CN=localhost"
# Sign server request with self-signed CA
openssl x509 -req -in server-private.csr.pem -CA ca.crt.pem -CAkey ca.key.pem -CAcreateserial -out server-cert.pem -days 365200

# Generate client private key
openssl genrsa -out client-private.key.pem 4096
# Create client CSR
openssl req -new -key client-private.key.pem -out client-private.csr.pem -subj "/C=US/ST=Wisconsin/L=Milwaukee/O=ldapts/OU=Org/CN=client"
# Sign client request with self-signed CA
openssl x509 -req -in client-private.csr.pem -CA ca.crt.pem -CAkey ca.key.pem -CAcreateserial -out client-cert.pem -days 365200
