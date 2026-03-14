# Bank System (CQRS + Event Sourcing)

Minimal banking API built with Node.js, TypeScript, Express, and PostgreSQL. The project is set up for CQRS and Event Sourcing and ships with Docker for local development.

## Features
- Express API with health checks
- PostgreSQL integration via `pg`
- Seeded database schema via SQL init script
- Dockerized app + database

## Tech Stack
- Node.js 18
- TypeScript
- Express
- PostgreSQL 15
- Docker / Docker Compose

## Project Structure
```
bank-system/
	docker-compose.yml
	Dockerfile
	package.json
	README.md
	tsconfig.json
	seeds/
		init.sql
	src/
		docker-compose.yml
		Dockerfile
		index.ts
		submission.json
		common/
			db.ts
		read/
			projectors.ts
			queryHandlers.ts
			domain/
				aggregate.ts
				events.ts
		write/
			commandHandlers.ts
			eventStore.ts
```

## Environment Variables
These are used by the app and Docker Compose:

```
API_PORT=8080
DATABASE_URL=postgresql://user:password@db:5432/bank_db
DB_USER=user
DB_PASSWORD=password
DB_NAME=bank_db
```

## Running with Docker (Recommended)
From the project root:

```
docker-compose up --build
```

Stop and remove containers/volumes:

```
docker-compose down -v
```

### Services and Ports
- API: http://localhost:8080
- Database:
	- root docker-compose.yml exposes 5433 -> 5432
	- src/docker-compose.yml exposes 5432 -> 5432

## Running Locally (Without Docker)
1) Install dependencies:

```
npm install
```

2) Start the API:

```
npm run dev
```

The server starts on port 8080 by default.

## API Endpoints
- `GET /`
	- Returns service status and architecture info
- `GET /health`
	- Checks database connectivity and lists public tables

Example:

```
curl http://localhost:8080/health
```

## Database Seed
The database initializes from:

```
seeds/init.sql
```

## Useful Commands
- `npm run dev` — run in watch mode
- `npm run build` — compile TypeScript
- `npm run start` — run with `ts-node`

## Notes
- The application reads `DATABASE_URL` to connect to Postgres.
- The API is defined in `src/index.ts`.
- Both root and `src/` include Docker assets; use the root versions unless you specifically need the ones in `src/`.