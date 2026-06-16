# ---------- Build stage ----------
FROM eclipse-temurin:17-jdk AS build

WORKDIR /build

COPY backend-java/movie-recommendation/mvnw .
COPY backend-java/movie-recommendation/.mvn .mvn
COPY backend-java/movie-recommendation/pom.xml .

RUN chmod +x mvnw
RUN ./mvnw dependency:go-offline

COPY backend-java/movie-recommendation/src src

RUN ./mvnw clean package -DskipTests


# ---------- Runtime stage ----------
FROM eclipse-temurin:17-jre

WORKDIR /app

COPY --from=build \
    /build/target/movie-recommendation-0.0.1-SNAPSHOT.jar \
    /app/app.jar

COPY Data-processing/dataset/movies_ready_for_db.csv \
    /app/dataset/movies_ready_for_db.csv

ENV SPRING_PROFILES_ACTIVE=prod
ENV FLYWAY_ENABLED=true
ENV MOVIES_DATASET_PATH=/app/dataset/movies_ready_for_db.csv

EXPOSE 10000

ENTRYPOINT ["java", "-jar", "/app/app.jar"]
