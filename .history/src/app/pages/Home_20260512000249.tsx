import { Film, TrendingUp, Clock, Search, User, LogIn } from "lucide-react";

import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";

import {
  recommendedMovies,
  topRatedMovies,
  recentlyWatchedMovies
} from "../data/movies";

import { MovieSection } from "../components/MovieSection";

import { useState } from "react";

export default function Home() {
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
                {/* <Input
                  type="search"
                  placeholder="Search movies..."
                  className="pl-9 w-64"
                /> */}
<Input
  type="search"
  placeholder="Search movies..."
  className="pl-9 w-64"
  value={search}
  onChange={(e) => setSearch(e.target.value)}
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

const [search, setSearch] = useState("");