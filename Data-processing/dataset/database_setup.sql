-- 1. Tạo Database
CREATE DATABASE IF NOT EXISTS movie_recommendation_db;
USE movie_recommendation_db;

-- 2. Bảng Movies 
CREATE TABLE IF NOT EXISTS movies (
    movie_id INT PRIMARY KEY,       -- ID từ MovieLens
    title VARCHAR(255) NOT NULL,    -- Tên phim
    genres VARCHAR(255),            -- Thể loại (Action|Adventure...)
    tmdb_id INT UNIQUE              -- ID để chị ruby gọi API lấy ảnh
);

-- 3. Bảng Users (làm tính năng Login/Register)
CREATE TABLE IF NOT EXISTS users (
    user_id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL, -- Chị ruby sẽ dùng Bcrypt để mã hóa sau
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Bảng Ratings 
CREATE TABLE IF NOT EXISTS ratings (
    rating_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,           -- Khóa ngoại nối sang bảng users
    movie_id INT NOT NULL,          -- Khóa ngoại nối sang bảng movies
    rating FLOAT NOT NULL,          -- Điểm đánh giá (0.5 - 5.0)
    rating_time BIGINT,             -- Lưu timestamp nếu cần
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (movie_id) REFERENCES movies(movie_id) ON DELETE CASCADE
);