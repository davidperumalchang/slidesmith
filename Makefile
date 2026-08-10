# SlideSmith shortcuts
# Day-to-day coding → use "Local development" targets (no image rebuilds).
# Full Docker stack → use "Docker Compose" when you want a production-like run.

COMPOSE ?= docker compose
SERVICE ?=

.DEFAULT_GOAL := help

.PHONY: help \
	dev db db-logs shell-db backend frontend create-user install \
	up up-build down stop start restart build ps logs logs-f \
	shell-backend shell-frontend create-user-docker db-reset clean

help: ## Show this help
	@echo "SlideSmith"
	@echo ""
	@echo "Local development (recommended while coding — hot reload, no rebuilds):"
	@grep -E '^(dev|db|db-logs|shell-db|backend|frontend|create-user|install):.*?## ' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-18s\033[0m %s\n", $$1, $$2}'
	@echo ""
	@echo "Docker Compose (full stack / deploy-like):"
	@grep -E '^(up|up-build|down|stop|start|restart|build|ps|logs|logs-f|shell-backend|shell-frontend|create-user-docker|db-reset|clean):.*?## ' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-18s\033[0m %s\n", $$1, $$2}'
	@echo ""
	@echo "Typical coding loop:"
	@echo "  make db                 # once"
	@echo "  make backend            # terminal 1 — http://localhost:4000"
	@echo "  make frontend           # terminal 2 — http://localhost:3000"
	@echo "  make create-user EMAIL=you@church.org PASS='your-secure-password' NAME='You'"

# ---------------------------------------------------------------------------
# Local development
# ---------------------------------------------------------------------------

dev: db ## Start Postgres only + print how to run the apps
	@echo ""
	@echo "Postgres is up. In two terminals run:"
	@echo "  make backend"
	@echo "  make frontend"
	@echo ""
	@echo "App: http://localhost:3000   API: http://localhost:4000"

db: ## Start only Postgres (Docker) — use this while coding
	$(COMPOSE) up -d db

db-logs: ## Follow Postgres logs
	$(COMPOSE) logs -f --tail=100 db

shell-db: ## psql into the database
	$(COMPOSE) exec db psql -U $${POSTGRES_USER:-slidesmith} -d $${POSTGRES_DB:-slidesmith}

install: ## npm install in backend + frontend
	cd backend && npm install
	cd frontend && npm install

backend: ## Run backend with hot reload (needs: make db)
	cd backend && npm run dev

frontend: ## Run frontend with hot reload
	cd frontend && npm run dev

create-user: ## Create a login user via local Node (EMAIL= PASS= NAME=)
	@test -n "$(EMAIL)" || (echo "EMAIL is required, e.g. make create-user EMAIL=you@church.org PASS='secret-password' NAME='You'"; exit 1)
	@test -n "$(PASS)" || (echo "PASS is required (min 12 chars)"; exit 1)
	cd backend && npm run create-user -- "$(EMAIL)" "$(PASS)" "$(NAME)"

# ---------------------------------------------------------------------------
# Docker Compose (full stack)
# ---------------------------------------------------------------------------

up: ## Start full stack in background
	$(COMPOSE) up -d

up-build: ## Rebuild images and start full stack
	$(COMPOSE) up -d --build

down: ## Stop and remove containers (keeps DB volume)
	$(COMPOSE) down

stop: ## Stop containers without removing them
	$(COMPOSE) stop

start: ## Start existing containers
	$(COMPOSE) start

restart: ## Restart all services (or SERVICE=name)
	$(COMPOSE) restart $(SERVICE)

build: ## Build images without starting
	$(COMPOSE) build

logs: ## Show recent logs (SERVICE=name optional)
	$(COMPOSE) logs --tail=100 $(SERVICE)

logs-f: ## Follow logs (SERVICE=name optional)
	$(COMPOSE) logs -f --tail=100 $(SERVICE)

shell-backend: ## Shell into the backend container
	$(COMPOSE) exec backend sh

shell-frontend: ## Shell into the frontend container
	$(COMPOSE) exec frontend sh

create-user-docker: ## Create a user inside the backend container (full stack)
	@test -n "$(EMAIL)" || (echo "EMAIL is required"; exit 1)
	@test -n "$(PASS)" || (echo "PASS is required (min 12 chars)"; exit 1)
	$(COMPOSE) exec backend node scripts/create-user.js "$(EMAIL)" "$(PASS)" "$(NAME)"

db-reset: ## Wipe Postgres volume and recreate DB (DESTRUCTIVE)
	@echo "This deletes all database data (users, sessions, etc)."
	@printf "Type 'yes' to continue: " && read ans && [ "$$ans" = "yes" ]
	$(COMPOSE) stop backend frontend db 2>/dev/null || true
	$(COMPOSE) rm -f db 2>/dev/null || true
	docker volume rm slidesmith_slidesmith_pg_data || true
	$(COMPOSE) up -d db
	@echo "DB recreated. For local coding: make backend && make frontend"

clean: ## Stop stack and remove containers + orphan networks
	$(COMPOSE) down --remove-orphans
