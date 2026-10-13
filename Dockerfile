FROM cgr.dev/chainguard/nginx:latest

COPY --from=ghcr.io/tarampampam/microcheck:1.4.0 /bin/httpcheck /bin/httpcheck
COPY ./nginx.conf /etc/nginx/nginx.conf
COPY ./dist/ /var/www/

LABEL org.opencontainers.image.source=https://github.com/nanostores/nanostores.net
LABEL org.opencontainers.image.description="Nano Stores website and documentation"
LABEL org.opencontainers.image.licenses=MIT

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD ["/bin/httpcheck", "http://localhost:8000/"]
