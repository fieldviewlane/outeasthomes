# Field View Lane Showcase

A modern, elegant rental property showcase website combining the best features from multiple designs.

## Getting Started

Node.js & npm are required - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

### Installation & Development

```sh
# Install dependencies
npm install

# Start the development server
npm run dev
```

### Build for Production

```sh
npm run build
```

### Preview the production build locally

```sh
# build once
npm run build

# then run the local preview server
npm run preview
```

### Branch & deploy workflow

- Work on the `dev` branch for changes.
- When youre happy, merge `dev` into `main`.
- A GitHub Action automatically builds `main` and deploys to the `gh-pages` branch.
- The live site is served from GitHub Pages at `https://fieldviewlane.github.io/outeasthomes/`.

## Technologies

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## Features

- Full-screen image carousel with captions
- Responsive design
- Contact form with validation
- Modern, clean UI with smooth animations

## Updating Carousel Images & Captions

The hero carousel is implemented in `src/components/HorizontalCarousel.tsx`.

To change the images and the text over each image:

1. **Update or add images** in `src/assets/` (e.g. replace `living-room.jpg`, `kitchen.jpg`, etc. or add new files).
2. **Edit the `images` array** at the top of `src/components/HorizontalCarousel.tsx`:
   - `src`: import for the image file (from `@/assets/...`).
   - `title`: large heading rendered over the image.
   - `description`: smaller supporting text rendered under the title.
3. To **add or remove slides**, add or remove objects in the `images` array. The carousel and dots navigation will automatically adjust to the new length.
4. If you rename any image files, make sure the imports at the top of `HorizontalCarousel.tsx` match the new filenames.
