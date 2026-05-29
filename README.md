# Infinity Reader ✦

> A distraction-free PDF reading experience, designed for deep focus. Built by **Infinity Blocks**.

## Overview

Infinity Reader solves the noise, distractions, and lighting issues that plague PDF reading. It provides a space-themed, immersive reading capsule that can be used standalone in a browser or embedded as a widget in Notion.

## Features

### Core
- **PDF Rendering** — High-quality PDF display powered by PDF.js with zoom and page navigation
- **Space Theme** — Deep black background with animated starfield, golden accents, and shooting stars
- **Launch Sequence** — Cinematic countdown animation when starting a reading session

### Reading Modes
- **Deep Space** — Pure black, zero distractions, subtle starfield background
- **Low Light** — Warm amber tones, gentle on sensitive eyes (reduces blue light)
- **Focus Mode** — Maximum concentration, minimal UI chrome

### Productivity
- **Reading Timer** — Set a mission duration (15m–120m), countdown with progress bar
- **Focus Shield** — Block distractions mode indicator
- **Session Complete** — Achievement celebration when timer expires, option to extend
- **Keyboard Navigation** — Arrow keys and spacebar for page turning

### Integration
- **Notion Embed** — Use `/embed` route for Notion widget embedding
- **Responsive** — Works on desktop and tablet
- **Fullscreen** — One-click fullscreen for total immersion

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | TailwindCSS |
| Animations | Framer Motion |
| PDF Engine | PDF.js |
| State | Zustand |
| Icons | Lucide React |

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Project Structure

```
src/
├── app/
│   ├── page.tsx          # Main app page
│   ├── layout.tsx        # Root layout with metadata
│   ├── globals.css       # Global styles, themes, design tokens
│   └── embed/
│       ├── page.tsx      # Notion-embeddable version
│       └── layout.tsx    # Embed layout
├── components/
│   ├── Starfield.tsx     # Animated canvas starfield with shooting stars
│   ├── UploadScreen.tsx  # PDF upload + configuration panel
│   ├── LaunchSequence.tsx# Countdown animation before reading
│   ├── ReadingScreen.tsx # Main reading view orchestrator
│   ├── PdfViewer.tsx     # PDF.js canvas renderer
│   ├── ReaderToolbar.tsx # Navigation, timer, zoom, mode controls
│   └── TimerComplete.tsx # Session complete modal
└── lib/
    └── store.ts          # Zustand state management
```

## Notion Embedding

To embed in Notion:
1. Deploy this app (e.g., Vercel/Netlify)
2. In Notion, use `/embed` block
3. Paste: `https://your-domain.com/embed`

## Roadmap

- [ ] Bookmarks & annotations
- [ ] Reading progress persistence (localStorage)
- [ ] Multi-PDF library with session history
- [ ] Text highlighting with color themes
- [ ] Reading speed analytics
- [ ] Ambient sound engine (space sounds)
- [ ] Pomodoro integration
- [ ] Dark/light page inversion for PDFs
- [ ] Gesture support for touch devices
- [ ] PWA support for offline reading

## Design Philosophy

- **Immersive** — The space theme isn't decorative; it creates psychological distance from distractions
- **Minimal** — Every UI element earns its place; controls auto-hide during reading
- **Scalable** — Feature-based architecture allows easy addition of new modules
- **Embeddable** — First-class Notion widget support via dedicated embed route

---

*Built with focus, for focus.* — Infinity Blocks
