# Movie_recommendation_uit

## Project structure

```text
Movie_recommendation_uit/
├── FE/                         # React/Vite frontend
├── backend-java/
│   ├── technical_required_api.md
│   └── movie-recommendation/    # Spring Boot backend
├── backend-node/                # Express backend kept separate from Java
├── Data-processing/             # Dataset and import scripts
└── docs/                        # Built/static documentation or deployment output
```

## Backends

The Java and Node backends are intentionally separated:

- `backend-java/movie-recommendation`: Spring Boot application using `pom.xml`, `mvnw`, and `src/main/java`.
- `backend-node`: Express API using `package.json`, `server.js`, and `src/routes`.

Run each backend from its own folder so dependencies and routes do not get mixed together.
# Movie_recommendation_uit
