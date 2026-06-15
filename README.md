# Aoroza

A minimal markdown editor. Offline-first, keyboard-optimized, and open source with no vault, no cloud, no accounts, and no subscriptions.

## Features

- **WYSIWYG Markdown** — edit with TipTap, see formatting in real time
- **Source Mode** — toggle raw markdown view (`Ctrl+Shift+M`)
- **Slash Commands** — type `/` for quick block insertion (headings, lists, tables, math, code blocks)
- **Math Support** — KaTeX inline and block math rendering
- **Code Blocks** — syntax highlighting via highlight.js, Mermaid diagrams
- **Task Lists** — checkable todo items
- **Tables** — insert and edit tables
- **AI** — inline text generation with Pi (`Edit with Pi` in command palette)
- **Command Palette** — `Ctrl+P` for file operations, settings, AI, and more
- **Auto Save** — saves to disk on every change
- **Auto Update** — checks for updates on launch, downloads and installs automatically

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl+P` | Command palette |
| `Ctrl+O` | Open file |
| `Ctrl+S` | Save |
| `Ctrl+N` | New file |
| `Ctrl+F` | Search |
| `Ctrl+Shift+M` | Toggle markdown source |
| `Ctrl+Shift+O` | Toggle outline |
| `Ctrl+,` | Settings |

## Development

```bash
npm install
npm run tauri dev
```

## Build

```bash
npm run tauri build
```

## Tech Stack

- [Tauri 2](https://tauri.app) (Rust + WebView)
- [React 19](https://react.dev) + [TypeScript](https://www.typescriptlang.org)
- [TipTap](https://tiptap.dev) editor
- [Tailwind CSS 4](https://tailwindcss.com)
- [Pi](https://github.com/earendil-works/pi-coding-agent) AI assistant

## Credits

Forked from [Scratch](https://github.com/erictli/scratch) 0.10.0, crafted by Eric Li.
