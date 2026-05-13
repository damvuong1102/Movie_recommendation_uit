import { Star, Play } from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { useState } from "react";
import { Movie } from "../types/movie";
import { useNavigate } from "react-router-dom";

interface MovieCardWithRatingProps extends Movie {}

export function MovieCardWithRating({
  id,
  title,
  year,
  genre,
  imageUrl,
  runtime
}: MovieCardWithRatingProps) {
  const navigate = useNavigate();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);

  return (
      <Card
        className="overflow-hidden group cursor-pointer hover:shadow-lg transition-shadow"
        onClick={() => navigate(`/movie/${id}`)}
      >
      <div className="relative aspect-[2/3] overflow-hidden bg-muted">
        <img
          src={imageUrl}
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
        <h3 className="line-clamp-1 mb-1">{title}</h3>
        <div className="flex items-center gap-3 text-sm text-muted-foreground mb-2">
          <span>{year}</span>
          {runtime && (
            <>
              <span>•</span>
              <span>{runtime}</span>
            </>
          )}
        </div>
        <div className="flex items-center justify-between gap-2">
          <Badge variant="outline">{genre}</Badge>
          <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className="w-4 h-4 cursor-pointer transition-colors"
                fill={(hoverRating || rating) >= star ? "#eab308" : "none"}
                stroke={(hoverRating || rating) >= star ? "#eab308" : "currentColor"}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={(e) => {
                  e.stopPropagation();
                  setRating(star);
                }}
              />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
