# Local Database Setup

This folder contains a minimal local development setup with PostgreSQL.

## Start the database

```bash
cd /Users/rashmi/Desktop/Website
docker compose up -d
```

## PostgreSQL

Connect:

```bash
docker compose exec postgres psql -U postgres -d website_db
```

Example query:

```sql
SELECT * FROM accordion_items;
```

Default credentials:

- Database: `website_db`
- User: `postgres`
- Password: `postgres`
- Host: `localhost`
- Port: `5432`

## Stop the database

```bash
docker compose down
```
