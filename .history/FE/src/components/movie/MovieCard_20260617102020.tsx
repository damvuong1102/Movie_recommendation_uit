import { Star, Play } from "lucide-react";
import { Card, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { MovieSummary } from "../../types/movie";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

// Bảng từ điển dịch thể loại phim từ Anh sang Việt
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

// Kiểu dữ liệu nhận vào kế thừa toàn bộ thuộc tính từ cấu trúc MovieSummary
interface MovieCardProps extends MovieSummary {}

/**
 * Hàm lọc và lấy ra thể loại chính đầu tiên của bộ phim
 * Đồng thời tự động chuyển ngữ sang tiếng Việt nếu tìm thấy trong từ điển
 */
function primaryGenre(genres: string | string[]): string {
  let rawGenre = "";
  
  if (Array.isArray(genres)) {
    rawGenre = genres[0] ?? "";
  } else if (genres) {
    // Nếu chuỗi có dạng "Action|Drama|Sci-Fi", tách ra và lấy phần tử đầu tiên
    rawGenre = genres.split("|")[0].trim();
  }
  
  // Trả về bản dịch tiếng Việt, nếu không có thì giữ nguyên chữ tiếng Anh gốc
  return GENRE_TRANSLATIONS[rawGenre] || rawGenre;
}

export function MovieCard({
  tmdbId,
  title,
  avgRating,
  genres,
  posterUrl
}: MovieCardProps) {
  const navigate = useNavigate();
  
  // State quản lý đường dẫn ảnh thực tế sẽ hiển thị (Url gốc, Url TMDB hoặc Ảnh lỗi)
  const [imgSrc, setImgSrc] = useState<string>("");

  /**
   * Hàm tạo ảnh đại diện tạm thời (Placeholder) khi phim không có poster
   * Giúp giao diện không bị vỡ và hiển thị text tên phim ngay trên khung ảnh
   */
  const getPlaceholderUrl = (movieTitle: string) => {
    // Loại bỏ năm phát hành nếu có trong ngoặc đơn, ví dụ: "Faust (1994)" -> "Faust"
    const cleanTitle = movieTitle.split("(")[0].trim();
    return `https://images.placeholders.dev/?width=400&height=600&text=${encodeURIComponent(
      cleanTitle
    )}&bgColor=%231e293b&textColor=%23f8fafc&fontSize=28`;
  };

  // useEffect xử lý luồng lấy ảnh poster linh hoạt
  useEffect(() => {
    // TRƯỜNG HỢP 1: Nếu database đã lưu sẵn link posterUrl hợp lệ
    if (posterUrl && posterUrl.trim() !== "") {
      // Nếu link chỉ là đường dẫn tương đối từ TMDB (bắt đầu bằng dấu /) thì nối thêm domain TMDB vào
      const fullUrl = posterUrl.startsWith("/") 
        ? `https://image.tmdb.org/t/p/w500${posterUrl}` 
        : posterUrl;
      setImgSrc(fullUrl);
      return;
    }

    // TRƯỜNG HỢP 2: Nếu không có posterUrl nhưng có tmdbId, tiến hành gọi API TMDB để lấy ảnh mới nhất
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
          // Nếu API TMDB không có ảnh, dùng ảnh placeholder tạm thời
          setImgSrc(getPlaceholderUrl(title));
        } catch (error) {
          // Xử lý khi lỗi kết nối mạng hoặc lỗi API bên thứ 3
          setImgSrc(getPlaceholderUrl(title));
        }
      };

      fetchPosterFromTmdb();
    } else {
      // TRƯỜNG HỢP 3: Không có cả link ảnh lẫn ID phim -> dùng ảnh placeholder mặc định
      setImgSrc(getPlaceholderUrl(title));
    }
  }, [posterUrl, tmdbId, title]);

  return (
    <Card
      className="overflow-hidden group cursor-pointer hover:shadow-lg transition-shadow"
      // Khi click vào card sẽ điều hướng sang trang chi tiết phim dựa vào ID phim
      onClick={() => navigate(`/movie/${tmdbId}`)}
    >
      {/* Khu vực hiển thị Poster và hiệu ứng nút Play khi rên chuột vào (Hover) */}
      <div className="relative aspect-[2/3] overflow-hidden bg-muted">
        {imgSrc && (
          <img
            src={imgSrc}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            // onError: Kích hoạt khi link ảnh bị chết/lỗi 404, tự động thay bằng ảnh placeholder để cứu giao diện
            onError={(e) => {
              e.currentTarget.src = getPlaceholderUrl(title);
            }}
          />
        )}
        
        {/* Lớp phủ màu đen mờ và nút Play hiện lên mượt mà khi hover chuột */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-colors flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Play className="w-8 h-8 text-white fill-white ml-1" />
            </div>
          </div>
        </div>
      </div>

      {/* Khu vực hiển thị thông tin chữ bên dưới ảnh */}
      <CardContent className="p-4">
        {/* Tên phim (Tự động thêm dấu ... nếu tên phim quá dài dài vượt quá 1 dòng) */}
        <h3 className="line-clamp-1 mb-1 font-semibold">{title}</h3>
        
        <div className="flex items-center justify-between">
          {/* Badge hiển thị thể loại chính (Đã được dịch sang tiếng Việt) */}
          <Badge variant="outline">{primaryGenre(genres)}</Badge>
          
          {/* Điểm số đánh giá trung bình kèm Icon Ngôi sao vàng */}
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
            <span className="text-sm font-medium">
              {avgRating ? avgRating.toFixed(1) : "0.0"}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}