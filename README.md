# 🎬 Movies4You — Movie Recommendation System

[![Live Demo](https://img.shields.io/badge/Live_Demo-GitHub_Pages-blue?style=for-the-badge\&logo=github)](https://dbthyy.github.io/recommend_movies_website/#/home)
[![Backend](https://img.shields.io/badge/Backend-Spring_Boot-success?style=for-the-badge\&logo=springboot)](https://spring.io/projects/spring-boot)
[![Frontend](https://img.shields.io/badge/Frontend-React_18-61DAFB?style=for-the-badge\&logo=react)](https://react.dev/)
[![Database](https://img.shields.io/badge/Database-PostgreSQL-blue?style=for-the-badge\&logo=postgresql)](https://www.postgresql.org/)

**Movies4You** is a full-stack movie recommendation platform developed as a university project. The application enables users to discover movies, browse detailed information, submit ratings and reviews, and receive personalized movie recommendations based on their historical preferences.

The project follows a modern client-server architecture using **React**, **Spring Boot**, and **PostgreSQL**, with movie metadata enriched through the **TMDB API**.

🔗 **Live Demo:** https://dbthyy.github.io/recommend_movies_website/#/home



# 📌 Table of Contents

* Overview
* Features
* Tech Stack
* System Architecture
* Frontend Demo
* Project Structure
* Prerequisites
* Environment Variables
* Local Setup
* API Reference
* Database & Data Pipeline
* Build & Deployment
* Development Notes
* Contributors
* License



# 📖 Overview

Movies4You was built to simplify movie discovery by combining traditional browsing features with personalized recommendations.

Users can:

* Create an account and securely authenticate using JWT.
* Browse thousands of movies.
* Search movies by keyword.
* Filter movies by genre.
* View trending and top-rated movies.
* Read movie details.
* Submit, edit, and delete ratings.
* Receive personalized movie recommendations generated from historical rating data.



# ✨ Features

### 🔐 Authentication

* JWT Access Token & Refresh Token authentication
* Secure login and registration
* Automatic token refresh

### 🎬 Movie Discovery

* Paginated movie catalog
* Keyword search
* Genre filtering
* Trending movies
* Top-rated movies

### ⭐ Ratings & Reviews

* Create ratings
* Update ratings
* Delete ratings
* View community reviews

### 🤖 Recommendation Engine

* Personalized recommendations
* Recommendation generation based on historical user ratings
* Real-time recommendation endpoint

### 📦 Data Pipeline

* CSV dataset import
* Flyway database migration
* Optional automatic data loader

### 📱 Responsive Frontend

* Modern responsive UI
* Built with React + Tailwind CSS
* Static deployment via GitHub Pages



# 🛠 Tech Stack

| Layer               | Technologies                                                                                    |
| - | -- |
| Frontend            | React 18, Vite 6, TypeScript, Tailwind CSS 4, Radix UI, Material UI, Lucide Icons, React Router |
| Backend             | Java 17, Spring Boot, Spring Security, Spring Data JPA, Flyway                                  |
| Database            | PostgreSQL / Neon                                                                               |
| Data Processing     | Python                                                                                          |
| External API        | TMDB API                                                                                        |
| Alternative Backend | Express.js (backend-node/)                                                                      |



# 🏗 System Architecture

```text
                   React + Vite Frontend
                           │
                    HTTP REST + JWT
                           │
                  Spring Boot REST API
                           │
        ┌──────────────────┴──────────────────┐
        │                                     │
 PostgreSQL Database                    TMDB API
(Movies, Users, Ratings)          (Metadata & Posters)
```

### Application Workflow

1. Users interact with the React frontend.
2. The frontend communicates with the backend through REST APIs secured by JWT authentication.
3. Spring Boot processes requests and interacts with the PostgreSQL database.
4. Movie posters and metadata are enriched through the TMDB API.
5. Recommendation requests analyze user rating history and return personalized movie suggestions.



# 📸 Frontend Demo

## 🏠 Home Page
<img width="900" alt="Screenshot 2026-06-17 105204" src="https://github.com/user-attachments/assets/0c2357a9-2a2d-44f0-a825-38c280192de2" />

## 🎬 Movie Details
<img width="900" alt="Screenshot 2026-06-17 105358" src="https://github.com/user-attachments/assets/54c3f810-f96b-42bc-8274-f24a2b370a87" />

## 🔐 Authentication
### Login
<img width="900" alt="Screenshot 2026-06-17 105831" src="https://github.com/user-attachments/assets/c04ca274-7285-4dbc-9b5b-e4e54888d8d9" />

### Register
<img width="300" alt="Screenshot 2026-06-17 105904" src="https://github.com/user-attachments/assets/7a346f3c-e250-4fb9-a26f-d01d02a5fc92" />


# 📂 Project Structure

```text
Movie_recommendation_uit/
│
├── FE/                         # React + Vite frontend
├── backend-java/               # Spring Boot backend
│   └── movie-recommendation/
├── backend-node/               # Alternative Express backend
├── Data-processing/            # Data processing scripts & datasets
├── docs/                       # GitHub Pages build output
└── README.md
```


# ⚙️ Prerequisites

* Node.js 18+
* npm
* Java JDK 17
* PostgreSQL or Neon Database
* TMDB API Key / Access Token


# 🔑 Environment Variables

## Backend

```env
PORT=10000

SPRING_DATASOURCE_URL=jdbc:postgresql://<host>:<port>/<database>?sslmode=require
SPRING_DATASOURCE_USERNAME=<username>
SPRING_DATASOURCE_PASSWORD=<password>

SPRING_DATASOURCE_DRIVER_CLASS_NAME=org.postgresql.Driver
SPRING_JPA_DATABASE_PLATFORM=org.hibernate.dialect.PostgreSQLDialect
SPRING_JPA_HIBERNATE_DDL_AUTO=update
SPRING_JPA_SHOW_SQL=false

JWT_SECRET=<base64-secret>

CORS_ALLOWED_ORIGIN_PATTERNS=http://localhost:*,http://127.0.0.1:*,https://*.github.io,https://*.vercel.app,https://*.onrender.com

TMDB_ACCESS_TOKEN=<tmdb-access-token>
TMDB_API_KEY=<tmdb-api-key>

FLYWAY_ENABLED=true
APP_DATA_LOADER_ENABLED=false
```

By default, the backend runs on:

```text
http://localhost:10000
```

### Frontend

```env
VITE_API_BASE_URL=http://localhost:10000
```

If this variable is omitted, the frontend uses the default deployed backend configured in `FE/src/lib/api.ts`.


# 🚀 Local Setup

## 1. Run the Spring Boot Backend

```bash
cd backend-java/movie-recommendation
./mvnw spring-boot:run
```

Windows PowerShell:

```powershell
.\mvnw.cmd spring-boot:run
```

Health Check

```text
GET http://localhost:10000/actuator/health
```


## 2. Run the React Frontend

```bash
cd FE
npm install
npm run dev
```

Frontend:

```text
http://localhost:5173
```



## 3. Run the Express Backend (Optional)

```bash
cd backend-node
npm install
npm run dev
```

Copy `.env.example` to `.env` before starting the server.

# 🔌 API Reference

Base URL

```text
http://localhost:10000/api
```

## Authentication

| Method | Endpoint         | Authentication |
| ------ | -------- | -------------- |
| POST   | `/auth/register` | Public         |
| POST   | `/auth/login`    | Public         |
| POST   | `/auth/refresh`  | Public         |
| POST   | `/auth/logout`   | Public         |


## Movies

| Method | Endpoint                | Authentication |
| ------ | -------- | -------------- |
| GET    | `/movies`               | Public         |
| GET    | `/movies/{tmdbId}`      | Public         |
| GET    | `/movies/tmdb/{tmdbId}` | Public         |
| GET    | `/genres`               | Public         |

Supported query parameters:

* page
* size
* query
* genre
* type
* minRatings

Example:

```text
GET /movies?page=0&size=20&type=topRated&genre=Drama
```


## Ratings

| Method | Endpoint                    | Authentication |
| ------ | -------- | -------------- |
| POST   | `/ratings`                  | JWT Required   |
| PUT    | `/ratings/{id}`             | JWT Required   |
| DELETE | `/ratings/{id}`             | JWT Required   |
| GET    | `/movies/{movieId}/ratings` | Public         |


## Users & Recommendations

| Method | Endpoint                             | Authentication |
| ------ | -------- | -------------- |
| GET    | `/users/me`                          | JWT Required   |
| GET    | `/recommendations/{userId}?limit=10` | Public         |


# 🗄 Database & Data Pipeline

The backend manages database schema changes through **Flyway**.

Migration files are located in:

```text
backend-java/movie-recommendation/src/main/resources/db/migration/
```

Main datasets:

```text
movies_ready_for_db.csv
ratings.csv
```

The automatic data loader imports CSV files into PostgreSQL.

Enable data loading only during the initial database setup:

```env
APP_DATA_LOADER_ENABLED=true
```

Once the database has been seeded, disable it:

```env
APP_DATA_LOADER_ENABLED=false
```

to reduce application startup time.



# 🚀 Build & Deployment

## Frontend

```bash
cd FE
npm run build
```

The production build is generated in:

```text
docs/
```

which is deployed through GitHub Pages.



## Backend

```bash
cd backend-java/movie-recommendation
./mvnw clean package -DskipTests
```

The compiled JAR file is located in:

```text
target/
```



## Recommended Render Configuration

**Root Directory**

```text
backend-java/movie-recommendation
```

**Build Command**

```text
./mvnw clean package -DskipTests
```

**Start Command**

```text
java -jar target/movie-recommendation-0.0.1-SNAPSHOT.jar
```



# 📝 Development Notes

* The frontend communicates with the backend through `FE/src/lib/api.ts`.
* Protected endpoints automatically include the JWT access token.
* Expired access tokens are refreshed transparently using the refresh token endpoint.
* Update `CORS_ALLOWED_ORIGIN_PATTERNS` when deploying to a new frontend domain.
* Configure `VITE_API_BASE_URL` before building the frontend.
* Never commit `.env` files, database credentials, JWT secrets, or TMDB API tokens.



# 👥 Contributors

University of Information Technology (UIT) – VNU-HCM

| Student ID   | Name         | Responsibilities                                   |
| ------ | -------- | -------------- |
| 23521021 | Hồ Như Hồng Ngọc | Backend |
| 23521563 | Đinh Bảo Thy | Frontend |
| 23521822 | Nguyễn Đàm Vương  | Database & Recommendation System |



# 📄 License

This project was developed as an academic course project at the University of Information Technology (UIT), VNU-HCM.
All rights are reserved by the original project contributors.
