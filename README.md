# WLED Matrix Editor 🎨✨

Turn your WLED 2D matrix into a pixel art canvas! This slick little web app lets you create, draw, and beam your designs straight to your LED matrix in real-time.

![WLED Matrix Editor Demo](wled-matrix-editor.png)

## ✨ Features

### 🖌️ Drawing Tools

- **Pixel-perfect drawing** - Click and drag to paint your masterpiece
- **Multiple brush sizes** - Choose from two brush sizes
- **Right-click to erase** - Quick erasing without switching tools
- **Keyboard shortcuts** - Power user? We've got you covered

### 🎨 Color & Effects

- **Full RGB color picker** - Choose any color with RGB sliders
- **Color history** - Quick access to recently used colors
- **Gradient generator** - Create linear, radial, or elliptical gradients across your matrix
- **Image uploader** - Import images and automatically resize them to fit your matrix

### 🔄 WLED Integration

- **Live updates** - See your changes instantly on your LED matrix
- **Auto-detection** - Automatically detects your matrix dimensions
- **Dark mode** - Easy on the eyes for late-night creative sessions

### 💾 Storage & Sharing

- **Auto-save** - Never lose your work with automatic localStorage saving
- **JSON presets** - Copy JSON data for use in WLED presets

## 🚀 Getting Started

### Option 1: Run locally

1. Clone this repo
2. Install dependencies with `pnpm install`
3. Run the dev server with `pnpm dev`
4. Build for production with `pnpm build`

### Option 2: One-file version

Download the single-file HTML from the releases section and upload to your wled controller <your-wled-ip>/edit

## ⚙️ Configuration

First time? Just enter your WLED device IP in the settings panel (gear icon). The app will:

1. Connect to your WLED device
2. Auto-detect your matrix dimensions
3. Start mirroring your drawing to the LEDs in real-time

## 🎮 Controls & Tips

- **Pen tool (P)**: Click or drag to draw
- **Eraser (E)**: Erase pixels
- **Brush size (B)**: Toggle brush size, or use [ and ] keys
- **Undo (Ctrl+Z)**: Revert last action
- **Clear (Ctrl+Shift+C)**: Clear the entire canvas

## 🛠️ Tech Stack

- Vue 3 with TypeScript
- Tailwind CSS
- Vite for builds

## 🤝 Contributing

Got ideas? Found bugs? PRs welcome! Or just open an issue.

## 📝 License

MIT - do whatever you want with it! Build something cool!

---

Made with ❤️ for the WLED community. Now go make something awesome!
