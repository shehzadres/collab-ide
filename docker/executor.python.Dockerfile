# Python runtime — used by sessions whose Workspace.runtime = PYTHON.
FROM python:3.12-alpine

RUN apk add --no-cache bash git curl \
  && addgroup -S sandboxgroup \
  && adduser -S sandboxuser -G sandboxgroup

WORKDIR /workspace
RUN chown sandboxuser:sandboxgroup /workspace

# pip install --user (used by runtimes.ts's installCommand) needs a writable
# home directory and PATH entry for the resulting scripts.
ENV PATH="/home/sandboxuser/.local/bin:${PATH}"

USER sandboxuser

CMD ["/bin/sh"]
