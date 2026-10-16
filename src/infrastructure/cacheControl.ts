// How long the Firebase Hosting CDN may serve a public page before asking Cloud
// Run again, so most visits skip a cold start and the Firestore reads. Browsers
// always revalidate (max-age=0) and get the CDN's copy. A deploy clears the
// whole cache. Pages without a header here (admin, sign-in, API) stay uncached:
// Hosting marks dynamic content private.
export const CACHE_CONTROL = {
  // Admin edits and the "Heute" marker after midnight lag at most a minute
  startPage: 'public, max-age=0, s-maxage=60',
  // Only the contact details on it are edited, and rarely
  legalNotice: 'public, max-age=0, s-maxage=600',
  // Hosting would cache a 404 without a header for 10 minutes anyway; said
  // here, so the signed in admin can be exempted. A URL only starts to exist
  // with a deploy, which clears the cache.
  notFound: 'public, max-age=0, s-maxage=600',
  // For requests with the session cookie, so the admin sees an edit on the
  // next page view. Anyone can send one, which only skips the cache for them
  signedIn: 'private, no-cache',
};
