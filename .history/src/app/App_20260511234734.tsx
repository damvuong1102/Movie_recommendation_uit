import { Film, TrendingUp, Clock, Search, User, LogIn } from "lucide-react";
import { MovieCard } from "./components/MovieCard";
import { MovieCardWithRating } from "./components/MovieCardWithRating";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";


const topRatedMovies = [
  {
    id: 6,
    title: "The Godfather",
    year: 1972,
    rating: 4.6,
    genre: "Crime",
    imageUrl: "https://images.unsplash.com/photo-1594908900066-3f47337549d8?w=400&h=600&fit=crop",
    runtime: "2h 55m"
  },
  {
    id: 7,
    title: "Schindler's List",
    year: 1993,
    rating: 4.5,
    genre: "Drama",
    imageUrl: "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=400&h=600&fit=crop",
    runtime: "3h 15m"
  },
  {
    id: 8,
    title: "12 Angry Men",
    year: 1957,
    rating: 4.5,
    genre: "Drama",
    imageUrl: "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=400&h=600&fit=crop",
    runtime: "1h 36m"
  },
  {
    id: 9,
    title: "Fight Club",
    year: 1999,
    rating: 4.4,
    genre: "Drama",
    imageUrl: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&h=600&fit=crop",
    runtime: "2h 19m"
  },
  {
    id: 10,
    title: "Forrest Gump",
    year: 1994,
    rating: 4.4,
    genre: "Drama",
    imageUrl: "https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?w=400&h=600&fit=crop",
    runtime: "2h 22m"
  }
];

const recentlyWatchedMovies = [
  {
    id: 11,
    title: "Oppenheimer",
    year: 2023,
    genre: "Biography",
    imageUrl: "https://images.unsplash.com/photo-1533928298208-27ff66555d8d?w=400&h=600&fit=crop",
    runtime: "3h 0m"
  },
  {
    id: 12,
    title: "Dune",
    year: 2021,
    genre: "Sci-Fi",
    imageUrl: "https://images.unsplash.com/photo-1530789253388-582c481c54b0?w=400&h=600&fit=crop",
    runtime: "2h 35m"
  },
  {
    id: 13,
    title: "The Matrix",
    year: 1999,
    genre: "Sci-Fi",
    imageUrl: "https://images.unsplash.com/photo-1435575653489-b0873ec954e2?w=400&h=600&fit=crop",
    runtime: "2h 16m"
  },
  {
    id: 14,
    title: "Gladiator",
    year: 2000,
    genre: "Action",
    imageUrl: "https://images.unsplash.com/photo-1594909122845-11baa439b7bf?w=400&h=600&fit=crop",
    runtime: "2h 35m"
  }
];

export default function App() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1598899134739-24c46f58b8c0?w=100&h=100&fit=crop"
                  alt="CineStream Logo"
                  className="w-full h-full object-cover"
                />
              </div>
              <h1>CineStream</h1>
            </div>

            <div className="flex items-center gap-4">
              <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search movies..."
                  className="pl-9 w-64"
                />
              </div>

              <Button variant="ghost" size="icon" className="md:hidden">
                <Search className="w-5 h-5" />
              </Button>

              <Button variant="ghost" size="icon">
                <User className="w-5 h-5" />
              </Button>

              <Button>
                <LogIn className="w-4 h-4 mr-2" />
                Log In
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-12">
        <section>
          <div className="flex items-center gap-2 mb-6">
            <Film className="w-6 h-6 text-primary" />
            <h2>Recommended for You</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {recommendedMovies.map((movie) => (
              <MovieCard key={movie.id} {...movie} />
            ))}
          </div>
        </section>

        <section>
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="w-6 h-6 text-primary" />
            <h2>Top Rated</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {topRatedMovies.map((movie) => (
              <MovieCard key={movie.id} {...movie} />
            ))}
          </div>
        </section>

        <section>
          <div className="flex items-center gap-2 mb-6">
            <Clock className="w-6 h-6 text-primary" />
            <h2>Recently Watched</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {recentlyWatchedMovies.map((movie) => (
              <MovieCardWithRating key={movie.id} {...movie} />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}