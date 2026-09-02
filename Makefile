STREAMDECK ?= streamdeck
NODE_USE_ENV_PROXY ?= 1
export NODE_USE_ENV_PROXY

PLUGIN_NAMESPACE := com.pedropombeiro.streamdeck-busylight
export SOURCE_DIR := Sources/$(PLUGIN_NAMESPACE).sdPlugin
export RELEASE_FILE := Release/$(PLUGIN_NAMESPACE).streamDeckPlugin

.PHONY: setup
setup:
	npm install -g @elgato/cli@latest

.PHONY: release
release:
	@scripts/release

.PHONY: install
install: release
	@open $(RELEASE_FILE)

.PHONY: $(RELEASE_FILE)
$(RELEASE_FILE): $(SOURCE_DIR)/*
	@mkdir -p Release
	$(STREAMDECK) pack --force --no-update-check --output Release $(SOURCE_DIR)
