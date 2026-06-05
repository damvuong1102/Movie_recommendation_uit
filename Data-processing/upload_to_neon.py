
DATABASE_URL = "postgresql://neondb_owner:npg_KdlFs8pxJO3W@ep-frosty-field-ao9qrhd6-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
import pandas as pd
from sqlalchemy import create_engine


engine = create_engine(DATABASE_URL)


df_movies = pd.read_csv('dataset/movies_ready_for_db.csv')
df_movies.columns = ['movie_id', 'title', 'genres', 'tmdb_id']
df_movies = df_movies.drop_duplicates(subset=['tmdb_id'], keep='first')
df_movies.to_sql('movies', engine, if_exists='append', index=False)



df_users = pd.read_csv('dataset/users_sample.csv')
df_users.columns = ['user_id', 'username', 'password']
df_users.to_sql('users', engine, if_exists='append', index=False)


df_ratings = pd.read_csv('dataset/ratings.csv')
df_ratings = df_ratings[['userId', 'movieId', 'rating', 'timestamp']]
df_ratings.columns = ['user_id', 'movie_id', 'rating', 'rating_time']
df_ratings.to_sql('ratings', engine, if_exists='append', index=False)

