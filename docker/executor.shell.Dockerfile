# Generic shell runtime — kept for plain /bin/sh sessions and as a fallback.
# Node/Python/Go each get their own leaner, purpose-built image (see
# executor.node.Dockerfile, executor.python.Dockerfile, executor.go.Dockerfile)
# rather than everyone sharing this one with every toolchain crammed in.
FROM node:20-alpine

RUN apk add --no-cache bash python3 py3-pip git curl \
  && addgroup -S sandboxgroup \
  && adduser -S sandboxuser -G sandboxgroup

WORKDIR /workspace
RUN chown sandboxuser:sandboxgroup /workspace

USER sandboxuser

CMD ["/bin/sh"]
