# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CHUDLIFE is a React Three Fiber / Rapier web-based combat game featuring custom AI-generated player characters.

## Character Creation Pipeline

**Critical Requirement:** The entire pipeline must be fully automated via APIs - no manual steps.

1. **Image Upload** - User uploads a photo of themselves
2. **3D Generation** - Hunyuan 3D v3 converts the image to a GLB model
3. **Auto-Rigging** - Meshy.ai API rigs the model (must preserve textures/UVs - test required)
4. **Animation** - Pre-made Mixamo animation files applied programmatically at runtime
5. **Game Integration** - Rigged model becomes a playable character

### Rigging Fallback Options (if Meshy loses textures)
- **Anything World API** - `/rig` endpoint, accepts textured meshes
- **Tripo AI API** - Auto-rigging via API, exports GLB/FBX

### Required Animations
- Walking/locomotion
- Basic attack
- Special attack
- Emote

### Animation Strategy
Mixamo animations cannot be used for auto-rigging (requires manual marker placement), but animation FILES (FBX) can be downloaded once and applied programmatically to any compatible humanoid rig using Three.js animation retargeting.

## Tech Stack

- **Frontend Framework**: React with TypeScript
- **3D Rendering**: React Three Fiber (@react-three/fiber)
- **Physics**: Rapier (@react-three/rapier)
- **3D Utilities**: @react-three/drei
- **Animation**: useAnimations hook from drei, animation retargeting
- **AI APIs**: Hunyuan 3D v3, Meshy.ai

## Architecture Decisions

- Use pre-made online 3D models for game environment and non-player assets
- Custom AI pipeline only for player character generation
- GLB format as the standard for 3D models
- Full automation - all API-driven, no manual intervention

## API Integration Points


- **Hunyuan 3D v3**: Image-to-3D conversion (outputs GLB)
- **Meshy.ai**: Auto-rigging API (rigging only, not in-app animations)

## Development Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run linter
npm run lint
```
