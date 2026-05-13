import { allMovies } from "../data/movies";

export async function getMovies() {
  return allMovies;
}

export async function getMovieById(id: number) {
  return allMovies.find((movie) => movie.id === id);
}