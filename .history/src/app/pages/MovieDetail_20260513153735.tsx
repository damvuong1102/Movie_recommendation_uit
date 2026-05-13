import { Film, Search, User, LogIn, Star, Clock, Calendar, Play } from "lucide-react";

import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { ReviewCard } from "../components/ReviewCard";
import { StreamingIcon } from "../components/StreamingIcon";
import { RatingSubmit } from "../components/RatingSubmit";
import { Separator } from "../components/ui/separator";

import { useParams } from "react-router-dom";
import { allMovies } from "../data/movies";

const reviews = [
  {
    userName: "Sarah Johnson",
    userAvatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
    rating: 5,
    date: "May 10, 2026",
    reviewText:
      "Absolutely mind-blowing! Christopher Nolan crafted a masterpiece.",
    helpful: 127
  },
  {
    userName: "Michael Chen",
    userAvatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
    rating: 4,
    date: "May 8, 2026",
    reviewText:
      "Great concept and execution. Worth rewatching.",
    helpful: 89
  }
];

const streamingPlatforms = [
  {
    name: "Netflix",
    icon: "https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=100&h=100&fit=crop",
    link: "#"
  },
  {
    name: "Prime",
    icon: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=100&h=100&fit=crop",
    link: "#"
  }
];

export default function MovieDetail() {
  const { id } = useParams();

  const movie = allMovies.find(
    (movie) => movie.id === Number(id)
  );

  if (!movie) {
    return <div>Movie not found</div>;
  }

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

      <div className="relative h-96 overflow-hidden">
        <img
          src={movie.backdropUrl}
          alt={movie.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
      </div>

      <main className="container mx-auto px-4 -mt-64 relative z-10">
        <div className="grid md:grid-cols-[300px_1fr] gap-8 mb-12">
          <div className="relative">
            <img
              src={movie.imageUrl}
              alt={movie.title}
              className="w-full rounded-lg shadow-2xl"
            />
            <Button className="w-full mt-4" size="lg">
              <Play className="w-5 h-5 mr-2 fill-current" />
              Watch Now
            </Button>
          </div>

          <div className="space-y-6 pt-8">
            <div>
              <h1 className="mb-2">{movie.title}</h1>
              <div className="flex flex-wrap items-center gap-4 text-muted-foreground mb-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>{movie.year}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>{movie.runtime}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-6">
                {movie.genre.map((genre) => (
                  <Badge key={genre} variant="secondary">{genre}</Badge>
                ))}
              </div>

              <div className="flex items-center gap-4 mb-6">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className="w-6 h-6"
                        fill={movie.rating? >= star ? "#eab308" : "none"}
                        stroke={movie.rating >= star ? "#eab308" : "currentColor"}
                      />
                    ))}
                  </div>
                  <span className="text-xl">{movieDetails.rating.toFixed(1)}</span>
                </div>
                <Separator orientation="vertical" className="h-6" />
                <span className="text-sm text-muted-foreground">
                  {movieDetails.totalRatings.toLocaleString()} ratings
                </span>
              </div>

              <p className="text-muted-foreground mb-6">
                {movieDetails.description}
              </p>

              <div className="space-y-2 mb-6">
                <div>
                  <span className="text-muted-foreground">Director: </span>
                  <span>{movieDetails.director}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Cast: </span>
                  <span>{movieDetails.cast.join(", ")}</span>
                </div>
              </div>

              <div>
                <h3 className="mb-4">Available On</h3>
                <div className="flex flex-wrap gap-3">
                  {movieDetails.streamingPlatforms.map((platform) => (
                    <StreamingIcon
                      key={platform.name}
                      name={platform.name}
                      icon={platform.icon}
                      link={platform.link}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 pb-12">
          <div>
            <h2 className="mb-6">Reviews ({reviews.length})</h2>
            <div className="space-y-4">
              {reviews.map((review, index) => (
                <ReviewCard key={index} {...review} />
              ))}
            </div>
          </div>

          <div>
            <RatingSubmit />
          </div>
        </div>
      </main>
    </div>
  );
}