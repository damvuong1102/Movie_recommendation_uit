# Movies4You - Movie Recommendation UIT

Movies4You là ứng dụng gợi ý phim gồm giao diện React/Vite, API Spring Boot và dữ liệu phim/rating dùng cho bài toán đề xuất. Hệ thống hỗ trợ đăng ký, đăng nhập JWT, xem danh sách phim, lọc theo thể loại, tìm kiếm, xem chi tiết phim, đánh giá phim và lấy gợi ý cá nhân hóa.

## Mục lục

- [Tính năng chính](#tính-năng-chính)
- [Công nghệ sử dụng](#công-nghệ-sử-dụng)
- [Cấu trúc thư mục](#cấu-trúc-thư-mục)
- [Yêu cầu môi trường](#yêu-cầu-môi-trường)
- [Cấu hình biến môi trường](#cấu-hình-biến-môi-trường)
- [Chạy dự án local](#chạy-dự-án-local)
- [API chính](#api-chính)
- [Dữ liệu và migration](#dữ-liệu-và-migration)
- [Build và deploy](#build-và-deploy)
- [Ghi chú phát triển](#ghi-chú-phát-triển)

## Tính năng chính

- Xác thực người dùng bằng JWT access token và refresh token.
- Danh sách phim có phân trang, tìm kiếm, lọc thể loại, top rated và trending.
- Trang chi tiết phim theo `tmdbId`.
- Đánh giá phim, chỉnh sửa đánh giá và xóa đánh giá.
- Gợi ý phim theo người dùng dựa trên dữ liệu rating.
- Tải dữ liệu phim/rating từ CSV khi bật data loader.
- Frontend responsive, hỗ trợ build tĩnh ra thư mục `docs/` để deploy GitHub Pages.

## Công nghệ sử dụng

### Frontend

- React 18
- Vite 6
- TypeScript
- Tailwind CSS 4
- Radix UI, MUI, lucide-react
- React Router

### Backend chính

- Java 17
- Spring Boot 4
- Spring Web MVC
- Spring Security
- Spring Data JPA
- Flyway
- PostgreSQL/Neon
- TMDB API

### Backend Node

Thư mục `backend-node/` là Express API được tách riêng. Backend Java trong `backend-java/movie-recommendation/` là backend chính đang khớp với frontend hiện tại.

## Cấu trúc thư mục

```text
Movie_recommendation_uit/
├── FE/                              # React/Vite frontend
├── backend-java/
│   ├── technical_required_api.md    # Ghi chú yêu cầu API
│   └── movie-recommendation/        # Spring Boot backend chính
├── backend-node/                    # Express backend tách riêng
├── Data-processing/                 # Dataset, notebook và script import
├── docs/                            # Output build tĩnh của frontend
└── README.md
```

## Yêu cầu môi trường

- Node.js 18 trở lên
- npm
- Java JDK 17
- Maven Wrapper đã có sẵn trong `backend-java/movie-recommendation/`
- PostgreSQL hoặc Neon database
- TMDB API token hoặc API key nếu muốn lấy ảnh/poster từ TMDB

## Cấu hình biến môi trường

Không commit secret thật lên Git. File `.env` ở root chỉ nên dùng cho local.

### Backend Java

Các biến thường dùng:

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
CORS_ALLOWED_ORIGIN_PATTERNS=http://localhost:*,http://127.0.0.1:*,https://*.vercel.app,https://*.github.io,https://*.onrender.com
TMDB_ACCESS_TOKEN=<tmdb-access-token>
TMDB_API_KEY=<tmdb-api-key>
APP_DATA_LOADER_ENABLED=false
FLYWAY_ENABLED=true
```

Lưu ý: `application.properties` hiện đặt `server.port=${PORT:10000}`, vì vậy local backend mặc định chạy ở `http://localhost:10000`.

### Frontend

Frontend đọc API base URL từ biến Vite:

```env
VITE_API_BASE_URL=http://localhost:10000
```

Nếu không cấu hình, frontend sẽ dùng backend deploy mặc định được khai báo trong `FE/src/lib/api.ts`.

## Chạy dự án local

### 1. Chạy backend Java

```bash
cd backend-java/movie-recommendation
./mvnw spring-boot:run
```

Trên Windows PowerShell:

```powershell
cd backend-java/movie-recommendation
.\mvnw.cmd spring-boot:run
```

Kiểm tra health check:

```text
GET http://localhost:10000/actuator/health
```

### 2. Chạy frontend

```bash
cd FE
npm install
npm run dev
```

Vite thường chạy tại:

```text
http://localhost:5173
```

### 3. Chạy backend Node nếu cần

Backend Node là lựa chọn tách riêng:

```bash
cd backend-node
npm install
npm run dev
```

Trước khi chạy, copy `backend-node/.env.example` thành `.env` và điền database/TMDB/JWT.

## API chính

Base URL local của Java backend:

```text
http://localhost:10000
```

Tất cả API nghiệp vụ nằm dưới prefix `/api`.

### Auth

| Method | Endpoint | Mô tả |
| --- | --- | --- |
| POST | `/api/auth/register` | Đăng ký tài khoản |
| POST | `/api/auth/login` | Đăng nhập |
| POST | `/api/auth/refresh` | Làm mới access token |
| POST | `/api/auth/logout` | Đăng xuất |

Ví dụ đăng nhập:

```json
{
  "username": "demo",
  "password": "123456"
}
```

### Movies

| Method | Endpoint | Mô tả |
| --- | --- | --- |
| GET | `/api/movies` | Lấy danh sách phim |
| GET | `/api/movies/{tmdbId}` | Lấy chi tiết phim theo TMDB ID |
| GET | `/api/movies/tmdb/{tmdbId}` | Lấy chi tiết phim theo TMDB ID |
| GET | `/api/genres` | Lấy danh sách thể loại |

Query params hỗ trợ cho `/api/movies`:

| Param | Mô tả |
| --- | --- |
| `page` | Trang hiện tại, mặc định `0` |
| `size` | Số phim mỗi trang, mặc định `20`, tối đa `100` |
| `query` | Từ khóa tìm kiếm |
| `genre` | Lọc thể loại, ví dụ `Action` |
| `type` | `topRated`, `trending`, `recommended` |
| `minRatings` | Số lượng rating tối thiểu |

Ví dụ:

```text
GET /api/movies?page=0&size=20&type=topRated&genre=Drama
```

### Ratings

| Method | Endpoint | Mô tả | Yêu cầu token |
| --- | --- | --- | --- |
| POST | `/api/ratings` | Tạo/cập nhật đánh giá phim | Có |
| PUT | `/api/ratings/{id}` | Cập nhật đánh giá | Có |
| DELETE | `/api/ratings/{id}` | Xóa đánh giá | Có |
| GET | `/api/movies/{movieId}/ratings` | Lấy danh sách đánh giá của phim | Không |

Ví dụ tạo rating:

```json
{
  "movieId": 1,
  "tmdbId": 550,
  "rating": 4.5,
  "review": "Phim rất đáng xem"
}
```

### Users và recommendations

| Method | Endpoint | Mô tả | Yêu cầu token |
| --- | --- | --- | --- |
| GET | `/api/users/me` | Lấy thông tin người dùng hiện tại | Có |
| GET | `/api/recommendations/{userId}?limit=10` | Lấy gợi ý phim cho người dùng | Không |

## Dữ liệu và migration

Backend Java dùng Flyway migration tại:

```text
backend-java/movie-recommendation/src/main/resources/db/migration/
```

Các file dữ liệu CSV chính:

```text
backend-java/movie-recommendation/src/main/resources/movies_ready_for_db.csv
backend-java/movie-recommendation/src/main/resources/ratings.csv
Data-processing/dataset/
```

Data loader đọc đường dẫn từ:

```env
MOVIES_DATASET_PATH=classpath:movies_ready_for_db.csv
RATINGS_DATASET_PATH=classpath:ratings.csv
APP_DATA_LOADER_ENABLED=true
```

Chỉ bật `APP_DATA_LOADER_ENABLED=true` khi cần seed dữ liệu. Sau khi database đã có dữ liệu, nên tắt để tránh thời gian khởi động lâu.

## Build và deploy

### Build frontend

```bash
cd FE
npm run build
```

Theo `FE/vite.config.ts`, output được xuất ra:

```text
docs/
```

`base` hiện là:

```text
/recommend_movies_website/
```

Cấu hình này phù hợp khi deploy GitHub Pages dưới repository path tương ứng.

### Build backend Java

```bash
cd backend-java/movie-recommendation
./mvnw clean package -DskipTests
```

Windows PowerShell:

```powershell
cd backend-java/movie-recommendation
.\mvnw.cmd clean package -DskipTests
```

File `.jar` sau build nằm trong:

```text
backend-java/movie-recommendation/target/
```

### Deploy Render cho backend Java

Thiết lập khuyến nghị:

```text
Root Directory: backend-java/movie-recommendation
Build Command: ./mvnw clean package -DskipTests
Start Command: java -jar target/movie-recommendation-0.0.1-SNAPSHOT.jar
```

Biến môi trường cần có trên Render:

```env
PORT=10000
SPRING_DATASOURCE_URL=jdbc:postgresql://<host>:<port>/<database>?sslmode=require
SPRING_DATASOURCE_USERNAME=<username>
SPRING_DATASOURCE_PASSWORD=<password>
JWT_SECRET=<base64-secret>
CORS_ALLOWED_ORIGIN_PATTERNS=https://your-frontend-domain.com,https://*.github.io,https://*.vercel.app,https://*.onrender.com
TMDB_ACCESS_TOKEN=<tmdb-access-token>
FLYWAY_ENABLED=true
APP_DATA_LOADER_ENABLED=false
```

## Ghi chú phát triển

- Frontend gọi API qua `FE/src/lib/api.ts`; mọi endpoint được nối với `/api`.
- Các request cần đăng nhập sẽ tự gắn header `Authorization: Bearer <token>`.
- Khi access token hết hạn, frontend gọi `/api/auth/refresh` bằng refresh token.
- Demo login `admin/admin123` đang được mock trong `FE/src/services/authService.ts`; không dùng cơ chế này cho production.
- Nếu đổi domain frontend, cần cập nhật `CORS_ALLOWED_ORIGIN_PATTERNS`.
- Nếu đổi backend URL, cần cập nhật `VITE_API_BASE_URL` trước khi build frontend.
- Không đưa `.env`, database password, JWT secret hoặc TMDB token thật vào commit.
