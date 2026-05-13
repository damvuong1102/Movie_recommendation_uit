export interface Movie {
  id: number;
  title: string;
  year: number;
  genre: string;
  imageUrl: string;
  runtime?: string;
  rating?: number;
  categories: string[];
}