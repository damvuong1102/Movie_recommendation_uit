// src/pages/Login.tsx

import { Film, User, Lock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Separator } from "../components/ui/separator";

import Navbar from "../components/layout/Navbar";
import { login as loginAPI } from "../services/authService";
import { getMovies } from "../services/movieService"; 
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { MovieSummary } from "../types/movie"; 

import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { MovieCard } from "../components/movie/MovieCard";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading,  setLoading]  = useState(false);
  const [validationError, setValidationError] = useState("");

  // Quản lý danh sách phim lấy động từ API
  const [movies, setMovies] = useState<MovieSummary[]>([]);
  const [moviesLoading, setMoviesLoading] = useState(true);

  const navigate  = useNavigate();
  const location  = useLocation();
  const { login, isAuthenticated } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (isAuthenticated) navigate("/home");
  }, [isAuthenticated, navigate]);

  // FETCH PHIM ĐỘNG
  useEffect(() => {
    async function fetchTopMovies() {
      try {
        const res = await getMovies({
          type: "topRated",
          page: 0,
          size: 6, 
        });
        setMovies(res.data.content);
      } catch (err: any) {
        console.error("Không thể tải danh sách phim nổi bật:", err);
      } finally {
        setMoviesLoading(false);
      }
    }
    fetchTopMovies();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError("");

    if (!username || !password) {
      setValidationError("Vui lòng điền đầy đủ tên đăng nhập và mật khẩu");
      return;
    }

    setLoading(true);
    try {
      const res = await loginAPI(username, password);

      if (res.success) {
        const { accessToken, refreshToken, user } = res.data;
        login(user, accessToken, refreshToken);
        const from = (location.state as { from?: string })?.from || "/home";
        navigate(from, { replace: true });
      } else {
        toast.error(res.message || "Đăng nhập thất bại");
      }
    } catch (err: any) {
      toast.error(err.message || "Đăng nhập thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-2 gap-12 items-stretch max-w-7xl mx-auto">

          {/* Khung hiển thị phim nổi bật lấy từ DB */}
          <div className="order-2 lg:order-1">
            <div className="mb-8">
              <h2 className="mb-2 text-2xl font-bold">Phim Đang Được Yêu Thích</h2>
              <p className="text-muted-foreground">Đăng nhập ngay để khám phá kho phim dành riêng cho bạn</p>
            </div>

            {moviesLoading ? (
              <div className="text-center py-12 text-muted-foreground">Đang tải danh sách phim...</div>
            ) : movies.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">Không có phim nào để hiển thị.</div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {movies.map((movie) => (
                  <MovieCard key={movie.id} {...movie} />
                ))}
              </div>
            )}
          </div>

          {/* Khung Form Đăng nhập */}
          <div className="order-1 lg:order-2 lg:sticky lg:top-24">
            <Card className="max-w-md mx-auto">
              <CardHeader>
                <CardTitle className="text-2xl font-bold">Chào Mừng Trở Lại</CardTitle>
                <CardDescription>Đăng nhập lại vào tài khoản của bạn</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">Tên đăng nhập</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="username"
                        type="text"
                        placeholder="Nhập tên đăng nhập của bạn"
                        className="pl-9"
                        autoComplete="username"
                        disabled={loading}
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Mật khẩu</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type="password"
                        placeholder="Nhập mật khẩu của bạn"
                        className="pl-9"
                        autoComplete="current-password"
                        disabled={loading}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                    </div>
                  </div>

                  {validationError && (
                    <p className="text-sm text-red-500 font-medium">{validationError}</p>
                  )}
{/* 
                  <div className="flex items-center justify-end">
                    <Button variant="link" className="px-0 text-sm hover:underline">
                      Quên mật khẩu?
                    </Button>
                  </div> */}

                  <Button type="submit" className="w-full font-semibold" size="lg" disabled={loading}>
                    {loading ? "Đang xử lý..." : "Đăng Nhập"}
                  </Button>

                  <Separator />

                  <div className="text-center text-sm text-muted-foreground">
                    <span>Bạn chưa có tài khoản?</span>
                    <Button
                      type="button"
                      variant="link"
                      className="px-1 h-auto font-semibold text-primary hover:underline"
                      onClick={() => navigate("/register")}
                    >
                      Đăng ký ngay
                    </Button>
                  </div>

                  {/* Lý do chọn nền tảng */}
                  <div className="mt-8 p-6 bg-muted/50 rounded-lg">
                    <div className="flex items-start gap-3">
                      <Film className="w-6 h-6 text-primary shrink-0 mt-1" />
                      <div>
                        <h3 className="mb-2 font-bold text-foreground">Tại sao nên chọn Movies4You?</h3>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                          <li>• Đề xuất danh sách phim phù hợp theo sở thích cá nhân</li>
                          <li>• Đánh giá và bình luận về các bộ phim thịnh hành</li>
                          <li>• Tự động ghi nhớ lịch sử xem phim cá nhân</li>
                          <li>• Cập nhật nhanh chóng xu hướng điện ảnh</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}