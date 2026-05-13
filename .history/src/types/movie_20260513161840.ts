export interface StreamingPlatform {
  name: string;
  icon: string;
  link: string;
}

export interface Movie {
  id: number;
  title: string;

  year: number;

  genre: string;

  imageUrl: string;

  categories: string[];

  runtime?: string;

  rating?: number;

  description?: string;

  director?: string;

  cast?: string[];

  backdropUrl?: string;

  totalRatings?: number;

  streamingPlatforms?: StreamingPlatform[];
}