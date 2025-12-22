# Jonadab Uroh | Antigravity Portfolio

![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![GSAP](https://img.shields.io/badge/GSAP-3.12-88CE02?style=for-the-badge&logo=greensock&logoColor=white)
![Gemini](https://img.shields.io/badge/Google%20Gemini-AI-8E75B2?style=for-the-badge&logo=google&logoColor=white)

> **"Antigravity" Portfolio** – A high-performance, immersive developer portfolio featuring physics-based animations, smooth inertial scrolling, and a context-aware AI assistant powered by Google Gemini.

## 🌌 The Aesthetic
This project embodies an "Antigravity" design philosophy:
*   **Weightless Motion:** Elements float, orbit, and react to magnetic cursor fields.
*   **Inertial Scrolling:** Powered by `Lenis` for a fluid, luxury feel.
*   **Glassmorphism & Grain:** High-end translucent UI with subtle noise overlays.
*   **Typographic Precision:** Huge, mask-clipped typography for bold statements.

## ✨ Key Features

### 🧠 Intelligent AI Assistant
Integrated directly into the experience (`Cmd+K` or floating button), the AI assistant uses **Google's Gemini 3 Flash Preview** model.
*   **Context Aware:** It knows about Jonadab's specific projects, skills, and contact info (injected via System Instructions).
*   **Streaming Chat:** Real-time conversational interface.
*   **Privacy:** API keys are handled via environment variables.

### 🎮 Interactive UX
*   **Command Palette (`Cmd+K`):** Keyboard-first navigation to jump between sections, toggle themes, or contact.
*   **Magnetic Cursor:** Custom cursor that snaps to interactive elements.
*   **Orbiting Skills:** 3D-simulated orbital animation for tech stack visualization.
*   **Theme Engine:** Smooth transition between Dark (Void) and Light (Aether) modes.

## 🛠️ Tech Stack

*   **Core:** React 19, TypeScript, Vite
*   **Styling:** Tailwind CSS, CSS Variables
*   **Animation:** GSAP (GreenSock), ScrollTrigger
*   **Physics/Scroll:** @studio-freight/lenis, Custom Hooks (`useMagnetic`)
*   **AI Backend:** @google/genai SDK
*   **Icons:** Lucide React

## 🚀 Getting Started

### Prerequisites
*   Node.js (v18+)
*   Google Gemini API Key ([Get it here](https://aistudio.google.com/))

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/yourusername/jonadab-uroh-portfolio.git
    cd jonadab-uroh-portfolio
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Environment Setup**
    Create a `.env` file in the root directory:
    ```env
    API_KEY=your_actual_google_gemini_api_key
    ```

4.  **Run Development Server**
    ```bash
    npm run dev
    ```

## 📂 Project Structure

```
├── components/      # UI Components (Hero, Work, AI Assistant, etc.)
├── hooks/           # Custom Logic (useMagnetic)
├── assets/          # Static Images & Icons
├── constants.ts     # Data Source (Projects, Testimonials, Skills)
├── types.ts         # TypeScript Interfaces
├── App.tsx          # Main Layout & Routing Logic
└── vite.config.ts   # Build Config & Env Mapping
```

## 📦 Deployment (Render)

This project is optimized for static hosting.

1.  Push code to GitHub.
2.  Create a **Static Site** on [Render](https://render.com).
3.  **Build Command:** `npm install && npm run build`
4.  **Publish Directory:** `dist`
