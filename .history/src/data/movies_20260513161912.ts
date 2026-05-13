import { Movie } from "../types/movie";

export const allMovies: Movie[] = [
{
  id: 1,

  title: "The Shawshank Redemption",

  year: 1994,

  rating: 4.7,

  genre: "Drama",

  imageUrl:
    "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400&h=600&fit=crop",

  backdropUrl:
    "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1200&h=400&fit=crop",

  runtime: "2h 22m",

  description:
    "Two imprisoned men bond over several years, finding solace and eventual redemption through acts of common decency.",

  director: "Frank Darabont",

  cast: [
    "Tim Robbins",
    "Morgan Freeman"
  ],

  totalRatings: 3245,

  streamingPlatforms: [
    {
      name: "Netflix",
      icon:
        "https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=100&h=100&fit=crop",
      link: "#"
    }
  ],

  categories: [
    "recommended",
    "top-rated"
  ]
},

  {
    id: 2,
    title: "Inception",
    year: 2010,
    rating: 4.4,
    genre: "Sci-Fi",
    imageUrl:
      "https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=400&h=600&fit=crop",
    runtime: "2h 28m",
    categories: ["recommended"]
  },

  {
    id: 3,
    title: "The Dark Knight",
    year: 2008,
    rating: 4.5,
    genre: "Action",
    imageUrl:
      "https://images.unsplash.com/photo-1509347528160-9a9e33742cdb?w=400&h=600&fit=crop",
    runtime: "2h 32m",
    categories: ["recommended", "top-rated"]
  },

  {
    id: 4,
    title: "Pulp Fiction",
    year: 1994,
    rating: 4.4,
    genre: "Crime",
    imageUrl:
      "https://images.unsplash.com/photo-1574267432644-f610a5e0b50e?w=400&h=600&fit=crop",
    runtime: "2h 34m",
    categories: ["recommended"]
  },

  {
    id: 5,
    title: "Interstellar",
    year: 2014,
    rating: 4.3,
    genre: "Sci-Fi",
    imageUrl:
      "https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?w=400&h=600&fit=crop",
    runtime: "2h 49m",
    categories: ["recommended"]
  },

  {
    id: 6,
    title: "The Godfather",
    year: 1972,
    rating: 4.6,
    genre: "Crime",
    imageUrl:
      "https://images.unsplash.com/photo-1594908900066-3f47337549d8?w=400&h=600&fit=crop",
    runtime: "2h 55m",
    categories: ["top-rated"]
  },

  {
    id: 7,
    title: "Schindler's List",
    year: 1993,
    rating: 4.5,
    genre: "Drama",
    imageUrl:
      "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=400&h=600&fit=crop",
    runtime: "3h 15m",
    categories: ["top-rated"]
  },

  {
    id: 8,
    title: "Oppenheimer",
    year: 2023,
    genre: "Biography",
    imageUrl:
      "https://images.unsplash.com/photo-1533928298208-27ff66555d8d?w=400&h=600&fit=crop",
    runtime: "3h 0m",
    categories: ["recently-watched"]
  }
];