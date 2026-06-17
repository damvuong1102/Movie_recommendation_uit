import { useState, useEffect, useCallback } from "react";
import { LogIn, Star, Clock, Calendar, Play } from "lucide-react";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { ReviewCard } from "../components/review/ReviewCard";
import { RatingSubmit } from "../components/movie/RatingSubmit";
import { Separator } from "../components/ui/separator";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/layout/Navbar";
import { getMovieById, getMovieRatings } from "../services/movieService";
import { MovieDetail as MovieDetailType } from "../types/movie";
import { RatingResponse } from "../types/rating";
import { recordWatch } from "./Home";

export default function MovieDetail() {
  const { id } = useParams(); 
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  const [movie, setMovie] = useState<MovieDetailType | null>(null);
  const [ratings, setRatings] = useState<RatingResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [ratingsLoading, setRatingsLoading] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        // Bước 1: Lấy chi tiết phim bằng ID từ URL trước
        const movieRes = await getMovieById(Number(id));
        const movieData: MovieDetailType = movieRes.data;
        setMovie(movieData);

        // Lưu vào danh sách phim đã xem gần đây
        recordWatch({
          id:          movieData.id,
          tmdbId:      movieData.tmdbId,
          title:       movieData.title,
          posterUrl:   movieData.posterUrl,
          genres:      movieData.genres,
          releaseYear: movieData.releaseYear ?? Number(movieData.releaseDate?.slice(0, 4)),
          avgRating:   movieData.avgRating,
          ratingCount: movieData.ratingCount,
        });

        try {
          const ratingsRes = await getMovieRatings(movieData.id);
          if (ratingsRes?.data) {
            setRatings(ratingsRes.data.content);
          }
        } catch (ratingErr) {
          console.warn("Lỗi API Ratings:", ratingErr);
          setRatings([]);
        }
      } catch (err: any) {
        if (err.message === "Movie not found" || err.response?.status === 404) {
          setNotFound(true);
        } else {
          console.error("Lỗi lấy chi tiết phim:", err);
        }
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  // Sau khi submit review: re-fetch cả ratings lẫn movie (để cập nhật avgRating + ratingCount)
  const refreshAfterReview = useCallback(async () => {
    if (!movie) return;
    setRatingsLoading(true);
    try {
      // Movie detail endpoint uses tmdbId; ratings endpoint uses the database movie id.
      const [movieRes, ratingsRes] = await Promise.all([
        getMovieById(movie.tmdbId ?? Number(id)),
        getMovieRatings(movie.id),
      ]);

      // Cập nhật điểm số trung bình (avgRating) và lượt đánh giá mới trên UI công khai
      setMovie(movieRes.data);

      // Hiển thị review mới vừa viết lên đầu danh sách
      const fresh: RatingResponse[] = ratingsRes?.data?.content ?? [];
      setRatings(fresh);
    } catch (err) {
      console.error("Lỗi refresh sau review:", err);
    } finally {
      setRatingsLoading(false);
    }
  }, [movie]);

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground animate-pulse">
        Đang tải chi tiết phim...
      </div>
    );

  if (notFound || !movie)
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <h1 className="text-xl font-semibold">Phim không tồn tại</h1>
      </div>
    );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Backdrop */}
      <div className="relative h-96 overflow-hidden">
        <img
          src={movie.backdropUrl || movie.posterUrl}
          alt={movie.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
      </div>

      <main className="container mx-auto px-4 -mt-64 relative z-10">
        <div className="grid md:grid-cols-[300px_1fr] gap-8 mb-12">

          {/* Poster */}
          <div className="relative">
            <img
              src={movie.posterUrl}
              alt={movie.title}
              className="w-full rounded-lg shadow-2xl border border-border/50"
            />
            <Button className="w-full mt-4" size="lg">
              <Play className="w-5 h-5 mr-2 fill-current" />
              Watch Now
            </Button>
          </div>

          {/* Info */}
          <div className="space-y-6 pt-8">
            <div>
              <h1 className="text-3xl font-bold mb-2 text-foreground">{movie.title}</h1>

              <div className="flex flex-wrap items-center gap-4 text-muted-foreground mb-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>{movie.releaseDate?.slice(0, 4) ?? movie.releaseYear}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>{movie.runtimeMinutes} min</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-6">
                {movie.genres && movie.genres.split("|").map((g) => (
                  <Badge key={g} variant="secondary">{g}</Badge>
                ))}
              </div>

              {/* Hiển thị điểm số xếp hạng */}
              <div className="flex items-center gap-4 mb-6">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className="w-6 h-6"
                        fill={movie.avgRating >= star ? "#eab308" : "none"}
                        stroke={movie.avgRating >= star ? "#eab308" : "currentColor"}
                      />
                    ))}
                  </div>
                  <span className="text-xl font-semibold">
                    {movie.avgRating ? movie.avgRating.toFixed(1) : "0.0"}
                  </span>
                </div>
                <Separator orientation="vertical" className="h-6" />
                <span className="text-sm text-muted-foreground">
                  {movie.ratingCount ? movie.ratingCount.toLocaleString() : 0} ratings
                </span>
              </div>

              <p className="text-muted-foreground leading-relaxed mb-6">{movie.overview}</p>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="grid lg:grid-cols-2 gap-8 pb-12">
          <div>
            <div className="flex items-center gap-2 mb-6">
              <h2 className="text-xl font-bold">Reviews ({ratings.length})</h2>
              {ratingsLoading && (
                <span className="text-sm text-muted-foreground animate-pulse">
                  Updating...
                </span>
              )}
            </div>
            <div className="space-y-4">
              {ratings.length === 0 && !ratingsLoading && (
                <p className="text-sm text-muted-foreground italic">
                  No reviews yet. Be the first to share your thoughts!
                </p>
              )}
              {ratings.map((r) => (
                <ReviewCard
                  key={r.id}
                  username={r.username}
                  rating={r.rating}
                  review={r.review}
                  createdAt={r.createdAt}
                />
              ))}
            </div>
          </div>

          {/* Form gửi đánh giá */}
          <div>
            {isAuthenticated ? (
              <RatingSubmit
                movieId={movie.id}
                tmdbId={movie.tmdbId}
                onSuccess={refreshAfterReview}
              />
            ) : (
              <div className="border rounded-lg p-6 bg-muted/30">
                <h3 className="text-lg font-medium mb-2">Want to share your thoughts?</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Log in to leave your review and rating for this movie.
                </p>
                <Button
                  onClick={() =>
                    navigate("/login", { state: { from: location.pathname } })
                  }
                >
                  <LogIn className="w-4 h-4 mr-2" />
                  Log In
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
