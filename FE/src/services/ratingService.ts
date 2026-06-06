// services/ratingService.ts 
import { apiFetch } from "../lib/api";
import { RatingRequest } from "../types/rating";

export async function submitRating(data: RatingRequest) {
  return apiFetch("/ratings", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateRating(id: number, data: { rating: number; review?: string }) {
  return apiFetch(`/ratings/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteRating(id: number) {
  return apiFetch(`/ratings/${id}`, { method: "DELETE" });
}