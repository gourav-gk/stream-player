# 🎬 hls-stream-player

A lightweight, customizable **React video player** that supports both **HLS (.m3u8)** and regular **MP4** sources — built with `hls.js`.

---

## 🚀 Features

- ✅ Auto-detects and plays both HLS (`.m3u8`) and MP4 videos  
- ✅ Built-in fallback for Safari’s native HLS support  
- ✅ Minimal and responsive UI  
- ✅ Easy to style — just import the bundled CSS  
- ✅ TypeScript support

---

## 📦 Installation

```bash
npm install hls-stream-player
# or
yarn add hls-stream-player
```

---

## 🧩 Usage

```tsx
import React from "react";
import { Player } from "hls-stream-player";
import "hls-stream-player/dist/stream-player.css";

export default function App() {
  return (
    <div style={{ maxWidth: 800, margin: "auto" }}>
      <h2>My HLS Video Player</h2>
      <Player
        videoSrc="https://europavideostorage.blob.core.windows.net/agoravideos/agora/recordings/a3b577f5c943ad95d33140826b6c9d02_vfshjkj.m3u8?sp=racwd&st=2025-10-13T16:42:00Z&se=2026-12-01T00:57:00Z&spr=https&sv=2024-11-04&sr=c&sig=HWzpPKRoYPrLYE1bjxhIh1kPyJ%2FwsD7hqWM5hW%2FtVoI%3D"
        poster="https://peach.blender.org/wp-content/uploads/title_anouncement.jpg"
      />
    </div>
  );
}
```

---

## 🧠 Props

| Prop              | Type                                                          | Description                                           |
| ----------------- | ------------------------------------------------------------- | ----------------------------------------------------- |
| `id`              | `string`                                                      | Unique ID for each player instance.                   |
| `src`             | `string`                                                      | The video source URL (supports HLS `.m3u8` and MP4).  |
| `poster`          | `string` *(optional)*                                         | Thumbnail image shown before playback starts.         |
| `captions`        | `{ src: string; lang: string; label: string }[]` *(optional)* | List of caption tracks with URL, language, and label. |
| `previewImg`      | `string` *(optional)*                                         | Image shown when hovering or previewing video.        |
| `width`           | `string` *(optional)*                                         | Custom width (e.g. `"100%"`, `"800px"`).              |
| `maxHeight`       | `string` *(optional)*                                         | Limit video height for responsive layouts.            |
| `setting`         | `boolean` *(optional)*                                        | Toggle to show or hide player settings UI.            |
| `backgroundColor` | `string` *(optional)*                                         | Background color behind the video area.               |
| `theater`         | `string` *(optional)*                                         | Theater mode enable.                                  |

---

## ⚙️ HLS Support

`hls-stream-player` uses [`hls.js`](https://github.com/video-dev/hls.js) under the hood.  
If your video URL has query params (and doesn’t end with `.m3u8`), the player automatically detects MIME type based on the response content — no filename check required.

---

## 🧰 Example for MP4

```tsx
<Player
  videoSrc="http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
  poster="https://peach.blender.org/wp-content/uploads/title_anouncement.jpg"
/>
```

---

## 🛠️ Development Setup

If you’re contributing or debugging locally:

```bash
git clone https://github.com/<your-username>/hls-stream-player.git
cd hls-stream-player
npm install
npm run dev
```

To test changes in another project without publishing:

```bash
npm link
cd ../your-project
npm link hls-stream-player
```

---

## 🧾 License

MIT © [Gourav](mailto:kgourav038@gmail.com)

---

## 💬 Feedback & Contributions

Found a bug or have a feature idea?  
Open an issue or PR on [GitHub](https://github.com/<your-username>/hls-stream-player) — contributions are always welcome!