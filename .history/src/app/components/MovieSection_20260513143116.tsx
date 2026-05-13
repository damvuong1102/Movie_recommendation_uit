import { MovieCard } from "./MovieCard";
import { MovieCardWithRating } from "./MovieCardWithRating";
import { Movie } from "../types/movie";

interface MovieSectionProps {
  title: string;
  icon: React.ElementType;
  movies: Movie[];
  showRating?: boolean;
}
import { Movie } from "../types/movie";

interface MovieCardProps extends Movie {}

export function MovieSection({
  title,
  icon: Icon,
  movies,
  showRating
}: MovieSectionProps) {
  return (
    <section>
      <div className="flex items-center gap-2 mb-6">
        <Icon className="w-6 h-6 text-primary" />
        <h2>{title}</h2>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {movies.map((movie) =>
          showRating ? (
            <MovieCardWithRating key={movie.id} {...movie} />
          ) : (
            <MovieCard key={movie.id} {...movie} />
          )
        )}
      </div>
    </section>
  );
}