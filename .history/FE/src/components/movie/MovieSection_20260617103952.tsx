// src/components/movie/MovieSection.tsx
import { ChevronRight, Loader2 } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { MovieCard } from "./MovieCard";
import { MovieCardWithRating } from "./MovieCardWithRating";
import { MovieSummary } from "../../types/movie";

// ─── Constants (Hằng số định hình giao diện) ──────────────────────────────────

const MAX_MOVIES    = 10;
// Số lượng phim hiển thị đồng thời cùng lúc trên một hàng giao diện
const VISIBLE_COUNT = 5;

// ─── Skeleton card (Giao diện giả lập khi đang tải dữ liệu) ─────────────────────

function SkeletonCard() {
  return (
    <div className="overflow-hidden rounded-lg border bg-card animate-pulse">
      {/* Giả lập khung hình ảnh Poster phim tỉ lệ 2:3 */}
      <div className="aspect-[2/3] bg-muted" />
      {/* Giả lập các dòng chữ tiêu đề và thông tin */}
      <div className="p-4 space-y-2">
        <div className="h-4 bg-muted rounded w-3/4" />
        <div className="flex items-center justify-between">
          <div className="h-3 bg-muted rounded w-1/3" />
          <div className="h-3 bg-muted rounded w-1/5" />
        </div>
      </div>
    </div>
  );
}

// ─── Props Interface ──────────────────────────────────────────────────────────

interface MovieSectionProps {
  title:        string;             // Tiêu đề của danh mục (Ví dụ: "Top Thịnh Hành", "Đã Xem Gần Đây")
  icon:         React.ElementType;  // Icon component từ thư viện lucide-react tương ứng với danh mục
  movies:       MovieSummary[];     // Mảng danh sách các bộ phim truyền vào
  showRating?:  boolean;            // Cờ quyết định: true sẽ hiện cấu trúc 5 sao, false/undefined hiện 1 sao vàng
  loading?:     boolean;            // Trạng thái tải dữ liệu lần đầu của danh mục
  hasMore?:     boolean;            // Cờ báo hiệu backend vẫn còn phim để phân trang thêm
  loadingMore?: boolean;            // Trạng thái đang tải thêm phim khi lướt đến cuối slider
  onLoadMore?:  () => void;         // Hàm callback kích hoạt gọi API lấy thêm dữ liệu từ trang Home
}

// ─── Component Chính ──────────────────────────────────────────────────────────

export function MovieSection({
  title,
  icon: Icon,
  movies,
  showRating,
  loading     = false,
  hasMore     = false,
  loadingMore = false,
  onLoadMore,
}: MovieSectionProps) {
  
  // Chỉ lấy tối đa 10 bộ phim đầu tiên từ danh sách để phục vụ cơ chế xoay vòng dữ liệu tại local
  const displayMovies = movies.slice(0, MAX_MOVIES);

  // Offset quản lý vị trí bắt đầu (index phim đầu hàng) để cắt mảng phim hiển thị cuốn chiếu
  const [offset, setOffset] = useState(0);

  // Đảm bảo mỗi khi danh sách phim thay đổi (hoặc đổi bộ lọc), slider tự động reset về vị trí đầu tiên
  useEffect(() => {
    setOffset(0);
  }, [movies]);

  const total = displayMovies.length;

  // Xử lý chuyển dịch vòng lặp lùi lại phía sau (Hàm này hiện tại có thể mở rộng dùng cho nút Prev nếu cần)
  const handlePrev = useCallback(() => {
    setOffset((o) => (o - 1 + total) % total);
  }, [total]);

  // Xử lý tịnh tiến slider sang phải (Xoay vòng tịnh tiến danh sách phim)
  const handleNext = useCallback(() => {
    const next = (offset + 1) % total;

    // Giao thoa phân trang tự động (Lazy load):
    // Nếu còn phim ở server (hasMore) và người dùng bấm gần hết danh sách local hiện có (vị trí hiện tại >= tổng số - 2)
    // Hệ thống sẽ chủ động gọi hàm onLoadMore() để kéo thêm dữ liệu mới về gộp vào mảng movies
    if (
      hasMore &&
      onLoadMore &&
      !loadingMore &&
      total < MAX_MOVIES &&
      offset >= total - 2
    ) {
      onLoadMore();
    }

    setOffset(next);
  }, [offset, total, hasMore, onLoadMore, loadingMore]);

  // Thuật toán lấy ra đúng 5 bộ phim liên tiếp dựa trên `offset` hiện tại.
  // Sử dụng phép chia lấy dư `% total` để khi duyệt đến cuối mảng, các bộ phim đầu mảng tự động nối đuôi lặp lại.
  const visibleMovies = Array.from({ length: Math.min(VISIBLE_COUNT, total) }, (_, i) => {
    return displayMovies[(offset + i) % total];
  });

  // Điều kiện để hiển thị nút mũi tên điều hướng (Không chạy loading và số lượng phim nhiều hơn số vị trí hiển thị)
  const showControls = !loading && total > 0;

  return (
    <section>
      {/* Khu vực Tiêu đề danh mục kèm Biểu tượng đặc trưng */}
      <div className="flex items-center gap-2 mb-4">
        <Icon className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold">{title}</h2>
      </div>

      <div className="flex items-stretch gap-2">

        {/* Khung Grid chính chia đều 5 cột tương ứng với VISIBLE_COUNT */}
        <div className="grid grid-cols-5 gap-4 flex-1 min-w-0">
          {loading
            ? // Trường hợp 1: Đang tải dữ liệu gốc -> Render ra 5 khung xương biến đổi (Skeleton)
              Array.from({ length: VISIBLE_COUNT }).map((_, i) => (
                <SkeletonCard key={i} />
              ))
            : visibleMovies.length > 0
            ? // Trường hợp 2: Có phim -> Duyệt mảng và rẽ nhánh dựa vào thuộc tính `showRating` được truyền từ trang Home
              visibleMovies.map((movie, i) =>
                showRating ? (
                  // Dùng cấu trúc 5 ngôi sao tương tác chấm điểm cá nhân (Ứng dụng cho Đã Xem Gần Đây)
                  <MovieCardWithRating key={`${movie.id}-${i}`} {...movie} />
                ) : (
                  // Dùng cấu trúc chuẩn 1 sao vàng hiển thị điểm trung bình gốc (Ứng dụng cho Dành Cho Bạn, Trending...)
                  <MovieCard key={`${movie.id}-${i}`} {...movie} />
                )
              )
            : // Trường hợp 3: Mảng phim trống rỗng -> Hiển thị dòng thông báo lỗi/không tìm thấy kết quả
              (
                <p className="col-span-5 text-sm text-muted-foreground text-center py-12">
                  Không có phim nào để hiển thị. Thử thay đổi bộ lọc hoặc tìm kiếm khác.
                </p>
              )}

          {/* Nếu đang chạy tiến trình tải thêm phim phân trang (loadingMore), bổ sung các ô Skeleton vào vị trí trống */}
          {!loading && loadingMore &&
            Array.from({ length: Math.max(0, VISIBLE_COUNT - visibleMovies.length) }).map((_, i) => (
              <SkeletonCard key={`lm-${i}`} />
            ))
          }
        </div>

        {/* Khối hiển thị Nút bấm điều hướng mũi tên lướt phim sang phải (Next Slider) */}
        {showControls && total > VISIBLE_COUNT && (
          <div className="flex flex-col justify-center gap-2 pl-1 shrink-0">
            <button
              onClick={handleNext}
              disabled={loadingMore}
              aria-label="Next"
              className="p-1.5 rounded-full border transition-colors hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loadingMore
                ? <Loader2 className="w-4 h-4 animate-spin" /> // Hiện biểu tượng xoay vòng khi đang fetch data
                : <ChevronRight className="w-4 h-4" />
              }
            </button>
          </div>
        )}
      </div>

      {/* Thanh chấm tròn (Dot indicators) định vị bên dưới danh mục để người dùng biết tổng số lượng phim */}
      {!loading && total > VISIBLE_COUNT && (
        <div className="flex justify-center gap-1 mt-3">
          {Array.from({ length: total }).map((_, i) => {
            const isActive = i === offset;
            return (
              <button
                key={i}
                onClick={() => setOffset(i)} // Cho phép click trực tiếp vào chấm tròn để nhảy nhanh đến vị trí phim mong muốn
                aria-label={`Go to film ${i + 1}`}
                className={`rounded-full transition-all ${
                  isActive
                    ? "w-4 h-1.5 bg-primary" // Chấm tròn dài ra và đổi màu đậm đại diện cho vị trí hiện tại
                    : "w-1.5 h-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/60"
                }`}
              />
            );
          })}
        </div>
      )}
    </section>
  );
}