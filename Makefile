IMAGE ?= forgeboard-api
CONTAINER ?= forgeboard-api
PORT ?= 4000
FRONTEND_ORIGIN ?= http://localhost:3000
VOLUME ?= forgeboard-data

.PHONY: backend-build backend-up backend-down backend-logs backend-restart backend-health backend-shell

backend-build:
	docker build -t $(IMAGE) .

backend-up: backend-build
	docker volume inspect $(VOLUME) >NUL 2>&1 || docker volume create $(VOLUME)
	docker rm -f $(CONTAINER) >NUL 2>&1 || exit 0
	docker run -d --name $(CONTAINER) --restart unless-stopped -p $(PORT):4000 -e PORT=4000 -e FRONTEND_ORIGIN=$(FRONTEND_ORIGIN) -v $(VOLUME):/app/data $(IMAGE)
	@echo Backend started at http://localhost:$(PORT)

backend-down:
	docker rm -f $(CONTAINER)

backend-logs:
	docker logs -f $(CONTAINER)

backend-restart: backend-down backend-up

backend-health:
	curl --fail http://localhost:$(PORT)/api/health

backend-shell:
	docker exec -it $(CONTAINER) sh
