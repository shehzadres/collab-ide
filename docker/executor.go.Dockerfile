# Go runtime — used by sessions whose Workspace.runtime = GO.
FROM golang:1.23-alpine

RUN apk add --no-cache bash git curl \
  && addgroup -S sandboxgroup \
  && adduser -S sandboxuser -G sandboxgroup

WORKDIR /workspace
RUN mkdir -p /go && chown -R sandboxuser:sandboxgroup /go /workspace

ENV GOPATH=/go
ENV PATH="/go/bin:${PATH}"

USER sandboxuser

CMD ["/bin/sh"]
