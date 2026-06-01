# ✦ Personal Hub

![Personal Hub Logo](public/vite.svg)

> A modern, premium, "vibe-coded" command center for your digital life. 

**Personal Hub** is a cross-platform, AI-powered productivity suite designed for individuals who demand a fast, beautiful, and fully-featured digital workspace. Built in 2026, it merges aesthetics and functionality to offer an unparalleled user experience, running seamlessly on Android, Desktop (Linux/Windows/macOS), and the Web.

---

## 🔥 Features

- **🤖 AI Schedule Assistant (Powered by Gemini):** Automatically build an optimized daily schedule around your classes, to-do lists, and weekly goals with one click.
- **📷 AI Timetable Scanner:** Upload a photo of your schedule and Gemini automatically parses it into your weekly classes.
- **✨ Vibe-Coded Aesthetics:** Ultra-smooth micro-interactions, dark/light modes, glassmorphism elements, and a custom "crazy" animated splash screen built with Framer Motion.
- **⚡ Real-Time Sync:** Never lose your data. Firebase Realtime Database synchronizes your habits, tasks, finances, and goals instantly across all your devices.
- **💰 Financial Tracking:** Visualize your income and expenses effortlessly using beautiful Recharts diagrams and one-click PDF generation.
- **🏆 Goals & Habits Tracking:** Set, monitor, and crush your daily habits and monthly goals with intuitive progress indicators.
- **🔒 Secure Authentication:** Safe, reliable email/password authentication via Firebase Auth to protect your private data.

---

## 🛠️ Tech Stack

Personal Hub is engineered with cutting-edge tools to maximize performance and cross-platform reach.

- **Frontend:** React 19, TypeScript, Vite
- **Styling:** Tailwind CSS 4, Framer Motion, Lucide React
- **State Management:** Zustand (with persist)
- **Backend & Sync:** Firebase (Auth & Realtime Database)
- **AI Integration:** Google GenAI (Gemini 3.1 Flash)
- **Mobile Build:** Capacitor (Android/iOS)
- **Desktop Build:** Electron & Capacitor-Community Electron (Windows/macOS/Linux)

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js (v18+)
- A Google AI Studio API Key (You can configure this inside the app's Settings page!)
- Firebase Project configured (with Realtime Database and Auth enabled).

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/your-username/personal-hub.git
cd personal-hub

# Install all dependencies
npm install
```

### 3. Running Locally (Web)
```bash
npm run dev
```

### 4. Building for Linux / Desktop
Personal Hub fully supports Linux (AppImage & deb).
```bash
# Compile and package for Linux
npm run build:linux
```
Your compiled `.AppImage` will be waiting for you in the `electron/dist` folder!

### 5. Building for Android
```bash
npx cap sync android
npx cap open android
```
*(Requires Android Studio).*

---

## ⚙️ Configuration

Say goodbye to messy `.env` files. **Personal Hub features a built-in Settings page!** 
Simply navigate to the **Settings** tab within the app to:
- Enter and securely save your **Gemini API Key**.
- Set your **Profile Name**.
- Toggle high-performance **Animations** on or off.

---

## 📜 License & Pitch

**Personal Hub** isn't just an app; it's a statement. It proves that productivity tools don't have to be boring, blocky, or slow. If you're an investor or hiring manager checking this out—this is a prime example of blending UX mastery, cross-platform architecture, and AI integration into a single, cohesive product.

*Designed with ❤️ and 🤖 in 2026.*
