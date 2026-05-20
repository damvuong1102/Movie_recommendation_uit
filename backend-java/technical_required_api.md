

## TÀI LIỆU DIỄN GIẢI YÊU CẦU PHÁT TRIỂN HỆ
## THỐNG
Dự án: Hệ thống xem phim trực tuyến CineStream • Tài liệu: Quy chuẩn API & Tích hợp Frontend-Backend
2.1 Thanh Bộ Lọc Trên Thanh Điều Hướng (Navbar Filter Bar)
Giao diện hiện tại đã cập nhật và hiển thị một thanh bộ lọc (Filter Bar) nằm trong Thanh điều hướng (Navbar)
tại trang Chủ (Home page). Thanh bộ lọc này bao gồm hai thành phần điều khiển chính:
Các tab Danh mục (Category tabs): Bao gồm các lựa chọn mặc định: Tất cả (All) • Đánh giá cao nhất
(Top Rated) • Xu hướng (Trending) • Dành cho bạn (For You) • Xem gần đây (Recently Watched).
Danh sách thả xuống Thể loại (Genre dropdown): Hiện tại danh sách này đang được gán cứng dữ liệu
tĩnh (hardcoded) ở phía Frontend. Cần chuyển đổi sang dạng dữ liệu động theo yêu cầu tích hợp API bên
dưới.
## ℹ️ YÊU CẦU TRIỂN KHAI ENDPOINT MỚI (FRONTEND & BACKEND)
API:GET /genres
Mục đích: Trả về toàn bộ danh sách các thể loại phim hiện có trong kho dữ liệu (movie catalog). Việc
này giúp Frontend có thể đổ dữ liệu vào danh sách thả xuống một cách linh hoạt (dynamic) thay vì sử
dụng một mảng dữ liệu tĩnh như hiện tại.
Cấu trúc phản hồi gợi ý (Response Shape):
## •
## •
## {
"success": true,
## "data": [
"Action",
"Adventure",
"Animation",
"Comedy",
"Drama",
"Sci-Fi"
## ]
## }
CineStream - Tài liệu Yêu cầu Phát triển Tính năng
## 1

2.2 Danh mục: "Dành Cho Bạn" (Category: “For You” - Khuyến Nghị)
Khi người dùng chủ động chọn tab  "Dành cho bạn" (For You), phía Frontend sẽ truyền tham số
type=recommended vào API GET /movies.
Hiện tại, cơ chế này mới chỉ là một trình giữ chỗ tạm thời (placeholder) ở phía Client (Frontend đang tự động
gửi thay thế bằng tham số sort=popularity,desc). Để tính năng này hoạt động đúng chuẩn và chính xác,
phía Backend bắt buộc phải triển khai thuật toán gợi ý cá nhân hóa.
## ⚠️ YÊU CẦU XỬ LÝ PHÍA BACKEND (BACKEND WORK REQUIRED)
Nhiệm vụ: Bổ sung thêm tham số truy vấn type=recommended vào API GET /movies.
Logic xử lý: Khi nhận được cấu hình type=recommended, hệ thống cần trả về danh sách các bộ phim
được cá nhân hóa riêng cho từng người dùng đã thực hiện xác thực thành công (ví dụ: dựa trên lịch sử
đánh giá phim, hoặc các thể loại phim yêu thích của họ).
Cơ chế dự phòng (Fallback): Trong trường hợp tài khoản người dùng mới tạo và chưa có bất kỳ dữ liệu
lịch sử hoạt động nào, hệ thống sẽ tự động trả về danh sách phim được đánh giá cao nhất (tương đương
với cơ chế của tab Top Rated).
Lưu ý về cấu trúc: Cấu trúc dữ liệu phản hồi (Response shape) của trường hợp này phải giống hệt với
cấu trúc khi gọi type=topRated. Điều này đảm bảo khi Backend hoàn thiện, Frontend có thể tích hợp
ngay lập tức mà không cần chỉnh sửa lại code giao diện.
2.3 Mục Phim Đã Xem Gần Đây (Recently Watched Section)
Hiện tại, mục "Xem gần đây" (Recently Watched) hiển thị tại trang Chủ đang hoạt động hoàn toàn 100% ở
phía Client-side bằng cách lưu trữ dữ liệu vào localStorage. Mỗi khi người dùng truy cập vào trang chi tiết
của một bộ phim bất kỳ, Frontend sẽ tự lưu thông tin tóm tắt của bộ phim đó vào bộ nhớ trình duyệt dưới khóa
(key): cinestream:recently_watched.
Hạn chế hiện tại: Do lưu ở trình duyệt, lịch sử xem phim này chỉ khả dụng trên chính thiết bị và trình duyệt cụ
thể đó mà thôi, hoàn toàn không thể đồng bộ hóa dữ liệu khi người dùng chuyển sang thiết bị hoặc trình duyệt
khác.
CineStream - Tài liệu Yêu cầu Phát triển Tính năng
## 2

## ℹ️ ĐỀ XUẤT ENDPOINT MỚI TÙY CHỌN (CẢI TIẾN TRONG TƯƠNG LAI)
API khuyến nghị bổ sung:GET /users/me/history
Mục đích: Trả về danh sách gồm N bộ phim gần nhất mà người dùng đã xác thực từng truy cập xem,
sắp xếp theo thứ tự thời gian xem giảm dần (mới nhất lên đầu).
Ngay khi Endpoint này được Backend hỗ trợ chính thức, Frontend sẽ lập tức chuyển đổi sang gọi API
này và loại bỏ hoàn toàn cơ chế lưu tạm ở localStorage.
Cấu trúc phản hồi gợi ý (Tương tự GET /users/me/ratings nhưng bổ sung trường viewedAt):
2.4 Bộ Lọc Thể Loại Trên API GET /movies (Genre Filter on GET /movies)
Phía Frontend hiện đã sẵn sàng việc truyền tham số genre=Action (hoặc các thể loại tương ứng) dưới
dạng tham số truy vấn (query parameter) đến API GET /movies. Cơ chế này vốn đã được định nghĩa sẵn
trong hợp đồng ràng buộc API (API contract). Phía Backend vui lòng kiểm tra và xác nhận lại các quy chuẩn
vận hành sau:
Quy tắc so khớp chuỗi (Genre matching): Hệ thống cần đảm bảo việc tìm kiếm thể loại không phân biệt
chữ hoa chữ thường (case-insensitive), HOẶC Backend phải trả về các chuỗi ký tự thể loại ở endpoint /
genres theo đúng định dạng viết hoa/thường chuẩn xác để khi Frontend gửi lên bộ lọc luôn đảm bảo
khớp hoàn toàn.
## {
"success": true,
## "data": {
## "content": [
## {
## "id": 1,
"title": "Fight Club",
"posterUrl": "...",
"genres": "Drama|Thriller",
"releaseYear": 1999,
"avgRating": 4.5,
"ratingCount": 8928,
"viewedAt": "2024-01-15T10:30:00"
## }
## ],
## "page": 0,
## "size": 10,
"totalElements": 42
## }
## }
## •
CineStream - Tài liệu Yêu cầu Phát triển Tính năng
## 3

Logic bộ lọc (Filtering logic): Tham số genre truyền lên phải thực hiện lọc và trả về các bộ phim mà
trong trường dữ liệu genres của phim đó có chứa chuỗi thể loại cần tìm (Ví dụ: Một bộ phim có trường
dữ liệu thể loại dạng chuỗi phân tách genres="Drama|Thriller" thì bắt buộc phải khớp và hiển thị khi
người dùng lọc theo genre=Drama).
## •
CineStream - Tài liệu Yêu cầu Phát triển Tính năng
## 4