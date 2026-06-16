// src/components/layout/Navbar.tsx
import { Search, LogIn, LogOut, Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";

import { Button } from "../ui/button";
import { Input } from "../ui/input";

import { useAuth } from "../../context/AuthContext";
import logoImage from './logo.png';

import { Sun, Moon } from "lucide-react"; 
import { useTheme } from "../../context/ThemeContext"; 

// ─── Types ────────────────────────────────────────────────────────────────────

export type MovieCategory =
  | "all"
  | "topRated"
  | "trending"
  | "recommended"
  | "recentlyWatched";

// ─── Props ────────────────────────────────────────────────────────────────────

interface NavbarProps {
  search?:       string;
  setSearch?:    React.Dispatch<React.SetStateAction<string>>;
  genre?:        string;
  setGenre?:     React.Dispatch<React.SetStateAction<string>>;
  category?:     MovieCategory;
  setCategory?:  React.Dispatch<React.SetStateAction<MovieCategory>>;
  isSearching?: boolean;
}

// 🟢 1. ĐƯA COMPONENT SEARCHINPUT RA NGOÀI HẲN ĐỂ TRÁNH BỊ UNMOUNT KHI RE-RENDER
interface SearchInputProps {
  search?: string;
  setSearch?: React.Dispatch<React.SetStateAction<string>>;
  isSearching: boolean;
  autoFocus?: boolean;
}

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

// ─── Component Chính ──────────────────────────────────────────────────────────

export default function Navbar({
  search,
  setSearch,
  genre,
  setGenre,
  category,
  setCategory,
  isSearching = false,
}: NavbarProps) {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [genreOpen, setGenreOpen]             = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const genreRef = useRef<HTMLDivElement>(null);

  const { theme, setTheme } = useTheme();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (genreRef.current && !genreRef.current.contains(e.target as Node)) {
        setGenreOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try { await logout(); } catch (err) { console.error(err); }
    navigate("/home");
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">

        {/* ── Top bar ── */}
        <div className="flex items-center justify-between gap-4 py-2">

          {/* Logo */}
          <Link
            to={"/home"}
            className="flex items-center gap-3 shrink-0"
          >
            {/* <img 
              src={logoImage} 
              alt="Movies4You Logo" 
              className="h-10 w-auto object-contain" 
            /> */}
          <h1 
              className=" sm:text-3xl text-[#E50914] uppercase origin-left inline-block"
              style={{ 
                fontFamily: "'Bebas Neue', 'Impact', sans-serif",
                transform: 'scaleX(0.8) scaleY(1.2)', 
                // letterSpacing: '0.12em' 
              }}
            >
              Movies
              <span className="text-black dark:text-white transition-colors duration-200">4</span>
              You
            </h1>
          </Link>

          {/* Desktop search */}
          {search !== undefined && setSearch !== undefined && (
            <div className="hidden md:block flex-1 max-w-sm">
              {/* 🟢 2. Gọi component ngoài và truyền đầy đủ props vào */}
              <SearchInput 
                search={search} 
                setSearch={setSearch} 
                isSearching={isSearching} 
              />
            </div>
          )}

          {/* Right section */}
          <div className="flex items-center gap-2">

            {/* Mobile search toggle */}
            {search !== undefined && (
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                // 🟢 3. Chỉ bật/tắt bằng nút bấm chứ không tự out khi gõ chữ
                onClick={() => setMobileSearchOpen((v) => !v)}
              >
                {isSearching
                  ? <Loader2 className="w-5 h-5 animate-spin" />
                  : <Search className="w-5 h-5" />
                }
              </Button>
            )}

            {/* NÚT CHUYỂN CHẾ ĐỘ SÁNG - TỐI */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="rounded-full w-9 h-9"
              title="Toggle dark mode"
            >
              {theme === "dark" ? (
                <Sun className="w-4 h-4 text-yellow-500 transition-all" />
              ) : (
                <Moon className="w-4 h-4 text-slate-700 transition-all" />
              )}
            </Button>

            {/* Auth section */}
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-muted/50">
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                    {user?.displayName?.charAt(0).toUpperCase() ||
                      user?.username?.charAt(0).toUpperCase() || "U"}
                  </div>
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
                  Logout
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login">
                  <Button variant="outline">
                    <LogIn className="w-4 h-4 mr-2" />
                    Sign In
                  </Button>
                </Link>
                <Link to="/register">
                  <Button>Sign Up</Button>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobile search bar */}
        {mobileSearchOpen && search !== undefined && setSearch !== undefined && (
          <div className="pb-2 md:hidden">
            {/* 🟢 4. Gọi component ngoài cho luồng mobile */}
            <SearchInput 
              search={search} 
              setSearch={setSearch} 
              isSearching={isSearching} 
              autoFocus 
            />
          </div>
        )}

      </div>
    </header>
  );

}