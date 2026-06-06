// services/movieService.ts
import { apiFetch } from "../lib/api";

export async function getMovies(params?: {
  page?: number;
  size?: number;
  sort?: string;
  genre?: string;
  search?: string;
  type?: "all" | "topRated" | "trending";
}) {
  const query = new URLSearchParams();
  if (params?.page !== undefined) query.set("page", String(params.page));
  if (params?.size !== undefined) query.set("size", String(params.size));
  if (params?.sort) query.set("sort", params.sort);
  if (params?.genre) query.set("genre", params.genre);
  
  // 🟢 CHỈ SỬA DUY NHẤT DÒNG NÀY: Đổi tên tham số gửi lên thành "query" để khớp với Backend
  if (params?.search) query.set("query", params.search); 
  
  // Giữ nguyên logic cũ của bạn để không làm sập giao diện Home
  if (params?.type) query.set("type", params.type);

  const qs = query.toString();
  return apiFetch(`/movies${qs ? `?${qs}` : ""}`);
}

export async function getMovieById(id: number) {
  return apiFetch(`/movies/tmdb/${id}`); 
}

export async function getMovieRatings(id: number, page = 0, size = 20) {
  return apiFetch(`/movies/${id}/ratings?page=${page}&size=${size}`);
}
// // services/movieService.ts
// import { apiFetch } from "../lib/api";

// export async function getMovies(params?: {
//   page?: number;
//   size?: number;
//   sort?: string;
//   genre?: string;
//   search?: string;
//   type?: "all" | "topRated" | "trending";
// }) {
//   const query = new URLSearchParams();
//   if (params?.page !== undefined) query.set("page", String(params.page));
//   if (params?.size !== undefined) query.set("size", String(params.size));
//   if (params?.sort) query.set("sort", params.sort);
//   if (params?.genre) query.set("genre", params.genre);
//   if (params?.search) query.set("search", params.search);
//   if (params?.type) query.set("type", params.type);

//   const qs = query.toString();
//   return apiFetch(`/movies${qs ? `?${qs}` : ""}`);
// }

// export async function getMovieById(id: number) {
//   return apiFetch(`/movies/${id}`);
// }

// export async function getMovieRatings(id: number, page = 0, size = 20) {
//   return apiFetch(`/movies/${id}/ratings?page=${page}&size=${size}`);
// }

