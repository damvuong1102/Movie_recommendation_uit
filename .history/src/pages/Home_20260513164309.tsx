import { Film, TrendingUp, Clock, Search, User, LogIn } from "lucide-react";
import Navbar from "../components/layout/Navbar";

import { allMovies } from "../data/movies";
import { MovieSection } from "../components/movie/MovieSection";

import { useState } from "react";

export default function Home() {
    const [search, setSearch] = useState("");

   const filteredMovies = allMovies.filter((movie) =>
  movie.title.toLowerCase().includes(search.toLowerCase())
);

  const recommendedMovies = filteredMovies.filter((movie) =>
    movie.categories.includes("recommended")
  );

  const topRatedMovies = filteredMovies.filter((movie) =>
    movie.categories.includes("top-rated")
  );

  const recentlyWatchedMovies = filteredMovies.filter((movie) =>
    movie.categories.includes("recently-watched")
  );
  return (
    <div className="min-h-screen bg-background">
      <Navbar
        search={search}
        setSearch={setSearch}
      />
      <main className="container mx-auto px-4 py-8 space-y-12">
        <MovieSection
          title="Recommended for You"
          icon={Film}
          movies={recommendedMovies}
        />

        <MovieSection
          title="Top Rated"
          icon={TrendingUp}
          movies={topRatedMovies}
        />

        <MovieSection
          title="Recently Watched"
          icon={Clock}
          movies={recentlyWatchedMovies}
          showRating
        />
      </main>
    </div>
  );
}