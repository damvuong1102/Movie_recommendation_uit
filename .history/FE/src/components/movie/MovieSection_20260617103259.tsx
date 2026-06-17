// src/components/movie/MovieSection.tsx
import { ChevronRight, Loader2 } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { MovieCard } from "./MovieCard";
import { MovieCardWithRating } from "./MovieCardWithRating";
import { MovieSummary } from "../../types/movie";

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_MOVIES    = 10;
const VISIBLE_COUNT = 5;

// ─── Skeleton card ────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="overflow-hidden rounded-lg border bg-card animate-pulse">
      <div className="aspect-[2/3] bg-muted" />
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

// ─── Props ────────────────────────────────────────────────────────────────────

interface MovieSectionProps {
  title:        string;
  icon:         React.ElementType;
  movies:       MovieSummary[];
  showRating?:  boolean;
  loading?:     boolean;
  hasMore?:     boolean;
  loadingMore?: boolean;
  onLoadMore?:  () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

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
  const displayMovies = movies.slice(0, MAX_MOVIES);

  const [offset, setOffset] = useState(0);

  useEffect(() => {
    setOffset(0);
  }, [movies]);

  const total = displayMovies.length;

  const handlePrev = useCallback(() => {
    setOffset((o) => (o - 1 + total) % total);
  }, [total]);

  const handleNext = useCallback(() => {
    const next = (offset + 1) % total;

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

  const visibleMovies = Array.from({ length: Math.min(VISIBLE_COUNT, total) }, (_, i) => {
    return displayMovies[(offset + i) % total];
  });

  const showControls = !loading && total > 0;

  return (
    <section>
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Icon className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold">{title}</h2>
      </div>

      <div className="flex items-stretch gap-2">

        <div className="grid grid-cols-5 gap-4 flex-1 min-w-0">
          {loading
            ? Array.from({ length: VISIBLE_COUNT }).map((_, i) => (
                <SkeletonCard key={i} />
              ))
            : visibleMovies.length > 0
            ? visibleMovies.map((movie, i) =>
                showRating ? (
                  <MovieCardWithRating key={`${movie.id}-${i}`} {...movie} />
                ) : (
                  <MovieCard key={`${movie.id}-${i}`} {...movie} />
                )
              )
            : (
              <p className="col-span-5 text-sm text-muted-foreground text-center py-12">
                
              </p>
            )}

          {!loading && loadingMore &&
            Array.from({ length: Math.max(0, VISIBLE_COUNT - visibleMovies.length) }).map((_, i) => (
              <SkeletonCard key={`lm-${i}`} />
            ))
          }
        </div>

        {showControls && total > VISIBLE_COUNT && (
          <div className="flex flex-col justify-center gap-2 pl-1 shrink-0">
            <button
              onClick={handleNext}
              disabled={loadingMore}
              aria-label="Next"
              className="p-1.5 rounded-full border transition-colors hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loadingMore
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <ChevronRight className="w-4 h-4" />
              }
            </button>
          </div>
        )}
      </div>

      {/* Dot indicators */}
      {!loading && total > VISIBLE_COUNT && (
        <div className="flex justify-center gap-1 mt-3">
          {Array.from({ length: total }).map((_, i) => {
            const isActive = i === offset;
            return (
              <button
                key={i}
                onClick={() => setOffset(i)}
                aria-label={`Go to film ${i + 1}`}
                className={`rounded-full transition-all ${
                  isActive
                    ? "w-4 h-1.5 bg-primary"
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