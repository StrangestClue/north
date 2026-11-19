# North — Automated Video Generation Engine

A local-first video generation platform that creates polished academic-style educational videos automatically.

## Features

- **AI-Powered Script Generation** — Uses Ollama (local LLM) to generate structured scene graphs
- **Text-to-Speech** — Edge TTS for high-quality narration (free, no API key needed)
- **Visual Rendering** — Puppeteer + HTML/CSS for frame-by-frame scene rendering
- **Smart Audio Mixing** — FFmpeg with sidechain ducking for professional audio
- **Music Library** — Upload and manage background music tracks
- **Scene Editor** — Full visual editor with timeline, properties panel, and preview
- **16:9 Aspect Ratio** — Optimized for YouTube and educational platforms

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    ORCHESTRATOR (Node.js)                │
├─────────┬──────────┬──────────┬──────────┬──────────────┤
│ SCRIPT  │   TTS    │  VISUAL  │ COMPOSE  │  POST-PROC   │
│ ENGINE  │  ENGINE  │  ENGINE  │  ENGINE  │   ENGINE     │
│ (Ollama)│(Edge TTS)│(Puppeteer)│ (FFmpeg) │              │
└─────────┴──────────┴──────────┴──────────┴──────────────┘
```

## Tech Stack

- **Frontend:** Next.js 16, TypeScript, Tailwind CSS, shadcn/ui (zinc theme)
- **State Management:** Zustand (persisted to localStorage)
- **Backend:** Node.js API routes
- **LLM:** Ollama (Qwen2.5:7b or any compatible model)
- **TTS:** Edge TTS (Microsoft Edge's free TTS service)
- **Rendering:** Puppeteer (headless Chrome)
- **Video:** FFmpeg 8.x
- **Icons:** Lucide React

## Prerequisites

### Required

- **Node.js** 18+ and npm
- **FFmpeg** 8.x (`brew install ffmpeg` on macOS)
- **Ollama** with a model installed (`ollama pull qwen2.5:7b`)
- **Python 3.9+** with edge-tts (`pip3 install edge-tts`)

### Optional

- **Piper TTS** (for faster local TTS, requires additional setup)
- **GPU** (for faster rendering, not required)

## Installation

```bash
# Clone or navigate to the project
cd north

# Install Node dependencies
npm install

# Install edge-tts (Python)
pip3 install edge-tts

# Verify dependencies
ffmpeg -version
ollama list
which edge-tts
```

## Configuration

### API Keys

Create `.env.local` with your API keys:

```bash
# LLM Providers (configure at least one via the Providers UI in the app)
OLLAMA_URL=http://localhost:11434          # Local, no key needed
OPENAI_API_KEY=sk-...                       # OpenAI
ANTHROPIC_API_KEY=sk-ant-...                # Anthropic/Claude
GOOGLE_API_KEY=AIza...                      # Google/Gemini

# Optional Services
ELEVENLABS_API_KEY=...                      # Premium TTS
PEXELS_API_KEY=...                          # Stock footage (nice-to-have)
```

### Provider Management

The app now supports **in-app provider configuration**:

1. Click **"Providers"** button in the dashboard header
2. Click **"Add Provider"**
3. Select provider type:
   - **Ollama (Local)** — Requires base URL (default: `http://localhost:11434`)
   - **OpenAI** — Requires API key
   - **Anthropic** — Requires API key
   - **Google (Gemini)** — Requires API key
   - **Custom** — OpenAI-compatible endpoint
4. Enter provider name and models (comma-separated)
5. Set as default provider
6. Click **"Add Provider"**

### Model Selection

In the editor:
1. Select a model from the **model selector** dropdown (near Export button)
2. The selected model will be used for script generation
3. Models are fetched from your default provider

## Usage

### 1. Start the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 2. Create a Project

1. Click **"Create Project"**
2. Enter a title (e.g., "How Transformers Work")
3. Optionally select background music from your library
4. Click **"Create Project"**

### 3. Add Scenes

In the editor:
1. Hover the **+** button in the scene list
2. Select a scene type:
   - **Title Card** — Opening title with subtitle
   - **Carousel** — Bullet points with progressive disclosure
   - **Diagram** — Mermaid diagrams (flowcharts, sequences)
   - **Code Walkthrough** — Syntax-highlighted code
   - **Text Overlay** — Kinetic typography
   - **Stock Footage** — Pexels/Pixabay queries (placeholder)
   - **3D Simulation** — Three.js/Motion Canvas (placeholder)

3. Edit scene properties:
   - **Narration** — What the narrator says
   - **Duration** — Seconds (or leave blank for auto)
   - **Transitions** — In/out effects
   - **Visuals** — Type-specific fields

### 4. Upload Background Music (Optional)

1. Click the **♪** icon in the header
2. Drag-and-drop audio files (MP3, WAV, OGG, FLAC, M4A)
3. Select a track in the project editor
4. Adjust volume and enable **Smart Ducking**

### 5. Generate Video

1. Click **"Export"** in the editor header
2. Wait for generation (progress shown in status badge)
3. Video saved to `output/[project-id].mp4`

## Pipeline Flow

```
1. INPUT: Project with scenes
         │
2. SCRIPT ENGINE: (Optional) Generate scenes with LLM if empty
         │
3. FOR EACH SCENE:
   ├──► TTS ENGINE: Generate narration audio (Edge TTS)
   ├──► RENDERER: Capture frames with Puppeteer (30fps)
   │
4. COMPOSER (FFmpeg):
   ├──► Convert frames → video per scene
   ├──► Concatenate scenes with transitions
   ├──► Add background music with smart ducking
   │
5. OUTPUT: output/[project-id].mp4
```

## Scene Types

### Title Card
```json
{
  "type": "title_card",
  "narration": "Today we explore...",
  "visuals": {
    "title": "The Transformer Architecture",
    "subtitle": "A Visual Guide"
  }
}
```

### Carousel
```json
{
  "type": "carousel",
  "narration": "There are three key components...",
  "visuals": {
    "slides": [
      {
        "title": "Key Concepts",
        "bullets": ["Self-attention", "Multi-head attention", "Positional encoding"]
      }
    ]
  }
}
```

### Diagram
```json
{
  "type": "diagram",
  "narration": "The data flows through...",
  "visuals": {
    "engine": "mermaid",
    "source": "graph LR; Input-->Encoder; Encoder-->Decoder; Decoder-->Output"
  }
}
```

### Code Walkthrough
```json
{
  "type": "code_walkthrough",
  "narration": "Here's the implementation...",
  "visuals": {
    "engine": "code_highlight",
    "language": "python",
    "source": "class MultiHeadAttention(nn.Module):\n    def __init__(self):"
  }
}
```

### Text Overlay
```json
{
  "type": "text_overlay",
  "narration": "This is the key insight...",
  "visuals": {
    "text": "Attention Is All You Need",
    "style": "kinetic"
  }
}
```

## Smart Ducking

Background music automatically ducks (lowers volume) when narration plays:

- **Active Ratio:** 10% volume during narration
- **Silence Ratio:** 30% volume during pauses
- **Attack/Release:** Smooth 50ms/300ms transitions

Uses FFmpeg's `sidechaincompress` filter for professional audio mixing.

## Configuration

### Environment Variables (Optional)

Create `.env.local`:

```bash
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=qwen2.5:7b
```

### Customize TTS Voice

Edit `src/lib/pipeline/tts-engine.ts`:

```typescript
export async function generateTTS(
  text: string,
  outputPath: string,
  voice: string = "en-US-AriaNeural"  // Change voice here
): Promise<TTSResult>
```

Available voices: Run `edge-tts --list-voices`

### Customize Visual Templates

Edit `src/lib/pipeline/renderer.ts` to modify HTML/CSS for each scene type.

## Project Structure

```
north/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── generate/          # Video generation endpoint
│   │   │   └── music/             # Music library API
│   │   ├── project/[id]/          # Editor page
│   │   ├── layout.tsx             # Root layout (dark mode)
│   │   └── page.tsx               # Dashboard
│   ├── components/
│   │   ├── dashboard/             # Project grid, create dialog
│   │   ├── editor/                # Scene list, preview, properties, timeline
│   │   ├── music/                 # Music library, upload, selector
│   │   ├── shared/                # Header, empty state
│   │   └── ui/                    # shadcn/ui components
│   ├── lib/
│   │   ├── pipeline/              # Backend engines
│   │   │   ├── script-engine.ts   # LLM scene generation
│   │   │   ├── tts-engine.ts      # Edge TTS integration
│   │   │   ├── renderer.ts        # Puppeteer frame capture
│   │   │   ├── composer.ts        # FFmpeg composition
│   │   │   └── orchestrator.ts    # Main pipeline controller
│   │   ├── store.ts               # Zustand store
│   │   └── utils.ts               # Helpers
│   └── types/
│       └── project.ts             # TypeScript types
├── public/
│   └── music/                     # Uploaded audio files
├── output/                        # Generated videos
├── tmp/                           # Temporary render files
└── package.json
```

## API Reference

### POST /api/generate

Generate a video from a project.

**Request:**
```json
{
  "id": "project-uuid",
  "title": "How Transformers Work",
  "scenes": [...],
  "backgroundMusic": {...}
}
```

**Response:**
```json
{
  "success": true,
  "videoPath": "/path/to/output/project-uuid.mp4",
  "duration": 120,
  "scenesCount": 8
}
```

### POST /api/music

Upload a music track.

**Request:** `multipart/form-data` with `file` field

**Response:**
```json
{
  "id": "track-uuid",
  "filename": "track-uuid.mp3",
  "originalName": "ambient-study.mp3",
  "duration": 222,
  "size": 2201600
}
```

### GET /api/music

List all music tracks.

### DELETE /api/music/[id]

Delete a music track.

### GET /api/music/[id]/stream

Stream audio for preview playback.

## Troubleshooting

### "Ollama API error"
- Ensure Ollama is running: `ollama serve`
- Check model is installed: `ollama list`
- Verify OLLAMA_URL in `.env.local`

### "edge-tts not found"
- Install: `pip3 install edge-tts`
- Check path: `which edge-tts`
- Update path in `src/lib/pipeline/tts-engine.ts` if needed

### "FFmpeg error"
- Verify installation: `ffmpeg -version`
- Check codec support: `ffmpeg -codecs | grep libx264`
- Ensure libx264 is available for H.264 encoding

### Puppeteer fails to launch
- Install Chrome/Chromium
- On Linux: `sudo apt-get install chromium-browser`
- Check sandbox permissions

### Video has no audio
- Verify TTS generated audio: Check `tmp/[project-id]/scene-*/audio.mp3`
- Check FFmpeg logs in console

## Performance

- **Script Generation:** 10-30s (depends on LLM model)
- **TTS per scene:** 2-5s
- **Rendering per scene:** 5-15s (depends on duration)
- **Composition:** 10-30s (depends on total duration)
- **Total for 8 scenes:** ~3-5 minutes

## Roadmap

- [ ] GSAP animations in templates
- [ ] Mermaid diagram rendering
- [ ] Code syntax highlighting (Shiki)
- [ ] Motion Canvas integration (3D/math)
- [ ] Pexels/Pixabay stock footage
- [ ] Subtitle generation (.srt)
- [ ] Thumbnail generation
- [ ] YouTube chapter markers
- [ ] Batch generation (multiple videos)
- [ ] Progress streaming (WebSocket)
- [ ] Undo/redo in editor
- [ ] Keyboard shortcuts

## License

MIT

## Credits

Built with:
- [Next.js](https://nextjs.org/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Ollama](https://ollama.ai/)
- [Edge TTS](https://github.com/rany2/edge-tts)
- [Puppeteer](https://pptr.dev/)
- [FFmpeg](https://ffmpeg.org/)
