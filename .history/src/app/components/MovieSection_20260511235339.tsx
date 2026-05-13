import { MovieCard } from "./MovieCard";
import { MovieCardWithRating } from "./MovieCardWithRating";
import { Movie } from "../types/movie";

interface MovieSectionProps {
  title: string;
  icon: React.ElementType;
  movies: Movie[];
  showRating?: boolean;
}