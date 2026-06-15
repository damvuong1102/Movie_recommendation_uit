// types/rating.ts
export interface RatingResponse {
  id: number;
  userId: number;
  username: string;
  movieId: number;
  tmdbId?: number;
  movieTitle: string;
  rating: number;
  review: string;
  createdAt: string;
  updatedAt: string;
}

export interface RatingRequest {
  movieId: number;
  tmdbId?: number;
  rating: number;   // 0.5–5.0 per the API contract
  review?: string;
}
