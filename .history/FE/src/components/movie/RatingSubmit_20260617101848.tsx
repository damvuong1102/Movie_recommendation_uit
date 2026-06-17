// src/components/movie/RatingSubmit.tsx
import { Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { useState } from "react";
import { submitRating } from "../../services/ratingService";

interface RatingSubmitProps {
  movieId: number;
  tmdbId?: number;
  onSuccess?: () => void;
}

export function RatingSubmit({ movieId, tmdbId, onSuccess }: RatingSubmitProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0); 
  const [review, setReview] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (rating === 0) return;
    setLoading(true);
    setError("");
    try {
      await submitRating({ movieId, tmdbId, rating, review });
      setRating(0);
      setReview("");
      onSuccess?.();
    } catch (err: any) {
      setError(err.message || "Failed to submit rating");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle></CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="block mb-2">Your Rating</label>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className="w-8 h-8 cursor-pointer transition-colors"
                fill={(hoverRating || rating) >= star ? "#eab308" : "none"}
                stroke={
                  (hoverRating || rating) >= star ? "#eab308" : "currentColor"
                }
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => setRating(star)}
              />
            ))}
            {rating > 0 && (
              <span className="ml-2 text-sm text-muted-foreground">
                {rating}.0 out of 5
              </span>
            )}
          </div>
        </div>

        <div>
          <label className="block mb-2">Your Review</label>
          <Textarea
            placeholder="Share your thoughts about this movie..."
            rows={5}
            value={review}
            onChange={(e) => setReview(e.target.value)}
          />
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <Button
          onClick={handleSubmit}
          disabled={loading || rating === 0 || review.trim() === ""}
        >
          {loading ? "Submitting..." : "Submit Review"}
        </Button>
      </CardContent>
    </Card>
  );
}
