# Dashboard Icons via jsDelivr

dashboardicons.com has no public API. Its icons live in the homarr-labs/dashboard-icons GitHub repository (Apache-2.0), and the project recommends linking to them through jsDelivr, which serves them with permissive CORS headers. Iconic loads the repository's `metadata.json` (about 105 KB gzipped) on first use and fetches icons directly from `cdn.jsdelivr.net`, the only third-party origin the CSP allows for `<img>` (thumbnails). Fetches go through `connect-src https:`, which link import needs anyway. We rejected bundling the icons, which would add a large, quickly outdated snapshot to the app and make us redistribute them, and scraping dashboardicons.com, which is fragile and not meant for programmatic use.

## Consequences

- We use `metadata.json` rather than the repository's `tree.json`, which is not kept up to date and lacked about a third of the icons.
- The metadata is occasionally wrong about which files exist (about 1–2% of icons), so thumbnails and loading try a short list of candidate URLs: the source format, then the other format, then color variants.
- The website's search also lists icons from Simple Icons, selfh.st/icons and LobeHub through an internal API without CORS. Iconic only offers the Dashboard Icons collection itself, so searching for icons that come from those collections (e.g. CodeRabbit) finds nothing.
