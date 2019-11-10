install-tools:
	@npm install -g gulp
	@npm install -g typescript
	@npm install -g ts-node

install:
	@npm install
	@cd client-libs;\
	npm install;\
	cd ..
	@echo '   '
	@echo '--- Installation complete ---'

prod:
	npm run format-code
	gulp prod
