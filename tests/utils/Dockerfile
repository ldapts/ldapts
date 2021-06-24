FROM bitnami/openldap

# Extends Bitnami OpenLDAP image with self-signed certs and enables TLS

COPY --chown=1001 certs /opt/bitnami/openldap/certs

ENV LDAP_ENABLE_TLS=yes
ENV LDAP_TLS_CERT_FILE=/opt/bitnami/openldap/certs/server-cert.pem
ENV LDAP_TLS_KEY_FILE=/opt/bitnami/openldap/certs/server-private.key.pem
ENV LDAP_TLS_CA_FILE=/opt/bitnami/openldap/certs/ca.crt.pem
# Ignore self-signed CA warnings when running ldapsearch within docker image
ENV LDAPTLS_REQCERT=never
