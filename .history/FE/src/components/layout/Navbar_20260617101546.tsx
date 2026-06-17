// src/components/layout/Navbar.tsx
import { Search, LogIn, LogOut, Loader2, Sun, Moon } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";

import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext"; 

// ─── Kiểu Dữ Liệu (Types) ─────────────────────────────────────────────────────

export type MovieCategory =
  | "all"              // Tất cả phim
  | "topRated"         // Được yêu thích nhất
  | "trending"         // Thịnh hành
  | "recommended"      // Gợi ý riêng cho user (AI)
  | "recentlyWatched"; // Phim đã xem gần đây

// ─── Cấu Hình Props (Interfaces) ──────────────────────────────────────────────

// Các tham số nhận vào của thanh điều hướng chính Navbar
interface NavbarProps {
  search?:       string; // Từ khóa tìm kiếm hiện tại từ trang cha (Home)
  setSearch?:    React.Dispatch<React.SetStateAction<string>>; // Hàm cập nhật từ khóa tìm kiếm
  isSearching?: boolean; // Trạng thái đang gọi API tìm kiếm (để hiện icon loading)
}

// Các tham số của ô nhập dữ liệu tìm kiếm (Tách thành component con để tái sử dụng)
interface SearchInputProps {
  search?: string;
  setSearch?: React.Dispatch<React.SetStateAction<string>>;
  isSearching: boolean;
  autoFocus?: boolean; // Tự động đưa con trỏ chuột vào ô nhập (dùng riêng cho mobile)
}

// ─── Component Con: Ô Tìm Kiếm Phim (SearchInput) ──────────────────────────────

function SearchInput({ search, setSearch, isSearching, autoFocus = false }: SearchInputProps) {
  return (
    <div className="relative">
      {/* Nếu đang trong luồng gọi API tìm kiếm, hiển thị icon xoay Loader2 thay vì kính lúp */}
      {isSearching ? (
        <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground animate-spin" />
      ) : (
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
      )}
      <Input
        autoFocus={autoFocus}
        type="search"
        placeholder="Tìm tên phim..."
        className="pl-9 italic"
        value={search || ""}
        onChange={(e) => setSearch?.(e.target.value)} // Kích hoạt hàm cập nhật state ở trang cha
      />
    </div>
  );
}

// ─── Component Chính: Thanh Điều Hướng (Navbar) ────────────────────────────────

export default function Navbar({
  search,
  setSearch,
  isSearching = false,
}: NavbarProps) {
  // Lấy các thông tin định danh và hàm đăng xuất từ Context quản lý Auth
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // State quản lý việc đóng/mở thanh tìm kiếm riêng biệt trên giao diện Mobile
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  // Lấy trạng thái theme (light/dark) và hàm thay đổi từ ThemeContext
  const { theme, setTheme } = useTheme();

  // Xử lý luồng đăng xuất tài khoản
  const handleLogout = async () => {
    try { 
      await logout(); 
    } catch (err) { 
      console.error("Lỗi xảy ra trong quá trình đăng xuất:", err); 
    }
    // Đăng xuất xong điều hướng người dùng quay trở lại trang chủ công khai
    navigate("/home");
  };

  return (
    // Sử dụng lớp nền mờ hiệu ứng kính (backdrop-blur) khi cuộn trang bám đỉnh (sticky)
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">

        {/* ─── Thanh Giao Diện Chính (Top Bar) ─── */}
        <div className="flex items-center justify-between gap-4 py-2">

          {/* Khối 1: Logo ứng dụng "Movies4You" */}
          <Link
            to={"/home"}
            className="flex items-center gap-3 shrink-0"
          >
            <h1 
              className="sm:text-3xl text-[#E50914] uppercase origin-left inline-block"
              style={{ 
                fontFamily: "'Bebas Neue', 'Impact', sans-serif",
                transform: 'scaleX(0.8) scaleY(1.2)', // Kéo giãn chữ theo chiều dọc giống phong cách Netflix
                letterSpacing: '0.05em' 
              }}
            >
              Movies
              {/* Số 4 tự động đổi màu chữ đen/trắng tùy thuộc vào chế độ sáng/tối */}
              <span className="text-black dark:text-white transition-colors duration-200">4</span>
              You
            </h1>
          </Link>

          {/* Khối 2: Ô tìm kiếm trên máy tính (Desktop Search) */}
          {/* Chỉ hiển thị khi trang cha có truyền prop search và setSearch xuống */}
          {search !== undefined && setSearch !== undefined && (
            <div className="hidden md:block flex-1 max-w-sm">
              <SearchInput 
                search={search} 
                setSearch={setSearch} 
                isSearching={isSearching} 
              />
            </div>
          )}

          {/* Khối 3: Cụm chức năng góc bên phải (Mobile Search Toggle, Theme, Auth) */}
          <div className="flex items-center gap-2">

            {/* Nút bấm hiển thị nhanh thanh tìm kiếm khi dùng điện thoại (Mobile) */}
            {search !== undefined && (
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setMobileSearchOpen((v) => !v)}
              >
                {isSearching
                  ? <Loader2 className="w-5 h-5 animate-spin" />
                  : <Search className="w-5 h-5" />
                }
              </Button>
            )}

            {/* Nút chuyển đổi nhanh chế độ sáng / tối (Dark - Light mode) */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="rounded-full w-9 h-9"
              title="Thay đổi giao diện sáng/tối"
            >
              {theme === "dark" ? (
                <Sun className="w-4 h-4 text-yellow-500 transition-all" /> // Chế độ tối: hiện icon Mặt Trời trắng/vàng
              ) : (
                <Moon className="w-4 h-4 text-slate-700 transition-all" />   // Chế độ sáng: hiện icon Mặt Trăng đen
              )}
            </Button>

            {/* Quản lý hiển thị trạng thái Thành Viên (Auth Section) */}
            {isAuthenticated ? (
              // Trường hợp THÀNH VIÊN ĐÃ ĐĂNG NHẬP: Hiện Avatar + Tên + Nút Đăng xuất
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-muted/50">
                  {/* Avatar lấy chữ cái đầu tiên của tên */}
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                    {user?.displayName?.charAt(0).toUpperCase() ||
                      user?.username?.charAt(0).toUpperCase() || "U"}
                  </div>
                  {/* Tên thành viên ẩn đi trên màn hình điện thoại siêu nhỏ */}
                  <div className="hidden sm:flex flex-col leading-none">
                    <span className="text-sm font-medium">
                      {user?.displayName || user?.username}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      @{user?.username}
                    </span>
                  </div>
                </div>

                <Button variant="outline" onClick={handleLogout}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Đăng Xuất
                </Button>
              </div>
            ) : (
              // Trường hợp VÃNG KHÁCH CHƯA ĐĂNG NHẬP: Hiện cụm nút Đăng nhập / Đăng ký
              <div className="flex items-center gap-2">
                <Link to="/login">
                  <Button variant="outline">
                    <LogIn className="w-4 h-4 mr-2" />
                    Đăng Nhập
                  </Button>
                </Link>
                <Link to="/register">
                  <Button>Đăng Ký</Button>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* ─── Ô Tìm Kiếm Đẩy Xuống Riêng Cho Thiết Bị Di Động (Mobile) ─── */}
        {/* Chỉ xuất hiện khi người dùng nhấn kích hoạt nút Kính Lúp ở trên thiết bị di động */}
        {mobileSearchOpen && search !== undefined && setSearch !== undefined && (
          <div className="pb-2 md:hidden">
            <SearchInput 
              search={search} 
              setSearch={setSearch} 
              isSearching={isSearching} 
              autoFocus // Tự động bật bàn phím ảo ngay khi hiện khung nhập
            />
          </div>
        )}

      </div>
    </header>
  );
}