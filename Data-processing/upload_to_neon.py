
import os
from pathlib import Path

import pandas as pd
from sqlalchemy import create_engine


BASE_DIR = Path(__file__).resolve().parent
ROOT_DIR = BASE_DIR.parent


def load_env_file(path: Path) -> None:
    if not path.exists():
        return

    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue

        key, value = line.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


load_env_file(ROOT_DIR / ".env")
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL is not set. Add it to the project .env file.")

engine = create_engine(DATABASE_URL)

df_movies = pd.read_csv(BASE_DIR / 'dataset/movies_ready_for_db.csv')
df_movies.columns = ['movie_id', 'title', 'genres', 'tmdb_id']
df_movies = df_movies.drop_duplicates(subset=['tmdb_id'], keep='first')
df_movies.to_sql('movies', engine, if_exists='append', index=False)




df_users = pd.read_csv(BASE_DIR / 'dataset/users_sample.csv')
df_users.columns = ['user_id', 'username', 'password']
df_users.to_sql('users', engine, if_exists='append', index=False)

df_ratings = pd.read_csv(BASE_DIR / 'dataset/ratings.csv')
df_ratings = df_ratings[['userId', 'movieId', 'rating', 'timestamp']]
df_ratings.columns = ['user_id', 'movie_id', 'rating', 'rating_time']
df_ratings.to_sql('ratings', engine, if_exists='append', index=False)

