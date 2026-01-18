# CHUDLIFE

CHUDLIFE is a React Three Fiber / Rapier web-based combat game featuring custom AI-generated player characters. The project integrates advanced AI APIs to automate the pipeline from a single image to a fully rigged and animated playable character.

## 🚀 Character Creation Pipeline

The core innovation of CHUDLIFE is its fully automated, API-driven character creation pipeline:

1.  **Image Upload**: User uploads a photo.
2.  **3D Generation**: [Hunyuan 3D v3](https://fal.ai/models/fal-ai/hunyuan3d-v3) converts the image into a high-quality GLB model.
3.  **Auto-Rigging**: [Meshy.ai](https://www.meshy.ai/) API rigs the generated model while preserving textures and UVs.
4.  **Animation**: Pre-made humanoid animations (Walking, Attack, Emote) are applied programmatically at runtime using Three.js animation retargeting.
5.  **Game Integration**: The rigged and animated model is immediately available as a playable character in the game world.

## 🛠 Tech Stack

### Frontend
- **Framework**: React with TypeScript
- **3D Rendering**: [React Three Fiber](https://github.com/pmndrs/react-three-fiber)
- **Physics**: [Rapier](https://rapier.rs/docs/user_guides/react/getting_started/) via `@react-three/rapier`
- **3D Utilities**: `@react-three/drei`
- **State Management**: Zustand
- **Build Tool**: Vite

### Backend
- **Runtime**: Node.js with Express
- **Language**: TypeScript
- **AI Integrations**: fal.ai (Hunyuan 3D), Meshy.ai

## 📂 Project Structure

```text
CHUDLIFE/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # Game components (Arena, Boss, Player, etc.)
│   │   ├── hooks/          # Custom hooks (Character controller)
│   │   └── stores/         # Zustand game state
│   └── public/             # 3D Assets and Animations
└── server/                 # Backend Node.js application
    └── src/
        ├── routes/         # API endpoints for character generation
        └── services/       # Integration services for Hunyuan and Meshy
```

## ⚡ Getting Started

### Prerequisites
- Node.js (v18+)
- API Keys for **fal.ai** and **Meshy.ai**

### Configuration

Create a `.env` file in the `server` directory:

```env
# server/.env
FAL_KEY=your_fal_ai_key_here
MESHY_API_KEY=your_meshy_api_key_here
PORT=3001
```

### Installation

1. Clone the repository
2. Install dependencies for the root, client, and server:
   ```bash
   npm run install:all
   ```

### Development

Start both the client and server concurrently:
```bash
npm run dev
```

- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:3001

### Scripts

- `npm run dev`: Starts client and server in development mode.
- `npm run build`: Builds both client and server for production.
- `npm run lint`: Runs linting on the client.

## 🎮 Game Controls
- **WASD / Arrow Keys**: Movement
- **Space**: Jump
- **Mouse**: Camera control
- **Left Click**: Attack (once character is loaded)

## ⚖️ License
MIT
