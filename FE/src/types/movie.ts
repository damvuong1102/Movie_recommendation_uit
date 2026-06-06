// types/movie.ts

export interface MovieSummary {
  id: number;
  tmdbId: number;
  title: string;
  posterUrl: string;       
  genres: string;          
  releaseYear: number;     
  avgRating: number;       
  ratingCount: number;     
}

export interface MovieDetail extends MovieSummary {
  movielensId: number;
  overview: string;        
  backdropUrl: string;
  releaseDate: string;     // "1999-10-15" format
  originalLanguage: string;
  runtimeMinutes: number;  
  popularity: number;
  myRating?: number;       // only present if user is logged in
  myReview?: string;
}