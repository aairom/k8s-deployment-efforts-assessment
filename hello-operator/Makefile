# hello-operator Makefile
#
# Usage:
#   make build                          – compile the manager binary locally
#   make docker-build IMG=<registry>/hello-operator:tag
#   make docker-push  IMG=<registry>/hello-operator:tag
#   make deploy       IMG=<registry>/hello-operator:tag
#   make undeploy
#   make manifests                      – (re)generate CRD & RBAC YAMLs via controller-gen
#   make generate                       – (re)generate DeepCopy methods
#   make install                        – install CRDs into the cluster
#   make uninstall                      – remove CRDs from the cluster
#   make run                            – run the operator locally (out-of-cluster)
#   make lint                           – run golangci-lint
#   make test                           – run unit tests

# Image configuration – override on the command line, e.g.
#   make docker-build IMG=docker.io/myuser/hello-operator:v0.1.0
IMG ?= controller:latest

# ENVTEST_K8S_VERSION refers to the version of kubebuilder assets
# to be downloaded by envtest setup.
ENVTEST_K8S_VERSION = 1.28.0

# Get the currently used golang install path (in GOPATH/bin, unless GOBIN is set).
ifeq (,$(shell go env GOBIN))
GOBIN=$(shell go env GOPATH)/bin
else
GOBIN=$(shell go env GOBIN)
endif

# Setting SHELL to bash allows bash commands such as $() and set -e.
SHELL = /usr/bin/env bash -o pipefail
.SHELLFLAGS = -ec

# Detect container tool (prefer podman, fall back to docker).
CONTAINER_TOOL ?= $(shell which podman 2>/dev/null || which docker 2>/dev/null || echo docker)

.PHONY: all
all: build

##@ General

# The help target prints out all targets with their descriptions derived from comments.
.PHONY: help
help: ## Display this help.
	@awk 'BEGIN {FS = ":.*##"; printf "\nUsage:\n  make \033[36m<target>\033[0m\n"} /^[a-zA-Z_0-9-]+:.*?##/ { printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2 } /^##@/ { printf "\n\033[1m%s\033[0m\n", substr($$0, 5) } ' $(MAKEFILE_LIST)

##@ Development

.PHONY: manifests
manifests: controller-gen ## Generate CRD, RBAC, and webhook manifests from Go type annotations.
	$(CONTROLLER_GEN) rbac:roleName=manager-role crd webhook paths="./..." output:crd:artifacts:config=config/crd/bases output:rbac:artifacts:config=config/rbac

.PHONY: generate
generate: controller-gen ## Generate DeepCopy methods and other code scaffolding.
	$(CONTROLLER_GEN) object:headerFile="hack/boilerplate.go.txt" paths="./..."

.PHONY: fmt
fmt: ## Run go fmt against code.
	go fmt ./...

.PHONY: vet
vet: ## Run go vet against code.
	go vet ./...

.PHONY: test
test: manifests generate fmt vet envtest ## Run unit tests.
	KUBEBUILDER_ASSETS="$(shell $(ENVTEST) use $(ENVTEST_K8S_VERSION) --bin-dir $(LOCALBIN) -p path)" go test ./... -coverprofile cover.out

.PHONY: lint
lint: golangci-lint ## Run golangci-lint.
	$(GOLANGCI_LINT) run

##@ Build

.PHONY: build
build: manifests generate fmt vet ## Build the manager binary locally.
	go build -o bin/manager ./cmd/manager

.PHONY: run
run: manifests generate fmt vet ## Run the operator controller from your host (requires a kubeconfig).
	go run ./cmd/manager

.PHONY: docker-build
docker-build: ## Build the container image.
	$(CONTAINER_TOOL) build -t ${IMG} .

.PHONY: docker-push
docker-push: ## Push the container image to the registry.
	$(CONTAINER_TOOL) push ${IMG}

.PHONY: docker-buildx
docker-buildx: ## Build and push the container image for multiple platforms.
	$(CONTAINER_TOOL) buildx build --platform=linux/amd64,linux/arm64 --push -t ${IMG} .

##@ Deployment

ifndef ignore-not-found
  ignore-not-found = false
endif

.PHONY: install
install: manifests kustomize ## Install CRDs into the cluster (requires cluster access).
	$(KUSTOMIZE) build config/crd | kubectl apply -f -

.PHONY: uninstall
uninstall: manifests kustomize ## Uninstall CRDs from the cluster.
	$(KUSTOMIZE) build config/crd | kubectl delete --ignore-not-found=$(ignore-not-found) -f -

.PHONY: deploy
deploy: manifests kustomize ## Deploy the operator into the cluster.
	cd config/manager && $(KUSTOMIZE) edit set image controller=${IMG}
	$(KUSTOMIZE) build config/default | kubectl apply -f -

.PHONY: undeploy
undeploy: kustomize ## Undeploy the operator from the cluster.
	$(KUSTOMIZE) build config/default | kubectl delete --ignore-not-found=$(ignore-not-found) -f -

##@ Build Dependencies

## Location to install dependencies to
LOCALBIN ?= $(shell pwd)/bin
$(LOCALBIN):
	mkdir -p $(LOCALBIN)

## Tool Binaries
KUBECTL         ?= kubectl
KUSTOMIZE       ?= $(LOCALBIN)/kustomize
CONTROLLER_GEN  ?= $(LOCALBIN)/controller-gen
ENVTEST         ?= $(LOCALBIN)/setup-envtest
GOLANGCI_LINT   ?= $(LOCALBIN)/golangci-lint

## Tool Versions
KUSTOMIZE_VERSION        ?= v5.2.1
CONTROLLER_TOOLS_VERSION ?= v0.13.0
ENVTEST_VERSION          ?= release-0.17
GOLANGCI_LINT_VERSION    ?= v1.55.2

.PHONY: kustomize
kustomize: $(KUSTOMIZE) ## Download kustomize locally if necessary.
$(KUSTOMIZE): $(LOCALBIN)
	$(call go-install-tool,$(KUSTOMIZE),sigs.k8s.io/kustomize/kustomize/v5,$(KUSTOMIZE_VERSION))

.PHONY: controller-gen
controller-gen: $(CONTROLLER_GEN) ## Download controller-gen locally if necessary.
$(CONTROLLER_GEN): $(LOCALBIN)
	$(call go-install-tool,$(CONTROLLER_GEN),sigs.k8s.io/controller-tools/cmd/controller-gen,$(CONTROLLER_TOOLS_VERSION))

.PHONY: envtest
envtest: $(ENVTEST) ## Download setup-envtest locally if necessary.
$(ENVTEST): $(LOCALBIN)
	$(call go-install-tool,$(ENVTEST),sigs.k8s.io/controller-runtime/tools/setup-envtest,$(ENVTEST_VERSION))

.PHONY: golangci-lint
golangci-lint: $(GOLANGCI_LINT) ## Download golangci-lint locally if necessary.
$(GOLANGCI_LINT): $(LOCALBIN)
	$(call go-install-tool,$(GOLANGCI_LINT),github.com/golangci/golangci-lint/cmd/golangci-lint,$(GOLANGCI_LINT_VERSION))

# go-install-tool will 'go install' any package with custom target and name.
# $(1) – target file path
# $(2) – package URL
# $(3) – version tag
define go-install-tool
@[ -f $(1) ] || { \
	set -e ;\
	package=$(2)@$(3) ;\
	echo "Downloading $${package}" ;\
	GOBIN=$(LOCALBIN) go install $${package} ;\
}
endef
