# Local Database Setup

This folder contains a minimal local development setup with both PostgreSQL and MongoDB.

## Start both databases

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

## MongoDB

Connect with Mongo shell:

```bash
docker compose exec mongo mongosh -u admin -p admin123 --authenticationDatabase admin
```

Example query:

```javascript
use website_db
show collections
```

Default credentials:

- User: `admin`
- Password: `admin123`
- Host: `localhost`
- Port: `27017`

## Stop the databases

```bash
docker compose down
```
