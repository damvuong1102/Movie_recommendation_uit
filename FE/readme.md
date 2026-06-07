**Functional and Non-Functional Specifications**

- UI features actually implemented in the FE:
  - Authentication pages: login and register forms with controlled inputs, native validation, loading states, toast/error feedback, and auto-navigation. Evidence: Login.tsx, Register.tsx
  - Global navigation bar with desktop search, mobile search toggle, auth-aware sign in/sign up vs logout state, and user badge. Evidence: Navbar.tsx
  - Home page category pills, genre dropdown filter, debounced search, multiple movie sections, load-more behavior, and recently watched list. Evidence: Home.tsx, Home.tsx
  - Movie section carousel-like pagination using previous/next control plus dot indicators. Evidence: MovieSection.tsx
  - Movie cards with hover overlay, play icon overlay, poster fallback, and rating badge. Evidence: MovieCard.tsx
  - Movie rating card with clickable 1–5 stars, hover preview, optimistic update, and submit spinner. Evidence: MovieCardWithRating.tsx
  - Movie detail page with poster/backdrop, metadata, review list, and rating submission panel. Evidence: MovieDetail.tsx, RatingSubmit.tsx
  - Protected route wrapper with initialization spinner. Evidence: ProtectedRoute.tsx

- Non-functional behaviors present in the FE:
  - Async request deduplication for token refresh: `refreshPromise` shares one refresh call across concurrent 401 responses. Evidence: api.ts
  - Automatic retry after refresh: `apiFetch` retries the original request once after `doRefresh()`. Evidence: api.ts
  - Forced logout propagation: on refresh failure, `apiFetch` clears localStorage and dispatches `auth:logout`. Evidence: api.ts, AuthContext.tsx
  - Loading states: `loading`, `loadingMore`, `ratingsLoading`, `isSubmitting`, and `initializing` control spinners/skeletons/text placeholders. Evidence: Home.tsx, MovieSection.tsx, MovieDetail.tsx
  - Error handling: try/catch blocks in login, register, movie fetch, rating submit, and refresh flow. Evidence: Login.tsx, Register.tsx, Home.tsx, RatingSubmit.tsx, api.ts
  - Responsive mechanics: Tailwind responsive classes such as `grid lg:grid-cols-2`, `grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5`, `hidden md:block`, `md:hidden`, `sticky`, `overflow-x-auto`. Evidence: Login.tsx, Home.tsx, Navbar.tsx
  - Motion/transition mechanisms: `transition-transform`, `transition-colors`, `transition-shadow`, `duration-300`, `animate-spin`, `animate-pulse`, `group-hover:*`, and `backdrop-blur`. Evidence: MovieCard.tsx, MovieSection.tsx, Navbar.tsx, theme.css

**User Flows and Business Logic**

- Authentication flow, exact FE logic:
  1. Login form captures controlled values through `username` and `password` state.
  2. `handleLogin` calls `e.preventDefault()`.
  3. Custom validation rejects empty fields with `setValidationError("Please enter username and password")`.
  4. `loading` is set to true before the request.
  5. `loginAPI(username, password)` is called.
  6. On success, `res.data.accessToken`, `refreshToken`, and `user` are extracted.
  7. `login(user, accessToken, refreshToken)` persists session data to localStorage through AuthContext.
  8. Navigation goes to `location.state.from` or `/home`.
  9. On failure, the UI shows `toast.error(...)`.
  10. `loading` is reset in `finally`.

  Source: Login.tsx, authService.ts, AuthContext.tsx

- Register flow, exact FE logic:
  1. Controlled inputs capture `username`, `email`, `password`, and `displayName`.
  2. Native HTML validation is enabled with `required`, `type="email"`, `minLength={6}`, and `maxLength={100}`.
  3. `handleRegister` prevents default form submit.
  4. `registerAPI({ username, email, password, displayName })` is called.
  5. On success, `login(user, accessToken, refreshToken)` runs, then `navigate("/home")`.
  6. On failure, both toast and inline `validationError` are set.
  7. `loading` is reset in `finally`.

  Source: Register.tsx, authService.ts

- Exact auth request code:
```ts
// login
return apiFetch("/auth/login", {
  method: "POST",
  body: JSON.stringify({ username, password }),
});

// register
return apiFetch("/auth/register", {
  method: "POST",
  body: JSON.stringify(data),
});
```
Source: authService.ts

- Movie rating flow, exact FE logic:
  - In MovieCardWithRating, each star is created by `[1, 2, 3, 4, 5].map((star) => ...)`.
  - The click handler is `onClick={() => handleRate(star)}`.
  - `handleRate(star)` does an optimistic UI update via `setSavedRating(star)`.
  - `isSubmitting` switches to true and the stars are replaced by a `Loader2` spinner while the request is in flight.
  - The request body is `submitRating({ movieId: id, rating: star })`.
  - On error, the component rolls back the last rating with `setSavedRating((prev) => (prev === star ? 0 : prev))`.
  - `hoverRating` is used only for hover preview; `displayRating = hoverRating || savedRating`.

  Source: MovieCardWithRating.tsx

- RatingSubmit flow on Movie Detail:
  - `onClick={() => setRating(star)}` stores the selected star in local state.
  - `hoverRating` previews the hover state.
  - `handleSubmit()` blocks submission when `rating === 0`.
  - Request body is `submitRating({ movieId, rating, review })`.
  - Button is disabled while loading, when no star is selected, or when review text is empty.

  Source: RatingSubmit.tsx

- Important contract fact for your report:
  - The FE does not send `userId` in the POST body for rating submission.
  - The only payload fields sent by the FE are `movieId`, `rating`, and optionally `review`.
  - `userId` appears only in the response type `RatingResponse`, not in the request type `RatingRequest`.

  Source: rating.ts, RatingSubmit.tsx

**Architecture and API Contract**

| Endpoint used by FE | Method | Request body shape from FE | Response fields consumed by UI |
|---|---|---|---|
| `/api/auth/login` | POST | `{ username, password }` | `success`, `message`, `data.accessToken`, `data.refreshToken`, `data.user.id`, `data.user.username`, `data.user.email`, `data.user.displayName`, `data.user.role` |
| `/api/auth/register` | POST | `{ username, email, password, displayName }` | Same shape as login; FE reads `success`, `message`, `data.accessToken`, `data.refreshToken`, `data.user` |
| `/api/auth/logout` | POST | none | No response fields are consumed directly |
| `/api/auth/refresh` | POST | `{ refreshToken }` | `success`, `data.accessToken` |
| `/api/movies?page=&size=&sort=&genre=&query=&type=` | GET | query string only | `data.content[]`, `data.totalPages` |
| `/api/movies/tmdb/{id}` | GET | none | `data.id`, `data.tmdbId`, `data.title`, `data.posterUrl`, `data.backdropUrl`, `data.genres`, `data.releaseYear`, `data.releaseDate`, `data.overview`, `data.runtimeMinutes`, `data.avgRating`, `data.ratingCount`, `data.myRating`, `data.myReview` |
| `/api/movies/{id}/ratings?page=&size=` | GET | query string only | `data.content[]` of rating objects |
| `/api/ratings` | POST | `{ movieId, rating, review? }` | UI does not map a success payload directly; success is inferred by no exception |
| `/api/ratings/{id}` | PUT | `{ rating, review? }` | UI does not map a success payload directly |
| `/api/ratings/{id}` | DELETE | none | UI does not map a success payload directly |

- Endpoint source files:
  - Central fetch wrapper and refresh logic: api.ts
  - Auth API calls: authService.ts
  - Movie API calls: movieService.ts
  - Rating API calls: ratingService.ts

- Response fields mapped to components:
  - MovieCard uses `title`, `posterUrl`, `genres`, `avgRating`, `tmdbId`. Source: MovieCard.tsx
  - MovieCardWithRating uses `title`, `posterUrl`, `genres`, `id`. Source: MovieCardWithRating.tsx
  - MovieDetail uses `backdropUrl`, `posterUrl`, `title`, `releaseDate`, `releaseYear`, `runtimeMinutes`, `genres`, `avgRating`, `ratingCount`, `overview`. Source: MovieDetail.tsx
  - ReviewCard uses `username`, `rating`, `review`, `createdAt`. Source: ReviewCard.tsx

**Frontend Implementation and UI/UX Mechanics**

- Layout construction technique:
  - The FE uses Tailwind utility-first layout throughout, with flexbox and CSS grid as the main layout systems.
  - Main semantic blocks are `header`, `main`, `section`, `Card`, `div`, and `footer-like` card content structures.
  - Examples:
    - Login page: two-column grid with a preview panel and auth card. Source: Login.tsx
    - Home page: stacked sections plus grid movie cards. Source: Home.tsx
    - Movie detail page: poster/info split layout and review/rating two-column layout. Source: MovieDetail.tsx, MovieDetail.tsx
    - Navbar: sticky horizontal flex bar. Source: Navbar.tsx

- Modal behavior:
  - There is no app-level modal flow wired into pages or routes.
  - The repository contains reusable Radix dialog primitives only: dialog, sheet, and alert-dialog components.
  - I found no active page using those primitives in the FE app code.

  Primitive sources: dialog.tsx, sheet.tsx, alert-dialog.tsx

- Hover and toggle mechanics:
  - Movie cards use `group-hover:scale-105`, `group-hover:bg-black/...`, and `group-hover:opacity-100` to animate the poster overlay and play button.
  - Genre dropdown uses local `genreOpen` state plus `document.addEventListener("mousedown", handleClickOutside)` to close on outside click.
  - Navbar mobile search uses `mobileSearchOpen` toggle state.
  - MovieSection dots use `setOffset(i)` to jump to a carousel position.

  Sources: MovieCard.tsx, Navbar.tsx, Home.tsx, MovieSection.tsx

- Mock data arrays:
  - `topRatedMovies` in Login is the only explicit mock content array used for initial UI rendering before backend data. Source: Login.tsx
  - `GENRES` and `CATEGORIES` are static UI option lists, not backend mock datasets. Source: Home.tsx

- Dynamic DOM rendering approach:
  - `map` is used for rendering:
    - `topRatedMovies.map(...)` in Login
    - `CATEGORIES.map(...)` in Home
    - `GENRES.map(...)` in Home
    - `sections.searchResults.movies.map(...)` in Home
    - `visibleMovies.map(...)` in MovieSection
    - `[1, 2, 3, 4, 5].map(...)` in both rating components and review cards
  - `Array.from(...)` is used for skeleton placeholders and dot indicators in MovieSection.
  - `forEach` is used in Home only to trigger section fetches, not for rendering: `["topRated", "trending", "recommended"].forEach(...)`.

  Sources: Home.tsx, Home.tsx, MovieSection.tsx, ReviewCard.tsx

- CSS and responsiveness:
  - theme.css defines the design tokens via CSS variables such as `--background`, `--foreground`, `--card`, `--primary`, `--muted`, and their dark-mode overrides.
  - Base typography is defined for `h1` to `h4`, `label`, `button`, and `input`.
  - index.html is minimal: root mount point plus module script only.

  Sources: theme.css, index.html
