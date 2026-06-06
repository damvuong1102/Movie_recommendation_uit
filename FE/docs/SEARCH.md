# Thanh tìm kiếm (Search)

Tài liệu tổng hợp các thành phần liên quan đến chức năng tìm kiếm trong dự án.

## Tổng quan
- Trạng thái `search` được quản lý ở `Home.tsx` và được truyền vào `Navbar` để hiển thị input.
- Khi `search` không rỗng, `Home` gọi API `getMovies` để lấy `searchResults` và hiển thị dạng lưới 5 cột.
- `Navbar` cung cấp `SearchInput` dùng `Input` từ `components/ui/input.tsx`.

## File liên quan
- [src/pages/Home.tsx](src/pages/Home.tsx#L1-L400)
- [src/components/layout/Navbar.tsx](src/components/layout/Navbar.tsx#L1-L400)
- [src/hooks/useDebounce.ts](src/hooks/useDebounce.ts#L1-L50)
- [src/services/movieService.ts](src/services/movieService.ts#L1-L200)
- [src/components/ui/input.tsx](src/components/ui/input.tsx#L1-L200)
- [src/lib/api.ts](src/lib/api.ts#L1-L200)

## Đoạn mã chính (tóm tắt)

1) `SearchInput` trong `Navbar.tsx`

```tsx
function SearchInput({ search, setSearch, isSearching, autoFocus = false }: SearchInputProps) {
  return (
    <div className="relative">
      {isSearching ? (
        <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground animate-spin" />
      ) : (
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
      )}
      <Input
        autoFocus={autoFocus}
        type="search"
        placeholder="Search movies..."
        className="pl-9"
        value={search || ""}
        onChange={(e) => setSearch?.(e.target.value)}
      />
    </div>
  );
}
```

2) Quản lý `search` và gọi API trong `Home.tsx` (tóm tắt)

```ts
const [search, setSearch] = useState("");
const isSearching = search.trim() !== "";

useEffect(() => {
  if (isSearching) {
    fetchSection("searchResults", 0, false);
  } else {
    // load các section mặc định
  }
}, [genre, search, isSearching, fetchSection]);

// Khi gọi API:
const res = await getMovies({
  type: undefined,
  page,
  size: 25,
  genre: overrideGenre ?? genre,
  search: overrideSearch ?? search, // truyền search thời gian thực
});
```

3) `getMovies` trong `movieService.ts` — lưu ý mapping tham số

```ts
if (params?.search) query.set("query", params.search);
return apiFetch(`/movies${qs ? `?${qs}` : ""}`);
```

4) `useDebounce` (có sẵn nhưng hiện không phải luồng gọi chính)

```ts
export function useDebounce<T>(value: T, delay = 400): T {
  const [debounced, setDebounced] = useState<T>(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}
```

## Ghi chú & hướng dẫn
- Hiện tại `Home.tsx` gửi `search` thời gian thực lên API (không sử dụng debounce). Nếu muốn giảm số request, sử dụng `useDebounce` trước khi gọi `fetchSection`.
- Backend kỳ vọng tham số tìm kiếm là `query` (xem `movieService.ts`).
- Để tái sử dụng thanh tìm kiếm ở nơi khác: quản lý một state `search` cấp trên, truyền `search` và `setSearch` vào `Navbar`.

## Nơi kiểm tra / chỉnh sửa nhanh
- Giao diện input: [src/components/ui/input.tsx](src/components/ui/input.tsx#L1-L200)
- API core: [src/lib/api.ts](src/lib/api.ts#L1-L200)

---
Tệp này được tạo tự động để dễ tham khảo khi chỉnh sửa hoặc mở rộng tính năng tìm kiếm.
