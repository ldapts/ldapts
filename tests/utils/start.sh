#!/bin/bash

# Start local instance of OpenLDAP container from Bitnami
docker run -p 61636 -p 1389 ldapts/openldap
