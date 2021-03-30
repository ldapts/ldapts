#!/bin/bash

# Start local instance of OpenLDAP container from Bitnami
docker run --name openldap \
  -v "`pwd`/certs:/opt/bitnami/openldap/certs" \
  -e LDAP_ENABLE_TLS=yes \
  -e LDAP_TLS_CERT_FILE=/opt/bitnami/openldap/certs/server-cert.pem \
  -e LDAP_TLS_KEY_FILE=/opt/bitnami/openldap/certs/server-private.key.pem \
  -e LDAP_TLS_CA_FILE=/opt/bitnami/openldap/certs/ca.crt.pem \
  bitnami/openldap:latest
