# Video Grid + Subtitles

Live demo: https://cf-ai-moq-video-grid.reddygtvs.workers.dev/

AI-powered video grid with automatic subtitle generation using Cloudflare Workers AI.

Upload videos, get AI-generated subtitles, browse in grid view, watch with synchronized captions.

## Quick Start

```bash
npm install
wrangler r2 bucket create moq-videos
npm run dev
```

Visit http://localhost:5173

## Architecture

**Frontend:** React + TypeScript + Tailwind CSS + Vite

**Backend:** Cloudflare Workers + Durable Objects + R2 Storage

**AI:** Whisper Large V3 Turbo via Workers AI

## How It Works

1. User uploads video file via drag-and-drop interface
2. File stored in R2 bucket, metadata tracked in Durable Object
3. Background worker extracts audio, calls Whisper AI for transcription
4. WebVTT subtitles generated with word-level timestamps
5. Grid displays videos with auto-loop, status tracking
6. Click video to watch with synchronized subtitles and transcript

## Project Structure

```
src/
├── app.tsx                   # React entry point
├── styles.css                # Monochrome UI styling
├── pages/
│   ├── GridPage.tsx          # Main video grid view
│   ├── UploadPage.tsx        # Video upload interface
│   └── WatchPage.tsx         # Video player with subtitles
├── components/
│   └── VideoCard.tsx         # Individual video card
└── server/
    ├── index.ts              # Main Cloudflare Worker
    ├── subtitle-generator.ts # Whisper AI integration
    └── durable-objects/
        └── video-metadata.ts # Video state management
```

## API Endpoints

- `POST /api/upload` - Upload video file with optional title
- `GET /api/videos` - List all videos with metadata
- `GET /api/video/:id` - Get specific video metadata
- `GET /api/stream/:id` - Stream video file
- `DELETE /api/video/:id` - Delete video and metadata

## Configuration

**R2 Bucket:** Videos stored in `moq-videos` bucket

**Whisper Model:** `@cf/openai/whisper-large-v3-turbo`

**Subtitle Chunking:** 10 words max, 5 seconds max per subtitle

**File Limits:** 100MB per video, MP4/WebM/MOV supported

## Development

```bash
# Local development
npm run dev

# Build for production
npm run build

# Deploy to Cloudflare
npm run deploy

# Generate TypeScript types
npm run types
```

## Cost Estimation

- Whisper AI: $0.00051 per audio minute
- R2 Storage: $0.015 per GB monthly
- Cloudflare Workers: Free tier sufficient for most usage
- Durable Objects: $0.15 per million requests

## Troubleshooting

**Subtitles not syncing:** Ensure video status is "ready" and WebVTT format valid
**R2 errors:** Create bucket first with `wrangler r2 bucket create moq-videos`

## License

MIT
