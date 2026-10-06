I would like to build a small, client-side web application (called "Iconic") that has the purpose of creating and modifying logos.
It shall allow a user to either drop an image into a huge drop zone or paste a link to an image or select an image file from disk.
The tool shall then convert the image to a logo and allow the user to customize what it shall convert into:

- a padding (in px)
- a background color (only black and white)
- square it (showing the entire logo still)
- a combination of the above

The final image shall be live previewed and the user shall be allowed to download in either png or jpeg (with an estimated file size). Also, the dimensions shall be allowed to be customized:

- convenience: small, medium, large
- free number entry (in px)

I would also like to support https://dashboardicons.com/ somehow, but I am not sure if they have a public API or if we need to find another solution (download from there, reupload to Iconic).

The tech stack shall be based on SvelteKit, if possible.
Tailwind CSS can be used for styling.
Each additional library for convenience or edge cases shall be discussed with the developer before adding it.
A high quality of code and security is a must.
Common QA tools (eslint, prettier, etc.) shall be used.

This cosebase shall be friendly for AI agents (mainly Claude and Codex) and use MCP servers and agent skills from https://github.com/mattpocock/skills where feasible.

I would like to support a light mode and dark mode which is preset to the current device setting, but can be changed easily in the top right corner.
