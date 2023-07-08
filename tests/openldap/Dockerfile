FROM debian:bookworm
RUN DEBIAN_FRONTEND=noninteractive \
    apt-get update && \
    apt-get install --yes --no-install-recommends \
    ldap-utils \
    slapd \
    ssl-cert

COPY files /

EXPOSE 389 636

CMD ["/docker-entrypoint.sh"]
