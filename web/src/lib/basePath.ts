// Mirrors next.config.ts's basePath for client-side code. Next.js
// auto-prefixes <Link>/router navigation with basePath, but a raw
// fetch() call is just a browser API that knows nothing about it, so
// any client component calling our own /api/* routes needs this.
// NEXT_PUBLIC_* is required for a value to reach the client bundle.
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
