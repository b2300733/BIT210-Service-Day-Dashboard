# BIT210 Service Day Dashboard

## Run the web app

Copy `.env.example` to `.env`, configure a MySQL database, apply `backend/schema.sql`, and then start the backend and frontend together:

```bash
mysql -h <MYSQL_HOST> -u <MYSQL_USER> -p <MYSQL_DATABASE> < backend/schema.sql
npm run dev
```

Once it is running, open `http://localhost:4200/`.

For an existing MongoDB database, set `MONGODB_URI` and the MySQL variables, then run:

```bash
npm run migrate:mongo:mysql
```

For a single EC2 host, build the static frontend and run the backend:

```bash
npm run build
npm run start:production
```

The production server serves the Angular files and API from port `3000`. Set the EC2 security group to allow HTTP traffic only through the intended load balancer or trusted source.

## Other useful commands

Build the frontend:

```bash
npm run build
```

Run unit tests:

```bash
npm test
```
