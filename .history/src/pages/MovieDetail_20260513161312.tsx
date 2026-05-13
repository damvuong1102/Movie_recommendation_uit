import { Film, Search, User, LogIn, Star, Clock, Calendar, Play } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { ReviewCard } from "../components/review/ReviewCard";
import { StreamingIcon } from "../components/movie/StreamingIcon";
import { RatingSubmit } from "../components/RatingSubmit";
import { Separator } from "../components/ui/separator";

const movieDetails = {
  title: "Inception",
  year: 2010,
  duration: "2h 28m",
  genres: ["Sci-Fi", "Action", "Thriller"],
  rating: 4.4,
  totalRatings: 2847,
  posterUrl: "https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=500&h=750&fit=crop",
  backdropUrl: "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=1200&h=400&fit=crop",
  description: "A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O., but his tragic past may doom the project and his team to disaster.",
  director: "Christopher Nolan",
  cast: ["Leonardo DiCaprio", "Joseph Gordon-Levitt", "Elliot Page", "Tom Hardy"],
  streamingPlatforms: [
    {
      name: "Netflix",
      icon: "https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=100&h=100&fit=crop",
      link: "#"
    },
    {
      name: "Prime",
      icon: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=100&h=100&fit=crop",
      link: "#"
    },
    {
      name: "HBO",
      icon: "https://images.unsplash.com/photo-1611162618071-b39a2ec055fb?w=100&h=100&fit=crop",
      link: "#"
    },
    {
      name: "Hulu",
      icon: "https://images.unsplash.com/photo-1611162616475-46b635cb6868?w=100&h=100&fit=crop",
      link: "#"
    }
  ]
};

const reviews = [
  {
    userName: "Sarah Johnson",
    userAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
    rating: 5,
    date: "May 10, 2026",
    reviewText: "Absolutely mind-blowing! Christopher Nolan crafted a masterpiece that challenges your perception of reality. The visual effects are stunning, and the story keeps you on the edge of your seat from start to finish. A must-watch for any movie enthusiast.",
    helpful: 127
  },
  {
    userName: "Michael Chen",
    userAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
    rating: 4,
    date: "May 8, 2026",
    reviewText: "Great concept and execution. The dream within a dream structure was brilliantly done. My only minor criticism is that it can be a bit confusing on first watch, but that's also what makes it worth rewatching. Solid 4 stars!",
    helpful: 89
  },
  {
    userName: "Emma Williams",
    userAvatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop",
    rating: 5,
    date: "May 5, 2026",
    reviewText: "One of the best sci-fi movies ever made. The soundtrack by Hans Zimmer is phenomenal, and the performances by the entire cast are top-notch. The ending still has me thinking about it years later. Perfection!",
    helpful: 156
  },
  {
    userName: "David Martinez",
    userAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop",
    rating: 5,
    date: "May 2, 2026",
    reviewText: "Nolan's finest work. The practical effects combined with CGI create some of the most iconic scenes in cinema history. That hallway fight scene alone deserves an award. Highly recommend watching in IMAX if you get the chance.",
    helpful: 94
  }
];

export default function movieDetail() {
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
          src={movieDetails.backdropUrl}
          alt={movieDetails.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
      </div>

      <main className="container mx-auto px-4 -mt-64 relative z-10">
        <div className="grid md:grid-cols-[300px_1fr] gap-8 mb-12">
          <div className="relative">
            <img
              src={movieDetails.posterUrl}
              alt={movieDetails.title}
              className="w-full rounded-lg shadow-2xl"
            />
            <Button className="w-full mt-4" size="lg">
              <Play className="w-5 h-5 mr-2 fill-current" />
              Watch Now
            </Button>
          </div>

          <div className="space-y-6 pt-8">
            <div>
              <h1 className="mb-2">{movieDetails.title}</h1>
              <div className="flex flex-wrap items-center gap-4 text-muted-foreground mb-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>{movieDetails.year}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>{movieDetails.duration}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-6">
                {movieDetails.genres.map((genre) => (
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
                        fill={movieDetails.rating >= star ? "#eab308" : "none"}
                        stroke={movieDetails.rating >= star ? "#eab308" : "currentColor"}
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