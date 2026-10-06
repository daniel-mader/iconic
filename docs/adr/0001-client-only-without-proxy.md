# Client-only, no image proxy

Iconic is a static site and processes every image in the browser, so images never leave the user's device. The consequence is that loading from a link only works when the image's server sends CORS headers, and other links fail with an explanation and a hint to download and drop the file instead. We rejected a server-side fetch proxy: it would need hosting, would see every user's images, and would be an open SSRF and bandwidth-abuse target.
