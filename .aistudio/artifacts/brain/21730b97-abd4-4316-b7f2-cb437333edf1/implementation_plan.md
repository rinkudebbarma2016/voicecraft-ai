# Device Media Ingestion & Google Vids Creation Suite

Comprehensive device media uploading hub supporting local images, video clips, and audio tracks alongside Google Vids-inspired video production tools: AI voiceover narration sync, teleprompter recording, animated lower thirds, and seamless scene transitions.

## User Review & Critical Decisions

> [!IMPORTANT]
> Based on your confirmed choices in Phase 1:
> - **Supported Media Formats**: Direct device upload for **Images** (PNG, JPG, JPEG, WEBP, SVG), **Video Clips** (MP4, WEBM, MOV), and **Custom Audio Tracks** (MP3, WAV, M4A, OGG).
> - **Google Vids Highlighted Capabilities**: **AI voiceover narration synchronization**, **live teleprompter recording studio**, and **animated lower thirds, titles & transitions**.
> - **Dropzone & Upload Hub**: Integrated dual upload interface featuring an active drag-and-drop canvas dropzone, a device file picker button, and an expandable device media drawer with instant previews.

---

## 1. Overview & Core Concept

### What It Delivers
This upgrade transforms the **Image to Video / VidsCraft Studio** into a complete Google Vids-grade creative suite. Creators can seamlessly upload media from their local device—photos, graphics, recorded video B-roll clips, and custom audio tracks—and assemble them into professional video presentations with automated voiceovers, animated lower thirds, and synchronized teleprompter narration.

### Target Audience & Persona
- **Creators & Presenters**: Recording pitches, product walkthroughs, training modules, and cinematic promos using their own visual assets and audio recordings.
- **Teams & Educators**: Transforming slides, product photos, and lecture notes into engaging videos with synchronized voiceovers and professional typography.

### Key Value
- **Zero-Friction Device Ingestion**: Drag and drop any image, video clip, or audio track directly from your desktop or phone without external cloud hosting dependencies.
- **Google Vids Presentation Suite**: Automated storyboard scenes, AI narration voice generation, live teleprompter recording, lower-third overlays, and smooth scene transitions.

---

## 2. User Experience & Visual Design

### Key User Flows

```
┌─────────────────┐     ┌───────────────────────┐     ┌────────────────────────┐
│  Device Media   │ ──> │   Smart Ingestion     │ ──> │   Storyboard Assembly  │
│  (Drag / Browse)│     │  (Type Auto-Detect)   │     │  (Scenes + Transitions)│
└─────────────────┘     └───────────────────────┘     └────────────────────────┘
                                                                   │
                                                                   ▼
┌─────────────────┐     ┌───────────────────────┐     ┌────────────────────────┐
│ Final Render &  │ <── │ Teleprompter / Voice  │ <── │ Lower Thirds & Styling │
│ 4K Export       │     │ (AI Sync or Mic Rec)  │     │ (Titles, Brand Colors) │
└─────────────────┘     └───────────────────────┘     └────────────────────────┘
```

1. **Direct Device Ingestion**:
   - The user sees a high-visibility **Device Upload Dropzone** in the center canvas and a persistent **"Upload from Device"** button in the studio toolbar.
   - Dragging any files over the canvas illuminates a reactive cyan/emerald drop halo with format hints (`Drop PNG, JPG, MP4, MP3, WAV...`).
   - Clicking the file picker opens the native OS dialog with multi-file support.

2. **Multi-Format Processing**:
   - **Images**: Added directly to the active scene or as a new storyboard slide with automatic motion (zoom-in, pan-right, orbit).
   - **Video Clips**: Ingested with duration extraction, thumbnail generation, and audio extraction; playable directly in the storyboard sequence.
   - **Audio Tracks**: Attached as background music or synchronized scene narration with automatic waveform visualization and audio ducking controls.

3. **Google Vids Creation Suite**:
   - **AI Voiceover Narration Sync**: Type or edit scene scripts; click "Generate Neural Narration" to synthesize high-clarity voiceovers with word-level timing.
   - **Live Teleprompter Recording**: Read scripts on a floating, scrolling prompter while recording webcam or microphone audio directly into the timeline.
   - **Animated Lower Thirds & Titles**: Add customizable graphic banners (speaker name, title, key takeaway) with 3 position presets (`bottom-left`, `center-card`, `top-banner`).
   - **Scene Transitions**: Seamless cross-dissolve, slide, fade to black, and zoom transitions between clips.

### Visual Identity & Theme
- **Surface & Canvas**: Deep slate foundation (`bg-zinc-950` / `bg-zinc-900`) with subtle hairline dividers (`border-zinc-800`), following strict single-elevation depth.
- **Accents**: Emerald (`#10B981`) and Cyan (`#06B6D4`) primary action accents for rendering and recording; neutral white for text readability.
- **Typography**: Clean display sans typography for titles (`Plus Jakarta Sans`), balanced body measure, and tabular numerals (`font-mono tabular-nums`) for timestamps and durations.
- **Zero-Slop Discipline**: No decorative pulsing dots, no fake status indicators, no pill badge sandwiches. Clean typography with bullet/slash separators.

---

## 3. Key Product Decisions & Trade-Offs

| Decision Area | Chosen Approach | Rationale & Trade-Offs |
| :--- | :--- | :--- |
| **Media Ingestion Engine** | Client-side `FileReader` + `URL.createObjectURL` with blob caching | Immediate playback latency without waiting for server roundtrips; 100% private and offline-capable. |
| **Video Clip Handling** | HTML5 `<video>` extraction for frame captures & playback sync | Allows mixed-media timelines (combining static image animations with actual recorded video clips). |
| **Audio Track Management** | Dual-track mixer (Scene Narration + Background Music) with auto-ducking | Background music automatically dips volume when AI voiceover or user mic audio is speaking. |
| **Teleprompter Integration** | Native Web Speech API + Canvas recording integration | Allows presenters to record themselves while maintaining direct eye contact with their script. |

---

## 4. Technical Architecture & Data Strategy

### Component Hierarchy & Data Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            ImageToVideoStudio                               │
│                                                                             │
│  ┌──────────────────────────┐  ┌─────────────────────────────────────────┐  │
│  │   Studio Header & Bar    │  │  Active Storyboard Canvas / Dropzone    │  │
│  │   - Mode Switcher        │  │  - Interactive File Drop Zone           │  │
│  │   - Device Upload Button │  │  - Live Motion / Clip Preview           │  │
│  │   - Teleprompter Trigger │  │  - Lower-Third Graphic Overlay          │  │
│  └──────────────────────────┘  └─────────────────────────────────────────┘  │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                     Storyboard Timeline Shelf                         │  │
│  │  - Scene Slides (Images / Videos)  - Transition Selectors (Dissolve)  │  │
│  │  - Custom Audio Track Stems        - Narration Script & AI Voice Sync │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌──────────────────────────┐  ┌─────────────────────────────────────────┐  │
│  │ TeleprompterModal        │  │ DeviceMediaDrawer / BatchUploader       │  │
│  │ - Scrolling Script       │  │ - Multi-file drop queue                 │  │
│  │ - Mic / Camera Stream    │  │ - Format categorization & quick insert  │  │
│  └──────────────────────────┘  └─────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Data Model Additions
```typescript
export interface DeviceMediaAsset {
  id: string;
  name: string;
  type: 'image' | 'video' | 'audio';
  url: string;
  blob?: Blob;
  sizeBytes: number;
  duration?: number;
  dimensions?: { width: number; height: number };
  uploadedAt: number;
}

export interface StoryboardScene {
  id: string;
  title: string;
  mediaType: 'image' | 'video';
  mediaUrl: string;
  mediaName: string;
  motion: ImageToVideoMotion;
  atmosphere: ImageToVideoAtmosphere;
  duration: number;
  transition: 'cut' | 'cross-dissolve' | 'slide-left' | 'fade-black' | 'zoom-in';
  audioUrl?: string;
  audioName?: string;
  narrationScript: string;
  lowerThird?: {
    enabled: boolean;
    headline: string;
    subheadline: string;
    position: 'bottom-left' | 'center' | 'top-banner';
  };
}
```

### Verification & Testing Plan
1. **Device Ingestion Test**: Drag and drop single and multiple files (PNG, JPG, MP4, MP3) onto the dropzone; verify immediate rendering without UI stutter.
2. **Audio Track Synchronization**: Upload custom voiceover/music files; verify audio playback during scene transitions and video export.
3. **Google Vids Feature Verification**:
   - Test teleprompter script scrolling and mic recording.
   - Verify animated lower third rendering with custom text and position.
   - Test AI voiceover generation and sync with slide durations.
4. **Build & Lint Verification**: Run `compile_applet` and `lint_applet` to ensure zero compilation or type errors.
