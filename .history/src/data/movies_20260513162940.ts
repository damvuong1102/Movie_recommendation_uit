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

    cast: ["Tim Robbins", "Morgan Freeman"],

    totalRatings: 3245,

    streamingPlatforms: [
      {
        name: "Netflix",
        icon:
          "https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=100&h=100&fit=crop",
        link: "#"
      }
    ],

    categories: ["recommended", "top-rated"]
  },

  {
    id: 2,

    title: "Inception",

    year: 2010,

    rating: 4.4,

    genre: "Sci-Fi",

    imageUrl:
      "https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=400&h=600&fit=crop",

    backdropUrl:
      "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=1200&h=400&fit=crop",

    runtime: "2h 28m",

    description:
      "A skilled thief enters people's dreams to steal secrets but is tasked with planting an idea into a target's subconscious.",

    director: "Christopher Nolan",

    cast: [
      "Leonardo DiCaprio",
      "Tom Hardy",
      "Joseph Gordon-Levitt"
    ],

    totalRatings: 2847,

    streamingPlatforms: [
      {
        name: "Netflix",
        icon:
          "https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=100&h=100&fit=crop",
        link: "#"
      },
      {
        name: "Prime Video",
        icon:
          "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=100&h=100&fit=crop",
        link: "#"
      }
    ],

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

    backdropUrl:
      "https://images.unsplash.com/photo-1505685296765-3a2736de412f?w=1200&h=400&fit=crop",

    runtime: "2h 32m",

    description:
      "Batman faces the Joker, a criminal mastermind who plunges Gotham City into chaos and tests Batman's limits.",

    director: "Christopher Nolan",

    cast: [
      "Christian Bale",
      "Heath Ledger",
      "Gary Oldman"
    ],

    totalRatings: 5124,

    streamingPlatforms: [
      {
        name: "HBO Max",
        icon:
          "https://images.unsplash.com/photo-1611162618071-b39a2ec055fb?w=100&h=100&fit=crop",
        link: "#"
      }
    ],

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

    backdropUrl:
      "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=1200&h=400&fit=crop",

    runtime: "2h 34m",

    description:
      "The lives of two mob hitmen, a boxer, and others intertwine in a series of violent and darkly comedic stories.",

    director: "Quentin Tarantino",

    cast: [
      "John Travolta",
      "Samuel L. Jackson",
      "Uma Thurman"
    ],

    totalRatings: 2412,

    streamingPlatforms: [
      {
        name: "Disney+",
        icon:
          "https://images.unsplash.com/photo-1616530940355-351fabd9524b?w=100&h=100&fit=crop",
        link: "#"
      }
    ],

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

    backdropUrl:
      "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=1200&h=400&fit=crop",

    runtime: "2h 49m",

    description:
      "A team of explorers travels through a wormhole in space to ensure humanity's survival as Earth becomes uninhabitable.",

    director: "Christopher Nolan",

    cast: [
      "Matthew McConaughey",
      "Anne Hathaway",
      "Jessica Chastain"
    ],

    totalRatings: 3987,

    streamingPlatforms: [
      {
        name: "Prime Video",
        icon:
          "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=100&h=100&fit=crop",
        link: "#"
      }
    ],

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

    backdropUrl:
      "https://images.unsplash.com/photo-1513106580091-1d82408b8cd6?w=1200&h=400&fit=crop",

    runtime: "2h 55m",

    description:
      "The aging patriarch of an organized crime dynasty transfers control of his empire to his reluctant son.",

    director: "Francis Ford Coppola",

    cast: [
      "Al Pacino",
      "Marlon Brando",
      "James Caan"
    ],

    totalRatings: 4678,

    streamingPlatforms: [
      {
        name: "Netflix",
        icon:
          "https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=100&h=100&fit=crop",
        link: "#"
      }
    ],

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

    backdropUrl:
      "https://images.unsplash.com/photo-1489515217757-5fd1be406fef?w=1200&h=400&fit=crop",

    runtime: "3h 15m",

    description:
      "A businessman saves the lives of Jewish refugees during the Holocaust by employing them in his factories.",

    director: "Steven Spielberg",

    cast: [
      "Liam Neeson",
      "Ben Kingsley",
      "Ralph Fiennes"
    ],

    totalRatings: 2894,

    streamingPlatforms: [
      {
        name: "Prime Video",
        icon:
          "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=100&h=100&fit=crop",
        link: "#"
      }
    ],

    categories: ["top-rated"]
  },

  {
    id: 8,

    title: "Oppenheimer",

    year: 2023,

    genre: "Biography",

    rating: undefined,

    imageUrl:
      "https://images.unsplash.com/photo-1533928298208-27ff66555d8d?w=400&h=600&fit=crop",

    backdropUrl:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1200&h=400&fit=crop",

    runtime: "3h 0m",

    description:
      "The story of J. Robert Oppenheimer and the development of the atomic bomb during World War II.",

    director: "Christopher Nolan",

    cast: [
      "Cillian Murphy",
      "Emily Blunt",
      "Robert Downey Jr."
    ],

    totalRatings: 0,

    streamingPlatforms: [
      {
        name: "Apple TV",
        icon:
          "https://images.unsplash.com/photo-1616469829941-c7200edec809?w=100&h=100&fit=crop",
        link: "#"
      }
    ],

    categories: ["recently-watched"]
  }
];