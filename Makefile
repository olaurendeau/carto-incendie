# Tout tourne dans Docker (via docker compose) : aucun outil local requis à part docker.
# Prérequis : `make env` puis remplir .env.local (Neon + Cloudinary).
#
# Démarrage : make install && make db-push && make dev

NODE_IMAGE       ?= node:22-bookworm-slim
PLAYWRIGHT_IMAGE ?= mcr.microsoft.com/playwright:v1.49.1-noble

UID := $(shell id -u)
GID := $(shell id -g)

# UID/GID de l'hôte, transmis à compose pour que les fichiers créés dans le
# bind mount (node_modules…) ne soient pas root-owned sous Linux.
# Nommés HOST_* car UID/GID sont readonly dans certains shells (macOS).
COMPOSE = HOST_UID=$(UID) HOST_GID=$(GID) \
	NODE_IMAGE=$(NODE_IMAGE) PLAYWRIGHT_IMAGE=$(PLAYWRIGHT_IMAGE) \
	docker compose
RUN = $(COMPOSE) run --rm app

.PHONY: help env install prepare dev down build start lint test test-e2e db-push db-studio sh clean

help: ## Affiche cette aide
	@grep -E '^[a-zA-Z0-9_-]+:.*## ' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*## "}; {printf "  \033[36m%-12s\033[0m %s\n", $$1, $$2}'

env: ## Crée .env.local depuis .env.example s'il n'existe pas
	@test -f .env.local || (cp .env.example .env.local && echo ">> .env.local créé — remplir DATABASE_URL et CLOUDINARY_URL avant de continuer.")

.env.local:
	@echo "Erreur : .env.local manquant. Lancer 'make env' puis remplir les valeurs." && exit 1

install: .env.local ## Installe les dépendances (npm install)
	$(RUN) npm install

# Le volume next-cache est créé root : on le donne à l'utilisateur hôte.
prepare: .env.local
	@$(COMPOSE) run --rm --user 0:0 app chown $(UID):$(GID) /app/.next

dev: prepare ## Serveur de dev sur http://localhost:3000
	$(COMPOSE) up app

down: ## Arrête et supprime les conteneurs compose
	$(COMPOSE) down

build: prepare ## Build de production (next build)
	$(RUN) npm run build

start: prepare ## Serveur de production sur http://localhost:3000 (après make build)
	$(COMPOSE) run --rm --service-ports app npm run start -- -H 0.0.0.0

lint: .env.local ## Lint (eslint)
	$(RUN) npm run lint

test: .env.local ## Tests unitaires (vitest, un seul passage)
	$(RUN) npx vitest run

test-e2e: .env.local ## Tests e2e (playwright, lance son propre serveur sur :3030)
	$(COMPOSE) run --rm e2e

db-push: .env.local ## Applique le schéma Drizzle sur la base (drizzle-kit push)
	$(RUN) npx drizzle-kit push

db-studio: .env.local ## Drizzle Studio (ouvrir https://local.drizzle.studio)
	$(COMPOSE) run --rm --service-ports studio

sh: .env.local ## Shell dans le conteneur node
	$(RUN) bash

clean: ## Supprime node_modules, les volumes (.next, cache Playwright) et les rapports de tests
	$(COMPOSE) run --rm --user 0:0 app sh -c "rm -rf node_modules playwright-report test-results"
	$(COMPOSE) down -v
	rm -rf .next
