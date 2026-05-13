// export interface Movie {
//   id: number;
//   title: string;
//   year: number;
//   genre: string;
//   imageUrl: string;
//   runtime?: string;
//   rating?: number;
//   categories: string[];
// }

export interface Movie {
  id: number;
  title: string;
  year: number;
  genre: string;
  imageUrl: string;
  runtime?: string;
  rating?: number;
  categories: string[];

  description?: string;
  director?: string;
  cast?: string[];
  backdropUrl?: string;
}