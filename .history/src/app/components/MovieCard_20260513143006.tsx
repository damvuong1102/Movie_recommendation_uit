import { Star, Play } from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";

import { Movie } from "../types/movie";

interface MovieCardProps extends Movie {}

export function MovieCard({
  title,
  year,
  rating,
  genre,
  imageUrl,
  runtime
}: MovieCardProps) {
  return (
    <Card className="overflow-hidden group cursor-pointer hover:shadow-lg transition-shadow">
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
        <div className="flex items-center justify-between">
          <Badge variant="outline">{genre}</Badge>
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
            <span className="text-sm">{rating.toFixed(1)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
