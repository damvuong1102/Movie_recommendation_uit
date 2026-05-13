import { Film, TrendingUp, Clock, Search, User, LogIn } from "lucide-react";

import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";

import {
  recommendedMovies,
  topRatedMovies,
  recentlyWatchedMovies
} from "../data/movies";

import { MovieSection } from "../components/MovieSection";

export default function Home() {
  return (
    <div className="min-h-screen bg-background"></div>