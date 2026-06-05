# Deploy Node Backend To Render

This backend uses Express, `pg`, and Neon PostgreSQL.

## Local setup

1. Copy `.env.example` to `.env`.
2. Set `DATABASE_URL` to your Neon connection string.
3. Install dependencies:

```bash
npm install
```

4. Run locally:

```bash
npm run dev
```

Health check:

```text
GET http://localhost:3000/health
```

## Neon setup

If your Neon database does not have tables yet, run `database/schema.sql` in the Neon SQL Editor.

Then upload CSV data with:

```bash
python ../../Data-processing/upload_to_neon.py
```

## Render setup

Create a new Web Service from this repository.

Use these settings:

```text
Root Directory: backend-java/movie-recommendation
Build Command: npm install
Start Command: npm start
```

Environment variables:

```text
DATABASE_URL=postgresql://...
NODE_ENV=production
CORS_ORIGIN=https://your-frontend-domain.com
```

For local frontend plus production frontend, separate origins with commas:

```text
CORS_ORIGIN=http://localhost:5173,https://your-frontend-domain.com
```
