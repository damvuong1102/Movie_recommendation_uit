import { Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Textarea } from "./ui/textarea";
import { useState } from "react";

export function RatingSubmit() {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [review, setReview] = useState("");

  const handleSubmit = () => {
    console.log("Rating:", rating, "Review:", review);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Leave Your Review</CardTitle>
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
                stroke={(hoverRating || rating) >= star ? "#eab308" : "currentColor"}
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

        <Button onClick={handleSubmit} disabled={rating === 0 || review.trim() === ""}>
          Submit Review
        </Button>
      </CardContent>
    </Card>
  );
}
