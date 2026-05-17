# 📡 TransLocal - Offline-First Local File Sharing

TransLocal is a production-ready, ultra-fast, offline-first local file-sharing web application inspired by LocalSend and Snapdrop. It allows users to transfer folders, files, pasted clipboard text/links, and clipboard images directly between devices (Mobile ↔ Laptop ↔ Desktop) on the same local network (WiFi or Hotspot) with **absolute zero cloud uploads** and **zero user registration**.

Built with a glassmorphic modern UI and utilizing direct **WebRTC DataChannels** with a robust backpressure chunking system, it streams data directly between device RAM at native gigabit local network speeds.

---

## 🚀 Key Features

*   **Zero-Cloud P2P transfers**: Files are transferred directly between devices using secure WebRTC DataChannels. No file content ever touches our signaling servers.
*   **Automatic Local Peer Discovery**: Auto-detects nearby active devices sharing the same public or local IP router network.
*   **Offline-LAN Capable**: The app works completely offline! By registering as a Progressive Web App (PWA), the client shell remains fully cached and functional inside routers with no active internet access.
*   **Pairing QR Codes & Room Codes**: Provides a fallback room code matching protocol and mobile scanning QR codes so cross-platform devices can pair instantly.
*   **Direct Clipboard Synced Board**: Sync paste board text, links, and temporary chats between connected devices.
*   **Ctrl+V Image Sharing**: Press `Ctrl+V` (or standard paste) in the Clipboard pane to instantly send system-clipboard image buffers to another device without creating temp files!
*   **Interactive Sonar Radar Grid**: Elegant animated sonar scan maps showing nearby peers, shifting into responsive lists on small mobile device screens.
*   **Flow Control & Chunk Streaming**: Utilizes a highly optimized 64KB chunk binary slicing strategy that respects the DataChannel's `bufferedAmountLow` threshold. This prevents browser tab memory leaks, enabling gigabytes of files to stream safely.
*   **E2E Privacy & Malware Filtering**: Filters malware extensions, sanitizes filename inputs, and restricts peer visibility.

---

## 🛠️ Tech Stack

*   **Frontend**: Next.js 15 (App Router, React 19, TypeScript)
*   **Styling**: Tailwind CSS v4 + Custom glassmorphic properties
*   **State Management**: Zustand
*   **P2P Connection**: WebRTC (`RTCPeerConnection` + `RTCDataChannel`)
*   **Realtime Signaling**: WebSocket Server (`ws` + Node.js Express)
*   **PWA Shell**: Service Worker Caching (`sw.js` + `manifest.json`)
*   **Pairing Engine**: Client-side QR Code compiler (`qrcode` vector arrays)

---

## 📁 Folder Structure

```text
translocal/
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Actions CI/CD Pipeline
├── public/
│   ├── favicon.ico             # App Favicon
│   ├── manifest.json           # PWA Web Manifest
│   ├── sw.js                   # Custom dynamic offline Service Worker
│   └── icons/
│       ├── icon-192.png        # PWA Icon 192px
│       └── icon-512.png        # PWA Icon 512px
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── health/
│   │   │       └── route.ts    # Next.js native health-checking route
│   │   ├── globals.css         # Styling system & Sonar animations
│   │   ├── layout.tsx          # PWA providers, meta tags, and theme config
│   │   └── page.tsx            # Main App Switcher (SPA layout)
│   ├── components/
│   │   ├── about-tab.tsx       # System parameters & Pillars info
│   │   ├── history-tab.tsx     # Transfer history with instant Media previews
│   │   ├── navbar.tsx          # Sticky Glass header & Peer online badges
│   │   ├── pwa-provider.tsx    # SW installer, network online/offline listeners
│   │   ├── radar-panel.tsx     # Sonar Radar dashboard with Drag & Drop
│   │   ├── settings-tab.tsx    # Rename profiles, change emojis, scan QR, pair rooms
│   │   ├── shared-clipboard.tsx# Link syncing, temporary chat, Ctrl+V images
│   │   └── transfer-modal.tsx  # Flow metrics speed (MB/s), ETA, accept prompts
│   ├── services/
│   │   ├── signaling.ts        # Client WebSocket Introduction engine
│   │   └── webrtc.ts           # WebRTC DataChannel chunking manager
│   ├── signaling/
│   │   ├── Dockerfile          # Signaling server container profile
│   │   └── server.js           # Express + ws Signaling Server script
│   └── store/
│       └── useAppStore.ts      # Zustand Central Client Store (Persisted)
├── .env.example                # Env template config
├── .env.local                  # Local development config
├── docker-compose.yml          # Local multi-service orchestration
├── Dockerfile                  # Multi-stage Next.js frontend profile
├── next.config.ts              # Output standalone settings
├── package.json                # Project configurations & scripts
└── vercel.json                 # PWA & CORS configurations for Vercel
```

---

## 💻 Local Development Setup

To run both the Next.js frontend and the Signaling server locally:

1.  **Clone the Repository** and navigate into the folder:
    ```bash
    cd translocal
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Boot both servers concurrently**:
    ```bash
    npm run dev
    ```
    This script will concurrently launch:
    *   **Next.js Developer Server** on: [http://localhost:3000](http://localhost:3000)
    *   **WebSocket Signaling Server** on: `ws://localhost:5000`

---

## 🐳 Docker Deployment

For offline LAN setups (e.g. running on a local offline computer, allowing anyone on the WiFi network to connect), you can deploy both services instantly:

1.  Start the containers:
    ```bash
    docker-compose up -d --build
    ```
2.  Open [http://localhost:3000](http://localhost:3000) on any local network browser!
3.  Access the signaling heartbeat terminal at `ws://localhost:5000`.

---

## 🌍 Free Hosting Setup

### 1. Frontend: Deploy on Vercel (100% Free)
1. Push your project code to **GitHub**.
2. Go to [Vercel](https://vercel.com) and click **Add New Project**.
3. Import your `translocal` repository.
4. Keep the framework preset as **Next.js**.
5. Add the environment variable:
   *   `NEXT_PUBLIC_SIGNALING_URL`: (Paste your production Signaling URL, e.g. `wss://translocal-signaling.onrender.com`)
6. Click **Deploy**. Vercel will build and host your app with global edge SSL.

### 2. Backend: Deploy Signaling Server on Render (100% Free Tier)
1. Open [Render](https://render.com) and sign in.
2. Click **New** -> **Web Service**.
3. Link your GitHub repository.
4. Configure these fields:
   *   **Name**: `translocal-signaling`
   *   **Environment**: `Node`
   *   **Build Command**: `npm install` (or keep empty if using a separate subfolder, but root package.json has a standard run script)
   *   **Start Command**: `node src/signaling/server.js`
   *   **Instance Type**: `Web Service (Free)`
5. Click **Create Web Service**. Once healthy, copy your Render hostname URL (e.g., `https://translocal-signaling.onrender.com`).
6. Swap the prefix from `https://` to `wss://` (e.g. `wss://translocal-signaling.onrender.com`) and paste this value as your Vercel `NEXT_PUBLIC_SIGNALING_URL` variable.

---

## 🔒 Security Best Practices Implemented

*   **Malware Extensions filtering**: Automatically alerts users and blocks malicious file formats (e.g. `.exe`, `.bat`, `.sh`, `.scr`, `.cmd`) before transferring.
*   **Filename Sanitization**: Sanitizes incoming filenames using regex rules, avoiding directory injection attacks (`../`, `..\\`) and malicious characters.
*   **No File Retention**: Files are streamed direct-to-RAM via DTLS-secured WebRTC channels. No third-party database, AWS storage bucket, or caching disk is ever utilized.
*   **CORS & Rate Limiting**: The signaling websocket server utilizes subnet grouping, preventing cross-IP scanning by unrelated users.

---

## ⚙️ Performance Tuning & Troubleshooting

### Large Files Stream Failures
If large gigabyte transfers drop or stall:
1.  **Browser Flow Control**: Ensure neither device has minimised their browser tab. Modern browsers throttle background JavaScript execution, causing our WebRTC buffered queues to slow down. Keep tabs focused for massive transfers.
2.  **LAN congestion**: In congested public WiFi, WebRTC UDP packets can drop. Use the manual **Room Code** fallback to re-establish secure channels.

### Peer Discovery Issues
If devices are on the same WiFi but don't show up on the Radar:
1.  **Public IP mismatches**: In dual-band routers (2.4GHz vs 5GHz), the router might assign different networks. Type a matching **Room Code** (e.g. `PAIR`) in Settings to manually bridge the devices together!
2.  **Offline LAN signaling**: If you don't have internet, your devices won't resolve Render/Vercel. Start the local signaling server on one machine (`npm run signaling`), look at its displayed LAN IP (e.g. `ws://192.168.1.15:5000`), and paste this URL into Settings -> Signaling Endpoint on all other devices!

---

## 🗺️ Upgrade Roadmap & Scaling

1.  **Local UDP Multicasting (mDNS)**: Support standard native local sub-networking discovery APIs if browser specs expand.
2.  **Folder Compression**: Automatically compile multi-file drops into a single stream zip archive on-the-fly inside the browser using `JSZip` before WebRTC chunking.
3.  **Local Signaling Broadcast**: Package the Signaling Server as an Electron Desktop helper so users can spin up LAN nodes with single clicks.
