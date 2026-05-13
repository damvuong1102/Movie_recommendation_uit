import {Search, User, LogIn} from "lucide-react";

import { Link } from "react-router-dom";

import { Button } from "../ui/button";
import { Input } from "../ui/input";

interface NavbarProps {
  search?: string;

  setSearch?: React.Dispatch<
    React.SetStateAction<string>
  >;
}

export default function Navbar({
  search,
  setSearch
}: NavbarProps) {
  return (
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <Link
              to="/"
              className="flex items-center gap-3"
            >
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1598899134739-24c46f58b8c0?w=100&h=100&fit=crop"
                  alt="CineStream Logo"
                  className="w-full h-full object-cover"
                />
              </div>

              <h1>CineStream</h1>
            </Link>
                <img
                  src="https://images.unsplash.com/photo-1598899134739-24c46f58b8c0?w=100&h=100&fit=crop"
                  alt="CineStream Logo"
                  className="w-full h-full object-cover"
                />
              </div>
              <h1>CineStream</h1>
            </div>

            <div className="flex items-center gap-4">
              <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                type="search"
                placeholder="Search movies..."
                className="pl-9 w-64"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <Button variant="ghost" size="icon" className="md:hidden">
                <Search className="w-5 h-5" />
              </Button>

              <Button variant="ghost" size="icon">
                <User className="w-5 h-5" />
              </Button>

              <Link to="/login">
                <Button>
                  <LogIn className="w-4 h-4 mr-2" />
                  Log In
                </Button>
              </Link>
            </div>
          </div> */
        </div>
      </header>
  );
}