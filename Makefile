# -----------------------------------------------------------------------------
# Foi De Propósito (FDP) - Makefile profissional para projeto React + Vite
# -----------------------------------------------------------------------------
# Recursos:
# - Ajuda auto-documentada (make help)
# - Detecção automática do gerenciador de pacotes (npm | yarn | pnpm)
# - Alvos para desenvolvimento, build, preview, lint, format, clean, check
# - Verificações de ambiente (Node >= 18, ferramentas obrigatórias)
# - Utilitários de porta (checar/liberar/abrir no browser)
# - Targets para Docker (dev/preview sem Dockerfile)
# - Flags configuráveis via variáveis de ambiente
# -----------------------------------------------------------------------------

# Configuração de shell segura
SHELL := /bin/bash
.ONESHELL:
.SHELLFLAGS := -eu -o pipefail -c
.DEFAULT_GOAL := help

# ------------------------------------
# Variáveis de configuração (override com VAR=valor)
# ------------------------------------
PORT ?= 5173
HOST ?= 0.0.0.0
OPEN ?= true
MIN_NODE ?= 18.0.0
CI ?= false
MAIN_BRANCH ?= main
GIT ?= git
GIT_HOOKS_DIR := .git/hooks
HOOKS_SRC_DIR := scripts/git-hooks

# Detecção do gerenciador de pacotes
PKG_MGR := $(shell if [ -f pnpm-lock.yaml ]; then echo pnpm; \
                 elif [ -f yarn.lock ]; then echo yarn; \
                 else echo npm; fi)

# Comandos de instalação por gerenciador
ifeq ($(PKG_MGR),npm)
  INSTALL_CMD := npm ci || npm install
  RUN := npm run
  EXEC := npx
else ifeq ($(PKG_MGR),yarn)
  INSTALL_CMD := yarn install --frozen-lockfile || yarn
  RUN := yarn
  EXEC := yarn dlx
else ifeq ($(PKG_MGR),pnpm)
  INSTALL_CMD := pnpm install --frozen-lockfile || pnpm i
  RUN := pnpm
  EXEC := pnpm dlx
endif

# Cores de saída
COLOR_RESET := \033[0m
COLOR_GREEN := \033[32m
COLOR_YELLOW := \033[33m
COLOR_BLUE := \033[34m
COLOR_RED := \033[31m

# Utilitário para mensagens
define _msg
	printf "$(COLOR_BLUE)> %s$(COLOR_RESET)\n" "$(1)"
endef

define _ok
	printf "$(COLOR_GREEN)✓ %s$(COLOR_RESET)\n" "$(1)"
endef

define _warn
	printf "$(COLOR_YELLOW)! %s$(COLOR_RESET)\n" "$(1)"
endef

define _err
	printf "$(COLOR_RED)✗ %s$(COLOR_RESET)\n" "$(1)" >&2
endef

# ------------------------------------
# Tarefas principais
# ------------------------------------
.PHONY: help install dev build preview start run run-dev run-prod lint lint-fix format typecheck clean clean-node clean-all check check-env open show-pm show-env \
	port-check port-kill port-who docker-dev docker-preview ci analyze deps-audit deps-outdated env serve print-% is-git require-git git-init git-status git-branch git-check git-hooks git-hooks-install git-hooks-uninstall version-bump changelog release pre-commit commit disable-hooks

help: ## Mostra esta ajuda (targets e descrições)
	@awk 'BEGIN {FS = ":.*##"; printf "\nComandos disponíveis:\n\n"} \
	/^[a-zA-Z0-9_\-]+:.*##/ { printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2 } \
	END {print "\nDicas: use VAR=valor para customizar. Ex.: make dev PORT=3000 OPEN=false\n"}' $(MAKEFILE_LIST)

install: check-env ## Instala dependências (usa $(PKG_MGR))
	$(call _msg,Instalando dependências com $(PKG_MGR) ...)
	$(INSTALL_CMD)
	$(call _ok,Dependências instaladas)

dev: check-env port-check ## Sobe o servidor de desenvolvimento Vite
	$(call _msg,Iniciando dev server em http://localhost:$(PORT) ...)
	$(RUN) dev -- --host $(HOST) --port $(PORT) $(if $(filter $(OPEN),true),--open,)

build: check-env ## Build de produção (Vite)
	$(call _msg,Gerando build de produção ...)
	$(RUN) build
	$(call _ok,Build concluído em ./dist)

preview: check-env ## Preview do build de produção (Vite)
	@test -d dist || { $(call _warn,dist não existe, executando make build); $(MAKE) build; }
	$(call _msg,Preview em http://localhost:$(PORT) ...)
	$(RUN) preview -- --host $(HOST) --port $(PORT)

start: preview ## Alias para preview
run: install run-dev ## Executa fluxo de desenvolvimento (install + dev)

run-dev: dev ## Alias explícito para desenvolvimento

run-prod: ## Build + preview em modo produção
	$(MAKE) build
	$(MAKE) preview
analyze: ## Analisa o bundle (gera e abre relatório em dist/stats.html)
	@if grep -q '"analyze"' package.json; then \
	  $(RUN) analyze; \
	else \
	  $(call _msg,Script analyze não encontrado; executando fallback: build + vite-bundle-analyzer); \
	  $(MAKE) build; \
	  $(EXEC) vite-bundle-analyzer dist/stats.html || true; \
	fi

deps-audit: ## Audita vulnerabilidades das dependências
	@if [ "$(PKG_MGR)" = "npm" ]; then \
	  npm audit --audit-level=moderate || true; \
	elif [ "$(PKG_MGR)" = "yarn" ]; then \
	  yarn audit || true; \
	else \
	  pnpm audit || true; \
	fi

deps-outdated: ## Lista dependências desatualizadas
	@if [ "$(PKG_MGR)" = "npm" ]; then \
	  npm outdated || true; \
	elif [ "$(PKG_MGR)" = "yarn" ]; then \
	  yarn outdated || true; \
	else \
	  pnpm outdated || true; \
	fi

env: ## Mostra versões de Node, PM e Vite
	@echo "Node: $$(node -v)"
	@echo "$(PKG_MGR): $$( $(PKG_MGR) -v 2>/dev/null || echo n/a )"
	@echo "Vite: $$( npx --yes vite --version 2>/dev/null || echo n/a )"

serve: ## Build + preview usando script do package.json
	$(RUN) serve

# ==============================================================================
# GIT OPERATIONS
# ==============================================================================

git-status: ## 📊 Enhanced git status with visualization
	@echo "$(CYAN)$(BOLD)📊 Git Status$(RESET)"
	@echo "$(YELLOW)═══════════════════════════════════════$(RESET)"
	@echo "$(GREEN)Branch:$(RESET) $(GIT_BRANCH)"
	@echo "$(GREEN)Commit:$(RESET) $(GIT_COMMIT)"
	@echo ""
	@git status --short --branch 2>/dev/null || echo "$(RED)❌ Not a git repository$(RESET)"

git-log: ## 📜 Beautiful git log with graph
	@echo "$(CYAN)$(BOLD)📜 Git History$(RESET)"
	@echo "$(YELLOW)═══════════════════════════════════════$(RESET)"
	@git log --graph --pretty=format:'%C(red)%h%C(reset) -%C(yellow)%d%C(reset) %s %C(green)(%cr) %C(bold blue)<%an>%C(reset)' --abbrev-commit -10 2>/dev/null || echo "$(RED)❌ Not a git repository$(RESET)"

git-contributors: ## 👥 Show git contributors
	@echo "$(CYAN)$(BOLD)👥 Contributors$(RESET)"
	@echo "$(YELLOW)═══════════════════════════════════════$(RESET)"
	@git shortlog -sn 2>/dev/null || echo "$(RED)❌ Not a git repository$(RESET)"

git-stats: ## 📈 Git repository statistics
	@echo "$(CYAN)$(BOLD)📈 Repository Statistics$(RESET)"
	@echo "$(YELLOW)═══════════════════════════════════════$(RESET)"
	@echo "$(GREEN)Total commits:$(RESET) $$(git rev-list --all --count 2>/dev/null || echo 'N/A')"
	@echo "$(GREEN)Total branches:$(RESET) $$(git branch -a 2>/dev/null | wc -l || echo 'N/A')"
	@echo "$(GREEN)Total contributors:$(RESET) $$(git shortlog -sn 2>/dev/null | wc -l || echo 'N/A')"
	@echo "$(GREEN)Repository size:$(RESET) $$(du -sh .git 2>/dev/null | cut -f1 || echo 'N/A')"

commit: ## 💾 Interactive commit with conventional format
	@echo "$(CYAN)$(BOLD)💾 Interactive Commit$(RESET)"
	@echo "$(YELLOW)Choose commit type:$(RESET)"
	@echo "  $(GREEN)feat$(RESET)     - New feature"
	@echo "  $(GREEN)fix$(RESET)      - Bug fix"
	@echo "  $(GREEN)docs$(RESET)     - Documentation"
	@echo "  $(GREEN)style$(RESET)    - Code style changes"
	@echo "  $(GREEN)refactor$(RESET) - Code refactoring"
	@echo "  $(GREEN)test$(RESET)     - Adding tests"
	@echo "  $(GREEN)chore$(RESET)    - Maintenance"
	@echo ""
	@read -p "Type: " type; \
	read -p "Scope (optional): " scope; \
	read -p "Description: " desc; \
	git add -A; \
	if [ -n "$$scope" ]; then \
		git commit -m "$$type($$scope): $$desc"; \
	else \
		git commit -m "$$type: $$desc"; \
	fi

disable-hooks: ## 🔓 Desativa hooks de pre-commit do git
	@if [ -f .git/hooks/pre-commit ]; then mv .git/hooks/pre-commit .git/hooks/pre-commit.bak; fi
	@git config --unset core.hooksPath || true
	@echo "Hooks de pre-commit desativados. Agora make commit funciona sem lint automático."

# ------------------------------------
# Verificações e utilidades
# ------------------------------------
check-env: ## Garante Node e ferramentas mínimas
	@command -v node >/dev/null 2>&1 || { $(call _err,Node não encontrado); exit 127; }
	@command -v $(PKG_MGR) >/dev/null 2>&1 || { $(call _err,$(PKG_MGR) não encontrado); exit 127; }
	@node -e 'const min="$(MIN_NODE)"; const cur=process.versions.node; function ge(a,b){const pa=a.split(".").map(Number),pb=b.split(".").map(Number); for(let i=0;i<3;i++){ if((pa[i]||0)>(pb[i]||0)) process.exit(0); if((pa[i]||0)<(pb[i]||0)) process.exit(1);} process.exit(0);} if(!ge(cur,min)){ console.error("Node "+cur+" < "+min); process.exit(1);} '
	$(call _ok,Ambiente ok (Node >= $(MIN_NODE), $(PKG_MGR)))

port-check: ## Verifica se a porta $(PORT) está livre
	@if ss -ltn | awk '{print $$4}' | grep -qE "[:\.]$(PORT)$$"; then \
	  $(call _warn,Porta $(PORT) ocupada. Use `make port-who` ou `make port-kill`); \
	  if [ "$(CI)" = "true" ]; then \
	    $(call _err,Porta ocupada em ambiente CI); exit 1; \
	  fi; \
	else \
	  $(call _ok,Porta $(PORT) livre); \
	fi

port-who: ## Mostra o processo escutando na porta $(PORT)
	@ss -ltnp | grep -E "[:\.]$(PORT)\s" || { $(call _warn,Nenhum processo na porta $(PORT)); true; }

port-kill: ## Mata o processo na porta $(PORT) (cuidado!)
	@if command -v fuser >/dev/null 2>&1; then \
	  sudo fuser -k $(PORT)/tcp || true; \
	else \
	  PID=$$(ss -ltnp | grep -E "[:\.]$(PORT)\s" | sed -E 's/.*pid=([0-9]+).*/\1/' | head -n1); \
	  if [ -n "$$PID" ]; then \
	    kill -9 "$$PID" || true; \
	  else \
	    $(call _warn,Nenhum processo identificado para matar na porta $(PORT)); \
	  fi; \
	fi

# ------------------------------------
# Docker (sem Dockerfile) - útil para rodar dev/preview isolado
# ------------------------------------
docker-dev: ## Dev server dentro de container (Node 20 Alpine)
	@docker run --rm -it \
	  -p $(PORT):5173 \
	  -e CI=$(CI) \
	  -e HOST=$(HOST) \
	  -e PORT=$(PORT) \
	  -v "$$PWD":/app -w /app node:20-alpine \
	  sh -ceu 'apk add --no-cache git >/dev/null; npm ci || npm i; npx vite --host $$HOST --port $$PORT'

docker-preview: ## Build + preview servidos via container (Node 20 Alpine)
	@docker run --rm -it \
	  -p $(PORT):4173 \
	  -e CI=$(CI) \
	  -v "$$PWD":/app -w /app node:20-alpine \
	  sh -ceu '$(INSTALL_CMD); npm run build; npm run preview -- --host 0.0.0.0 --port 4173'

# -----------------------------------------------------------------------------
# FIM
# -----------------------------------------------------------------------------
