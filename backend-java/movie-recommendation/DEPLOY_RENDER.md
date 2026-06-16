# Deploy Java Backend To Render

This backend uses Spring Boot, JPA, Flyway, and PostgreSQL.

## Local setup

Build locally:

```bash
./mvnw clean package -DskipTests
```

Run locally:

```bash
./mvnw spring-boot:run
```

Health check:

```text
GET http://localhost:8080/actuator/health
```

## PostgreSQL setup

Use the external JDBC URL from Render/Neon. The app can seed the bundled
`movies_ready_for_db.csv` and `ratings.csv` files when the `movies` table is
empty.

## Render setup

Create a new Web Service from this repository.

Use these settings:

```text
Root Directory: backend-java/movie-recommendation
Build Command: ./mvnw clean package -DskipTests
Start Command: java -jar target/movie-recommendation-0.0.1-SNAPSHOT.jar
```

Environment variables:

```text
SPRING_PROFILES_ACTIVE=prod
SPRING_DATASOURCE_URL=jdbc:postgresql://<host>:<port>/<database>?sslmode=require
SPRING_DATASOURCE_USERNAME=<username>
SPRING_DATASOURCE_PASSWORD=<password>
CORS_ALLOWED_ORIGIN_PATTERNS=https://your-frontend-domain.com,https://*.github.io,https://*.vercel.app,https://*.onrender.com
JWT_SECRET=<base64-encoded-secret>
TMDB_ACCESS_TOKEN=...
```

Important production notes:

- Keep `SPRING_PROFILES_ACTIVE=prod` enabled. It turns on Flyway before Hibernate
  so PostgreSQL gets columns such as `avg_rating` before indexes and queries use
  them.
- `APP_DATA_LOADER_ENABLED` defaults to `true` in the `prod` profile. Set it to
  `false` only after the database already has movie rows.
- If `/api/movies` returns 500 and logs mention `column "avg_rating" does not
  exist`, run a redeploy with the `prod` profile or execute
  `src/main/resources/db/migration/V2__add_movie_rating_columns.sql` manually in
  PostgreSQL.

`TMDB_ACCESS_TOKEN` is needed for poster/backdrop enrichment. You can use
`TMDB_API_KEY` instead, but the access token is preferred.
