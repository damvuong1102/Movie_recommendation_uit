// src/components/movie/MovieCard.tsx

import { Star, Play } from "lucide-react";
import { Card, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { MovieSummary } from "../../types/movie";
import { useNavigate } from "react-router-dom";

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

  // 1. Xử lý đường dẫn ảnh chuẩn hóa
  const getPosterUrl = (url: string | undefined) => {
    if (!url) return "https://placehold.co/400x600?text=No+Poster";
    
    // Nếu API chỉ trả về phần đuôi của TMDB (ví dụ: /abcde.jpg)
    if (url.startsWith("/")) {
      return `https://image.tmdb.org/t/p/w500${url}`;
    }
    
    // Nếu API trả về link đầy đủ (http...) thì giữ nguyên
    return url;
  };

  return (
    <Card
      className="overflow-hidden group cursor-pointer hover:shadow-lg transition-shadow"
      onClick={() => navigate(`/movie/${tmdbId}`)}
    >
      <div className="relative aspect-[2/3] overflow-hidden bg-muted">
        <img
          src={getPosterUrl(posterUrl)} // Sử dụng hàm convert link ở đây
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            // 2. Dự phòng nếu link ảnh chết (Lỗi 404 từ server ảnh)
            e.currentTarget.src = "https://placehold.co/400x600?text=No+Poster";
          }}
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