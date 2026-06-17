import { Star, Play } from "lucide-react";
import { Card, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { MovieSummary } from "../../types/movie";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

interface MovieCardProps extends MovieSummary {}

function primaryGenre(genres: string | string[]): string {
  if (Array.isArray(genres)) return genres[0] ?? "";
  return genres.split("|")[0].trim();
}

export function MovieCard({
  tmdbId,
  title,
  avgRating,
  genres,
  posterUrl
}: MovieCardProps) {
  const navigate = useNavigate();
  const [imgSrc, setImgSrc] = useState<string>("");

  const getPlaceholderUrl = (movieTitle: string) => {
    const cleanTitle = movieTitle.split("(")[0].trim();
    return `https://images.placeholders.dev/?width=400&height=600&text=${encodeURIComponent(
      cleanTitle
    )}&bgColor=%231e293b&textColor=%23f8fafc&fontSize=28`;
  };

  useEffect(() => {
    if (posterUrl && posterUrl.trim() !== "") {
      const fullUrl = posterUrl.startsWith("/") 
        ? `https://image.tmdb.org/t/p/w500${posterUrl}` 
        : posterUrl;
      setImgSrc(fullUrl);
      return;
    }

    if (tmdbId) {
      const fetchPosterFromTmdb = async () => {
        try {
          const response = await fetch(
            `https://api.themoviedb.org/3/movie/${tmdbId}?api_key=844dba0bfd8f3a4f3799f6130ef9e335`
          );
          
          if (response.ok) {
            const data = await response.json();
            if (data.poster_path) {
              setImgSrc(`https://image.tmdb.org/t/p/w500${data.poster_path}`);
              return;
            }
          }
          setImgSrc(getPlaceholderUrl(title));
        } catch (error) {
          setImgSrc(getPlaceholderUrl(title));
        }
      };

      fetchPosterFromTmdb();
    } else {
      setImgSrc(getPlaceholderUrl(title));
    }
  }, [posterUrl, tmdbId, title]);

  return (
    <Card
      className="overflow-hidden group cursor-pointer hover:shadow-lg transition-shadow"
      onClick={() => navigate(`/movie/${tmdbId}`)}
    >
      <div className="relative aspect-[2/3] overflow-hidden bg-muted">
        {imgSrc && (
          <img
            src={imgSrc}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              e.currentTarget.src = getPlaceholderUrl(title);
            }}
          />
        )}
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
        <div className="flex items-center justify-between">
          <Badge variant="outline">{primaryGenre(genres)}</Badge>
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
            <span className="text-sm">{avgRating?.toFixed(1)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}