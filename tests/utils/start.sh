#!/bin/bash

# Start local instance of OpenLDAP container from Bitnami
docker run -p 1636:1636 -p 1389:1389 ldapts/openldap
