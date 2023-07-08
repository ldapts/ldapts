#!/bin/bash -ex

rm -rf /data/* || true
mkdir -p /data/config /data/db /data/ldif

# process templates
eval "cat <<< \"$(</templates/database.ldif)\"" > /data/ldif/database.ldif
eval "cat <<< \"$(</templates/users-and-groups.ldif)\"" > /data/ldif/users-and-groups.ldif

# import templates
slapadd -v -n 0 -l /data/ldif/database.ldif -F /data/config
slapadd -v -n 1 -l /data/ldif/users-and-groups.ldif -F /data/config

/usr/sbin/slapd -d3 -s trace -h "ldap://0.0.0.0:389/ ldapi://%2Fvar%2Frun%2Fslapd%2Fldapi ldaps://0.0.0.0:636/" -F /data/config
