# Personal Hub

Personal Hub is a "vibe-coded" productivity suite developed in 2026. It's designed to be a central command center for tracking expenses, income, and budgets, while also managing daily tasks and fetching upcoming Codeforces contests. 

Built with a focus on cross-platform performance, it runs seamlessly on Mobile (Android), Tablet, and Desktop, with real-time data synchronization powered by Firebase.

## Tech Stack & Implementation

| Technology | Purpose in Personal Hub |
| :--- | :--- |
| **React 19** | Core frontend library for building a responsive and interactive user interface. |
| **TypeScript** | Provides static typing to ensure code reliability and a better developer experience. |
| **Vite** | Fast build tool and dev server that powers the modern development workflow. |
| **Tailwind CSS 4** | Used for rapid, modern styling and creating a "vibe-coded" premium aesthetic. |
| **Firebase** | Handles **Realtime Database** for instant data sync across devices and **Hosting**. |
| **Capacitor** | Enables the web app to run as a native **Android** application on mobile and tablets. |
| **Electron** | Used to package the application for **Desktop** (Windows/macOS/Linux) environments. |
| **Zustand** | Lightweight state management for handling global app data like finances and contests. |
| **Recharts** | Provides beautiful, interactive data visualizations for tracking expenses and income. |
| **Framer Motion** | Implements smooth, professional animations and transitions throughout the UI. |
| **React Router** | Manages seamless navigation between different sections (Finances, Tasks, Contests). |
| **Lucide React** | A library of clean, consistent icons used for intuitive navigation. |
| **html2canvas & jspdf** | Facilitates the generation and export of financial reports as PDF documents. |
| **Sonner** | Handles sleek, non-intrusive toast notifications for user feedback. |

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`
