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
