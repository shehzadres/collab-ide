# Node.js runtime — used by sessions whose Workspace.runtime = NODE.
FROM node:20-alpine

RUN apk add --no-cache bash git curl \
  && addgroup -S sandboxgroup \
  && adduser -S sandboxuser -G sandboxgroup

WORKDIR /workspace
RUN chown sandboxuser:sandboxgroup /workspace \
  && mkdir -p /home/sandboxuser/.npm-global \
  && chown -R sandboxuser:sandboxgroup /home/sandboxuser

ENV PATH="/home/sandboxuser/.npm-global/bin:${PATH}"
ENV NPM_CONFIG_PREFIX="/home/sandboxuser/.npm-global"

USER sandboxuser

CMD ["/bin/sh"]
