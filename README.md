# VoiceCraft AI
## 🚧 Project Status & Roadmap

> **Status: Active Development (Beta)**  
> VoiceCraft AI is an ongoing open-source project currently under active construction. Core features are live for testing at [rinkuaistudio.ai.studio](https://ai.studio), and new tools are being shipped regularly.

### Current Progress
- [x] Core Text-to-Speech (TTS) with multilingual and Indian English voice profiles
- [x] Solo Narrator & Multi-Speaker Dialogue Studio UI
- [x] Voice Cloning Studio & AI Chat Director prototype
- [x] Audio trimming, normalization, and batch queue workflow
- [ ] **In Progress:** Multi-format audio export (`WAV`, `MP3`, `OGG`) with bitrate controls
- [ ] **Planned:** Custom pause duration and emotion tags per dialogue line
- [ ] **Planned:** Pre-upload audio quality validation for voice cloning
- [ ] **Planned:** Automated GitHub Actions CI/CD testing and linting


VoiceCraft AI is a full-stack AI content studio for generating human-like voiceovers, dialogue, batch audio, clone voices, and cinematic AI video experiences using Gemini-powered creative workflows.

Built for creators, marketers, educators, and product teams, it combines text-to-speech, AI-assisted scripting, voice customization, and video storytelling in a single streamlined workspace.

## ✨ Features

- AI voice generation with multilingual and Indian English voice profiles
- Solo narrator mode for podcasts, explainers, and narration
- Dialogue studio for multi-speaker conversations and scenes
- Batch queue processing for large text-to-audio workloads
- Voice cloning studio for custom speaker profiles and style prompts
- AI chat director for prompt-driven creation and workflow suggestions
- AI video studio for cinematic scenes, motion, and storytelling prompts
- Video-to-text transcription workflow for repurposing content
- Audio trimming, extension, normalization, and export tools
- Project dashboard for organizing creative work and media assets

## 🧠 Tech Stack

- Frontend: React + TypeScript + Vite
- Styling: Tailwind CSS
- API layer: Google Gemini API
- Audio/video tooling: browser media tools, generated audio workflows, video editing helpers
- Runtime: Node.js + Express-compatible server setup

## 📦 Project Structure

```bash
.
├── src/
│   ├── components/
│   ├── context/
│   ├── types/
│   ├── utils/
│   ├── App.tsx
│   └── main.tsx
├── public/
├── .env.example
├── index.html
├── metadata.json
├── package.json
├── server.ts
├── tsconfig.json
├── vite.config.ts
├── LICENSE.tsx
├── README.md
└── firebase-applet-config.json
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or bun
- A Google Gemini API key from [Google AI Studio](https://aistudio.google.com/)

### Installation

1. Clone the repository:

```bash
git clone https://github.com/rinkudebbarma2016/voicecraft-ai.git
cd voicecraft-ai
```

2. Install dependencies:

```bash
npm install
```

3. Configure environment variables:

Copy the example file and add your keys:

```bash
cp .env.example .env
```

Then update `.env`:

```env
GEMINI_API_KEY="YOUR_GEMINI_API_KEY"
APP_URL="http://localhost:3000"
```

> In Google AI Studio / app-hosted environments, `GEMINI_API_KEY` and `APP_URL` may also be injected automatically by the platform runtime.

### Run the app

```bash
npm run dev
```

The app will start in development mode with Vite. Open the local URL shown in the terminal to interact with the studio.

### Production build

```bash
npm run build
```

### Preview the production build

```bash
npm run preview
```

## 🛠️ Available Scripts

```bash
npm run dev      # Start the Vite dev server
npm run build    # Build the production bundle
npm run preview  # Preview the built app
npm run lint     # TypeScript lint check (configured)
```

## 🔐 Environment Variables

| Variable | Required | Description |
| --- | --- | --- |
| `GEMINI_API_KEY` | Yes | API key used to access Google Gemini models |
| `APP_URL` | Recommended | Base URL for app endpoints and self-referential links |

## 🎯 Use Cases

- AI narration for YouTube and podcast content
- Voiceovers for product demos and tutorials
- Dialogue-based storytelling and synthetic interviews
- Multi-voice, multi-style audio generation for campaigns
- Storyboard and video conception workflows with AI prompts
- Educational and business explainers with polished voice output

## 🤝 Contributing

Contributions are welcome.

1. Fork the project
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a pull request

## 📄 License

This project is licensed under the MIT License. See `LICENSE.tsx` for details.

## 🌐 Repository

- GitHub: https://github.com/rinkudebbarma2016/voicecraft-ai

## 📝 Notes

VoiceCraft AI is designed as a creative studio and experimentation platform for generative audio and video workflows. It is especially useful for prototyping AI-first media generation pipelines with Gemini APIs.
