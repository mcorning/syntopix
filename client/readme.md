# syntopix/README.md

## 🧠 Overview

Syntopix is a monorepo containing a Vue 2 + Vuetify frontend (`client/`) and a Node + Redis backend (`server/`). It's powered by `pnpm` for fast installs and clean workspaces.

---

## 📁 Folder Structure

```sh
syntopix/
├── client/          # Vue frontend (Vuetify 2.7, Socket.IO, TinyMCE, etc.)
├── server/          # Node backend (Express, Redis, ImageKit)
├── pnpm-workspace.yaml
├── pnpm-lock.yaml
├── syntopix.code-workspace   # VS Code multi-root workspace
└── scripts/bootstrap.sh      # One-shot clean & rebuild
```

---

## 🧱 Requirements

- Node 18 LTS or higher
- [pnpm](https://pnpm.io/) installed globally
- VS Code (optional but recommended)

```bash
npm install -g pnpm
```

---

## 🚀 Setup Instructions

```bash
# Clone the repo
cd ~/Documents/GitHub/tqr

# Open workspace in VS Code
code syntopix/syntopix.code-workspace

# First-time install for both client and server
pnpm install
```

---

## 🔧 Development Scripts

From workspace root:

```bash
# Run client only
pnpm --filter client run serve

# Run server only
pnpm --filter server run dev

# Run both in parallel (via dev:all)
pnpm run dev:all

# Install new packages
pnpm add lodash --filter client
```

Add this to root `package.json` to enable:

```json
"scripts": {
  "dev:all": "concurrently \"pnpm --filter client run serve\" \"pnpm --filter server run dev\""
}
```

Then install:

```bash
pnpm add -D concurrently
```

---

## 🛠 Troubleshooting

### Common Gotchas:

- Always open `syntopix.code-workspace`, not just the folder
- Use only `pnpm` (not `npm install`)
- Delete any reappearing `syntopix/syntopix` folders

---

## 🔄 Rebuild All (Optional Script)

```bash
bash ./scripts/bootstrap.sh
```

---

# scripts/bootstrap.sh

#!/bin/bash

set -e

echo "> Cleaning node_modules and lockfiles..."
rm -rf client/node_modules client/package-lock.json
rm -rf server/node_modules server/package-lock.json
rm -rf node_modules pnpm-lock.yaml

echo "> Fresh install with pnpm workspaces..."
pnpm install

echo "> All done. You can now run:
pnpm --filter client run serve
pnpm --filter server run dev
pnpm run dev:all"
