# Build stage
FROM golang:1.21-alpine AS builder

# Install git for go modules that require VCS access.
RUN apk add --no-cache git ca-certificates

WORKDIR /workspace

# Cache dependency downloads separately from the build.
COPY go.mod go.mod
COPY go.sum go.sum
RUN go mod download

# Copy all source files.
COPY api/ api/
COPY cmd/ cmd/
COPY internal/ internal/

# Build the manager binary. CGO_ENABLED=0 produces a fully static binary
# that runs in a distroless container without a libc present.
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build \
    -ldflags="-w -s" \
    -o manager ./cmd/manager

# ── Runtime stage ─────────────────────────────────────────────────────────────
# Use distroless/static-debian11 as the base image. It contains only the
# minimum OS libraries needed for a statically linked Go binary and has no
# shell, package manager, or other attack surface.
FROM gcr.io/distroless/static-debian11:nonroot

WORKDIR /

COPY --from=builder /workspace/manager .

# The operator runs as UID 65532 (nonroot) by default in the distroless image.
USER 65532:65532

ENTRYPOINT ["/manager"]
