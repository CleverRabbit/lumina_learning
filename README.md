# Lumina Learning Platform

## Deployment Instructions

This application is designed to be deployed using Docker.

### Prerequisites
- Docker
- Docker Compose

### One-Command Deployment
Run the following command in the root directory:
```bash
docker compose up --build
```

### Manual Setup
1. Install dependencies: `npm install`
2. Start development server: `npm run dev`
3. Build for production: `npm run build`
4. Start production server: `npm run start`

## Architecture
- **Frontend**: React 19 + Vite + Tailwind CSS 4
- **Backend**: Express 4 (API Proxy & Static Serving)
- **State**: Zustand with persistence
- **AI**: Gemini 2.0 Flash (Native) & OpenRouter (Proxy)

## Features
- Adaptive learning path
- Gamified XP and Level system
- Dynamic lesson generation via LLM
- Offline mode for manual LLM interaction
- Learning Diary (System logs)
- Component self-diagnosis
- Exportable logs and progress
