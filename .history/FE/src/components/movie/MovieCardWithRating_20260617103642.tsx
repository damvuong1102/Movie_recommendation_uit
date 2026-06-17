// src/components/movie/MovieCardWithRating.tsx
import { Star, Play, Loader2 } from "lucide-react";
import { Card, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { useState } from "react";
import { MovieSummary } from "../../types/movie";
import { useNavigate } from "react-router-dom";
import { submitRating } from "../../services/ratingService";
import { useToast } from "../../context/ToastContext";

const GENRE_TRANSLATIONS: Record<string, string> = {
  "Action": "Hành động",
  "Comedy": "Hài hước",
  "Drama": "Chính kịch",
  "Sci-Fi": "Viễn tưởng",
  "Horror": "Kinh dị",
  "Romance": "Lãng mạn",
  "Thriller": "Giật gân",
  "Animation": "Hoạt hình",
  "Fantasy": "Kỳ ảo",
  "Adventure": "Phiêu lưu",
  "Crime": "Hình sự",
  "Documentary": "Phim tài liệu",
  "Mystery": "Bí ẩn",
  "Family": "Gia đình",
  "History": "Lịch sử",
  "War": "Chiến tranh"
};

interface MovieCardWithRatingProps extends MovieSummary {}

export function MovieCardWithRating({
  id,
  tmdbId,
  title,
  genres,
  posterUrl,
}: MovieCardWithRatingProps) {
  const navigate = useNavigate();
  const { toast } = useToast();

  // Luồng quản lý điểm đánh giá (Rating) cá nhân của người dùng
  const [savedRating, setSavedRating] = useState(0); // Điểm số thực tế đã lưu thành công trong database
  const [hoverRating, setHoverRating] = useState(0); // Điểm số tạm thời khi người dùng rê chuột lên các ngôi sao
  const [isSubmitting, setIsSubmitting] = useState(false); // Trạng thái đang đợi API phản hồi

  // Xử lý sự kiện khi người dùng click chọn số sao để đánh giá nhanh phim
  const handleRate = async (star: number) => {
    // Luồng Optimistic UI: Cập nhật ngay giao diện sang số sao mới để người dùng thấy mượt mà, không cần đợi API
    setSavedRating(star);
    setIsSubmitting(true);

    try {
      // Gọi API gửi điểm số lên máy chủ backend
      await submitRating({ movieId: id, rating: star });
      toast.success("Đã lưu đánh giá của bạn!");
    } catch (err: any) {
      // Trường hợp API lỗi: Rollback (hoàn tác) lại điểm số cũ để đảm bảo tính chính xác của dữ liệu UI
      setSavedRating((prev) => (prev === star ? 0 : prev));
      toast.error(err.message || "Không thể lưu đánh giá. Vui lòng thử lại!");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Ưu tiên hiển thị số sao đang hover chuột, nếu không hover thì hiển thị điểm số thực tế đã lưu
  const displayRating = hoverRating || savedRating;

  // Lọc lấy thể loại đầu tiên và dịch sang tiếng Việt
  const rawGenre = genres ? genres.split("|")[0].trim() : "";
  const translatedGenre = GENRE_TRANSLATIONS[rawGenre] || rawGenre;

  return (
    <Card
      className="overflow-hidden group cursor-pointer hover:shadow-lg transition-shadow"
      // Click vào vùng card nói chung sẽ chuyển hướng sang trang chi tiết phim
      onClick={() => navigate(`/movie/${tmdbId}`)}
    >
      {/* Khung hiển thị hình ảnh poster bộ phim */}
      <div className="relative aspect-[2/3] overflow-hidden bg-muted">
        <img
          src={posterUrl}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {/* Hiệu ứng lớp phủ màu tối và nút Play hiện lên khi rê chuột vào card */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-colors flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Play className="w-8 h-8 text-white fill-white ml-1" />
            </div>
          </div>
        </div>
      </div>

      {/* Khung chứa nội dung thông tin chữ bên dưới ảnh */}
      <CardContent className="p-4">
        <h3 className="line-clamp-1 mb-2 font-semibold">{title}</h3>

        <div className="flex items-center justify-between gap-2">
          {/* Huy hiệu hiển thị thể loại đã được dịch sang tiếng Việt */}
          <Badge variant="outline" className="truncate max-w-[50%]">
            {translatedGenre || "Khác"}
          </Badge>

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
                  // Tô màu vàng nếu vị trí sao nhỏ hơn hoặc bằng điểm số đang hiển thị
                  fill={displayRating >= star ? "#eab308" : "none"}
                  stroke={displayRating >= star ? "#eab308" : "currentColor"}
                  onMouseEnter={() => setHoverRating(star)} // Di chuột vào: Sáng tạm thời đến vị trí sao đó
                  onMouseLeave={() => setHoverRating(0)}    // Rời chuột đi: Trả về trạng thái màu nguyên bản
                  onClick={() => handleRate(star)}          // Click chuột: Xác nhận chọn chấm điểm số sao này
                />
              ))
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}