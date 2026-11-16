# BIT210 Service Day Dashboard

## Local MySQL setup

The backend uses MySQL. Install MySQL Server, create a database, and copy `.env.example` to `.env`:

```sql
CREATE DATABASE service_day;
```

Set the `MYSQL_*` values and a long random `JWT_SECRET` in `.env`. The backend creates or verifies
the four application tables on startup. To inspect them:

```bash
mysql -u root -p service_day
SHOW TABLES;
```

You can test only the database handshake with `npm run db:check`.

## Run the web app

Start the backend and frontend together:

```bash
npm run dev
```

Once it is running, open `http://localhost:4200/`.

The backend listens on `http://localhost:3000` and connects to the MySQL host from `.env`.

## Other useful commands

Build the frontend:

```bash
npm run build
```

Run unit tests:

```bash
npm test
```
