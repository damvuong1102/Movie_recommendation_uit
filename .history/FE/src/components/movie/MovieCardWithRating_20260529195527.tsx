// src/components/movie/MovieCardWithRating.tsx
//
// Changes from original:
//  6. Star clicks now call POST /ratings (submitRating) instead of only
//     setting local state. Shows a loading state on the stars while submitting
//     and uses the global toast for success/error feedback.
//     Preserves the existing rating visually so the user sees their last choice.

import { Star, Play, Loader2 } from "lucide-react";
import { Card, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { useState } from "react";
import { MovieSummary } from "../../types/movie";
import { useNavigate } from "react-router-dom";
import { submitRating } from "../../services/ratingService";
import { useToast } from "../../context/ToastContext";

interface MovieCardWithRatingProps extends MovieSummary {}

export function MovieCardWithRating({
  id,
  tmdbId,
  title,
  genres,
  posterUrl,
}: MovieCardWithRatingProps) {
  const navigate       = useNavigate();
  const { toast }      = useToast();

  const [savedRating,  setSavedRating]  = useState(0); // last persisted value
  const [hoverRating,  setHoverRating]  = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRate = async (star: number) => {
    // Optimistic — update UI immediately
    setSavedRating(star);

    setIsSubmitting(true);
    try {
      await submitRating({ movieId: id, rating: star });
      toast.success("Rating saved!");
    } catch (err: any) {
      // Roll back on failure
      setSavedRating((prev) => (prev === star ? 0 : prev));
      toast.error(err.message || "Failed to save rating");
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayRating = hoverRating || savedRating;

  return (
    <Card
      className="overflow-hidden group cursor-pointer hover:shadow-lg transition-shadow"
      onClick={() => navigate(`/movie/${tmdbId}`)}
    >
      <div className="relative aspect-[2/3] overflow-hidden bg-muted">
        <img
          src={posterUrl}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-colors flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Play className="w-8 h-8 text-white fill-white ml-1" />
            </div>
          </div>
        </div>
      </div>

      <CardContent className="p-4">
        <h3 className="line-clamp-1 mb-2">{title}</h3>

        <div className="flex items-center justify-between gap-2">
          <Badge variant="outline" className="truncate max-w-[50%]">
            {genres.split("|")[0]}
          </Badge>

          {/* Star rating — stops card navigation via e.stopPropagation */}
          <div
            className="flex items-center gap-0.5"
            onClick={(e) => e.stopPropagation()}
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            ) : (
              [1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className="w-4 h-4 cursor-pointer transition-colors"
                  fill={displayRating >= star ? "#eab308" : "none"}
                  stroke={displayRating >= star ? "#eab308" : "currentColor"}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => handleRate(star)}
                />
              ))
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
