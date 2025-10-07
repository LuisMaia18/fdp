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
	port-check port-kill port-who docker-dev docker-preview ci analyze deps-audit deps-outdated env serve print-% is-git require-git git-init git-status git-branch git-check git-hooks git-hooks-install git-hooks-uninstall version-bump changelog release pre-commit

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

## ------------------------------------
## Integração com Git
## ------------------------------------
IS_GIT := $(shell test -d .git && echo 1 || echo 0)

is-git: ## Indica se o diretório atual é um repositório Git
	@if [ "$(IS_GIT)" = "1" ]; then echo yes; else echo no; fi

require-git: ## Falha se não estiver em um repositório Git
	@if [ "$(IS_GIT)" != "1" ]; then \
	  $(call _err,Repositório Git não encontrado. Rode `make git-init` ou inicialize com `git init`); \
	  exit 1; \
	fi

git-init: ## Inicializa repositório Git (branch $(MAIN_BRANCH)) e commit inicial opcional
	@if [ "$(IS_GIT)" != "1" ]; then \
	  git init; \
	  if git rev-parse --abbrev-ref HEAD >/dev/null 2>&1; then :; else git checkout -b $(MAIN_BRANCH); fi; \
	  $(call _ok,Git inicializado na branch $(MAIN_BRANCH)); \
	else \
	  $(call _warn,Repositório Git já inicializado); \
	fi; \
	if git diff --quiet && git diff --cached --quiet; then \
	  $(call _warn,Nada para commitar no momento); \
	else \
	  git add -A && git commit -m "chore: initial commit" || true; \
	fi

git-status: require-git ## Mostra status resumido do repositório
	@git status -sb

git-branch: require-git ## Mostra a branch atual
	@git rev-parse --abbrev-ref HEAD

git-check: require-git ## Falha se houver alterações não commitadas
	@git diff --quiet && git diff --cached --quiet || { $(call _err,Working tree sujo. Faça commit/stash antes.); exit 1; }

git-config-check: require-git ## Verifica user.name e user.email no git config
	@name=$$(git config --get user.name || true); email=$$(git config --get user.email || true); \
	if [ -z "$$name" ] || [ -z "$$email" ]; then \
	  $(call _warn,Git user.name/email não configurados); \
	  echo "Configure com: git config --global user.name 'Seu Nome' && git config --global user.email 'voce@exemplo.com'"; \
	else \
	  $(call _ok,Git configurado: $$name <$$email>); \
	fi

git-hooks: git-hooks-install ## Configura hooks a partir de scripts/git-hooks

git-hooks-install: require-git ## Configura core.hooksPath para scripts/git-hooks
	@if [ -d scripts/git-hooks ]; then \
	  chmod +x scripts/git-hooks/* || true; \
	  git config core.hooksPath scripts/git-hooks; \
	  $(call _ok,Hooks configurados (core.hooksPath -> scripts/git-hooks)); \
	else \
	  $(call _warn,Diretório scripts/git-hooks não encontrado); \
	fi

git-hooks-uninstall: require-git ## Remove configuração de hooks personalizados
	@git config --unset core.hooksPath || true
	$(call _ok,Hooks personalizados desativados)

PART ?= patch
version-bump: require-git ## Sobe versão (PART=patch|minor|major) e cria tag
	@if [ "$(PART)" != "patch" ] && [ "$(PART)" != "minor" ] && [ "$(PART)" != "major" ]; then \
	  $(call _err,PART inválido: $(PART) (use patch|minor|major)); exit 2; \
	fi
	@if [ "$(PKG_MGR)" = "npm" ]; then \
	  npm version $(PART) -m "chore(release): v%s"; \
	elif [ "$(PKG_MGR)" = "pnpm" ]; then \
	  pnpm version $(PART) -m "chore(release): v%s"; \
	else \
	  yarn version --$(PART); \
	fi
	$(call _ok,Versão atualizada e tag criada)

changelog: ## Gera/atualiza CHANGELOG.md usando conventional-changelog (se disponível)
	@$(EXEC) conventional-changelog -p angular -i CHANGELOG.md -s || { $(call _warn,conventional-changelog não disponível; pulei); true; }

release: version-bump ## Realiza release: bump + push tags (se remoto configurado)
	@if git rev-parse --abbrev-ref --symbolic-full-name @{u} >/dev/null 2>&1; then \
	  git push --follow-tags; \
	  $(call _ok,Release enviado ao remoto); \
	else \
	  $(call _warn,Nenhum remoto configurado; commit/tag locais apenas); \
	fi

pre-commit: ## Execuções rápidas antes de commit (rodado localmente)
	$(MAKE) lint
	$(MAKE) format

print-%: ## Debug: imprime o valor da variável (% é o nome)
	@echo $* = $($*)

lint: check-env ## Executa ESLint
	@if [ -f eslint.config.js ]; then \
	  $(RUN) lint; \
	else \
	  $(call _warn,eslint.config.js não encontrado, rodando fallback via npx); \
	  $(EXEC) eslint . --ext .js,.jsx --max-warnings=0 || true; \
	fi

lint-fix: check-env ## Corrige problemas com ESLint (--fix)
	@if [ -f eslint.config.js ]; then \
	  $(EXEC) eslint . --ext .js,.jsx --fix; \
	else \
	  $(call _warn,eslint.config.js não encontrado, aplicando fix via npx); \
	  $(EXEC) eslint . --ext .js,.jsx --fix || true; \
	fi

format: ## Formata o código com Prettier (npx; opcional)
	$(call _msg,Formatando com Prettier ...)
	$(EXEC) prettier "**/*.{js,jsx,json,css,md}" --ignore-path .gitignore --write || true
	$(call _ok,Formatação finalizada)

typecheck: ## Checagem de tipos (TS) se houver tsconfig.json
	@if [ -f tsconfig.json ]; then \
	  $(call _msg,Executando checagem de tipos ...); \
	  $(EXEC) tsc --noEmit; \
	else \
	  $(call _warn,tsconfig.json não encontrado, pulando typecheck); \
	fi

clean: ## Remove artefatos de build
	@rm -rf dist
	$(call _ok,Limpeza de dist concluída)

clean-node: ## Remove node_modules (atenção!)
	@rm -rf node_modules
	$(call _ok,node_modules removido)

clean-all: clean clean-node ## Remove dist + node_modules

check: ## Verificações rápidas (lint + build)
	$(MAKE) lint
	$(MAKE) build
	$(call _ok,Check concluído com sucesso)

ci: ## Target para CI (instala, lint, build)
	$(MAKE) install
	$(MAKE) lint
	$(MAKE) build

open: ## Abre o navegador em http://localhost:$(PORT)
	@if command -v xdg-open >/dev/null 2>&1; then \
	  xdg-open "http://localhost:$(PORT)" >/dev/null 2>&1 || true; \
	else \
	  $(call _warn,xdg-open não disponível); \
	fi

show-pm: ## Mostra o gerenciador de pacotes detectado
	@echo $(PKG_MGR)

show-env: ## Mostra variáveis relevantes
	@echo "PKG_MGR=$(PKG_MGR)"
	@echo "PORT=$(PORT)"
	@echo "HOST=$(HOST)"
	@echo "OPEN=$(OPEN)"
	@echo "CI=$(CI)"
	@echo "MAIN_BRANCH=$(MAIN_BRANCH)"

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
