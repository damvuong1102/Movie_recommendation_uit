

{/* Khung hiển thị phim nổi bật lấy từ DB */}
<div className="order-2 lg:order-1">
  <div className="mb-8">
    <h2 className="mb-2 text-2xl font-bold">Phim Được Đánh Giá Cao</h2>
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

                  <div className="flex items-center justify-end">
                    <Button variant="link" className="px-0 text-sm hover:underline">
                      Quên mật khẩu?
                    </Button>
                  </div>

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