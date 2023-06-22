# OpenLDAP Docker Container

This directory contains a Dockerfile to build an OpenLDAP container for testing purposes.
The container is based on Debian.

## Usage

To build and run the container use the following command in the top directory of the repository

```bash
docker-compose up -d
```

To stop the container

```bash
docker-compose down
```

The root user inside the container (`uid=0`, `gid=0`) is the administrator, and can authenticate without password by using the SASL EXTERNAL mechanism.

```bash
docker exec ldapts-openldap-1 ldapsearch -H ldapi:/// -Y EXTERNAL -b dc=example,dc=org   # list users
docker exec ldapts-openldap-1 ldapsearch -H ldapi:/// -Y EXTERNAL -b cn=config           # list configuration
```
