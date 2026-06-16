// src/pages/Home.tsx

import { Film, TrendingUp, Clock, ThumbsUp, Star, ChevronDown, Search } from "lucide-react";
import Navbar, { MovieCategory } from "../components/layout/Navbar";
import { getMovies } from "../services/movieService";
import { MovieSection } from "../components/movie/MovieSection";
import { MovieCard } from "../components/movie/MovieCard";
import { MovieSummary } from "../types/movie";
import { useState, useEffect, useCallback, useRef } from "react";
import { useDebounce } from "../hooks/useDebounce";
import { useToast } from "../context/ToastContext";
import { Badge } from "../components/ui/badge";
import { useAuth } from "../context/AuthContext";

const GENRES = [
  "Action", "Comedy", "Drama", "Sci-Fi", "Horror",
  "Romance", "Thriller", "Animation", "Fantasy"
];

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
};

const CATEGORIES: { value: MovieCategory; label: string }[] = [
  { value: "all",             label: "Tất cả" },
  { value: "topRated",        label: "Được Yêu Thích" },
  { value: "trending",        label: "Top Thịnh Hành" },
  { value: "recommended",     label: "Dành Cho Bạn" },
  { value: "recentlyWatched", label: "Đã Xem Gần Đây" },
];

const WATCH_KEY = "cinestream:recently_watched";
const MAX_RECENT = 15;

export function recordWatch(movie: MovieSummary) {
  try {
    const raw = localStorage.getItem(WATCH_KEY);
    const list: MovieSummary[] = raw ? JSON.parse(raw) : [];
    const filtered = list.filter((m) => m.id !== movie.id);
    localStorage.setItem(
      WATCH_KEY,
      JSON.stringify([movie, ...filtered].slice(0, MAX_RECENT))
    );
  } catch { /* localStorage unavailable */ }
}

function getRecentlyWatched(): MovieSummary[] {
  try {
    const raw = localStorage.getItem(WATCH_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

interface SectionState {
  movies:      MovieSummary[];
  page:        number;
  totalPages:  number;
  loading:     boolean;
  loadingMore: boolean;
}

const emptySectionState = (): SectionState => ({
  movies:      [],
  page:        0,
  totalPages:  1,
  loading:     true,
  loadingMore: false,
});

type SectionKey = "topRated" | "trending" | "recommended" | "searchResults";

export default function Home() {
  const { toast }           = useToast();
  const { isAuthenticated } = useAuth();

  const [search, setSearch]     = useState("");
  const [genre, setGenre]       = useState("");
  const [category, setCategory] = useState<MovieCategory>("all");

  // FIX: dùng debounce để tránh race condition — chỉ gọi API sau 400ms dừng gõ
  const debouncedSearch = useDebounce(search, 400);

  const [genreOpen, setGenreOpen] = useState(false);
  const genreRef = useRef<HTMLDivElement>(null);

  const [sections, setSections] = useState<Record<SectionKey, SectionState>>({
    topRated:      emptySectionState(),
    trending:      emptySectionState(),
    recommended:   emptySectionState(),
    searchResults: emptySectionState(),
  });

  const [recentlyWatched, setRecentlyWatched] = useState<MovieSummary[]>([]);

  const sectionsRef = useRef(sections);
  sectionsRef.current = sections;

  // FIX: lưu genre và debouncedSearch vào ref để fetchSection luôn đọc được
  // giá trị mới nhất mà không bị stale closure
  const genreRef2        = useRef(genre);
  const debouncedSearchRef = useRef(debouncedSearch);
  genreRef2.current        = genre;
  debouncedSearchRef.current = debouncedSearch;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (genreRef.current && !genreRef.current.contains(event.target as Node)) {
        setGenreOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setRecentlyWatched(getRecentlyWatched());
  }, []);

  const fetchSection = useRef(
    async (
      key: SectionKey,
      page: number,
      append: boolean,
      overrideGenre?: string,
      overrideSearch?: string
    ) => {
      const type =
        key === "searchResults" ? undefined
        : key === "recommended" ? "topRated"
        : key;

      setSections((prev) => ({
        ...prev,
        [key]: {
          ...prev[key],
          loading:     !append,
          loadingMore: append,
        },
      }));

      try {
        const res = await getMovies({
          type,
          page,
          size: key === "searchResults" ? 25 : 15,
          genre:  overrideGenre  ?? genreRef2.current,
          search: overrideSearch ?? debouncedSearchRef.current,
        });

        const { content, totalPages } = res.data;

        setSections((prev) => ({
          ...prev,
          [key]: {
            movies:      append ? [...prev[key].movies, ...content] : content,
            page:        page + 1,
            totalPages,
            loading:     false,
            loadingMore: false,
          },
        }));
      } catch (err: any) {
        setSections((prev) => ({
          ...prev,
          [key]: { ...prev[key], loading: false, loadingMore: false },
        }));
        toast.error(err.message || `Failed to load ${key} movies`);
      }
    }
  ).current;

  const isSearching = debouncedSearch.trim() !== "";

  useEffect(() => {
    if (debouncedSearch.trim() !== "") {
      fetchSection("searchResults", 0, false);
    } else {
      (["topRated", "trending", "recommended"] as SectionKey[]).forEach((key) =>
        fetchSection(key, 0, false)
      );
    }
  }, [genre, debouncedSearch, fetchSection]);

  const loadMore = useCallback(
    (key: SectionKey) => {
      const { page, totalPages, loadingMore, loading } = sectionsRef.current[key];
      if (loadingMore || loading || page >= totalPages) return;
      fetchSection(key, page, true);
    },
    [fetchSection]
  );

  const showAll               = category === "all";
  const showTopRated          = !isSearching && (showAll || category === "topRated");
  const showTrending          = !isSearching && (showAll || category === "trending");
  const showRecommended       = !isSearching && (showAll || category === "recommended");
  const showRecentlyWatched  = isAuthenticated && !isSearching && (showAll || category === "recentlyWatched");
  const showAllSection        = !isSearching && showAll;

  return (
    <div className="min-h-screen bg-background">
      <Navbar
        search={search}
        setSearch={setSearch}
        genre={genre}
        setGenre={setGenre}
        category={category}
        setCategory={setCategory}
        isSearching={isSearching}
      />

      <main className="container mx-auto px-4 pt-2 pb-8 flex flex-col gap-3">

        {/* Category pills */}
        {!isSearching && setCategory && category !== undefined && (
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-none pb-0.5">
            {CATEGORIES
              .filter((cat) => isAuthenticated || (cat.value !== "recentlyWatched" && cat.value !== "recommended"))
              .map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => setCategory(cat.value)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap
                    ${category === cat.value
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                >
                  {cat.label}
                </button>
              ))}
          </div>
        )}

        {/* Genre filter */}
        {setGenre && genre !== undefined && (
          <div className="flex justify-start mb-1">
            <div className="relative shrink-0" ref={genreRef}>
              <button
                onClick={() => setGenreOpen((v) => !v)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors hover:bg-muted"
              >
                {genre || "Tất Cả Thể Loại"}
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${genreOpen ? "rotate-180" : ""}`} />
                {genre && <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-xs">1</Badge>}
              </button>

              {genreOpen && (
                <div className="absolute top-full mt-1 left-0 z-50 w-56 bg-popover border rounded-lg shadow-lg p-2">
                  <button
                    onClick={() => { setGenre(""); setGenreOpen(false); }}
                    className={`w-full text-left px-3 py-1.5 rounded-md text-sm transition-colors
                      ${!genre ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted text-muted-foreground"}`}
                  >
                    Tất Cả Thể Loại
                  </button>
                  <div className="h-px bg-border my-1" />
                  <div className="grid grid-cols-2 gap-0.5 max-h-52 overflow-y-auto">
                    {GENRES.map((g) => (
                      <button
                        key={g}
                        onClick={() => { setGenre(g); setGenreOpen(false); }}
                        className={`text-left px-3 py-1.5 rounded-md text-sm transition-colors
                          ${genre === g ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted"}`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Danh sách phim ────────────────────────────────────────────────── */}
        <div className="space-y-10 mt-2">

          {/* KẾT QUẢ TÌM KIẾM */}
          {isSearching && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b pb-2">
                <Search className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-bold">Search Results for "{debouncedSearch}"</h2>
              </div>

              {sections.searchResults.loading ? (
                <div className="text-center py-12 text-muted-foreground">Searching...</div>
              ) : sections.searchResults.movies.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">No movies found matching your search.</div>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                    {sections.searchResults.movies.map((movie) => (
                      <MovieCard key={movie.id} {...movie} />
                    ))}
                  </div>

                  {sections.searchResults.page < sections.searchResults.totalPages && (
                    <div className="flex justify-center pt-4">
                      <button
                        onClick={() => loadMore("searchResults")}
                        disabled={sections.searchResults.loadingMore}
                        className="px-6 py-2 rounded-full border text-sm font-medium hover:bg-muted disabled:opacity-50"
                      >
                        {sections.searchResults.loadingMore ? "Loading more..." : "Load More"}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* CAROUSEL DANH MỤC GỐC */}
          {showTopRated && (
            <MovieSection
              title="Top Rated"
              icon={Star}
              movies={sections.topRated.movies}
              loading={sections.topRated.loading}
              hasMore={sections.topRated.page < sections.topRated.totalPages}
              loadingMore={sections.topRated.loadingMore}
              onLoadMore={() => loadMore("topRated")}
            />
          )}

          {showTrending && (
            <MovieSection
              title="Trending Now"
              icon={TrendingUp}
              movies={sections.trending.movies}
              loading={sections.trending.loading}
              hasMore={sections.trending.page < sections.trending.totalPages}
              loadingMore={sections.trending.loadingMore}
              onLoadMore={() => loadMore("trending")}
            />
          )}

          {isAuthenticated && showRecommended && (
            <MovieSection
              title="Recommended for You"
              icon={ThumbsUp}
              movies={sections.recommended.movies}
              loading={sections.recommended.loading}
              hasMore={sections.recommended.page < sections.recommended.totalPages}
              loadingMore={sections.recommended.loadingMore}
              onLoadMore={() => loadMore("recommended")}
              showRating
            />
          )}

          {showAllSection && (
            <MovieSection
              title="Browse All"
              icon={Film}
              movies={[...sections.topRated.movies].reverse()}
              loading={sections.topRated.loading}
            />
          )}

          {showRecentlyWatched && recentlyWatched.length > 0 && (
            <MovieSection
              title="Recently Watched"
              icon={Clock}
              movies={recentlyWatched}
            />
          )}

          {/* FIX: Thêm điều kiện !isAuthenticated vào đây để xử lý an toàn nếu user cố tình truy cập thủ công */}
          {((category === "recentlyWatched" && recentlyWatched.length === 0) || (category === "recentlyWatched" && !isAuthenticated)) && !isSearching && (
            <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
              <Clock className="w-12 h-12 text-muted-foreground/40" />
              <h3 className="text-lg font-medium">Nothing here yet</h3>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}