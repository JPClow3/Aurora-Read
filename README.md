
#  Aurora Read: Your Personalized AI-Powered Reading Oasis

**Aurora Read** is a sophisticated, feature-rich web application designed to transform your reading experience. It goes beyond a simple e-reader by integrating cutting-edge AI, high-quality text-to-speech, and deep customization options. Whether you want to immerse yourself in a classic novel, listen to a textbook karaoke-style, or get AI-powered insights into the plot, Aurora Read provides a seamless and powerful platform for all your literary adventures.

![Aurora Read Showcase](https://storage.googleapis.com/aistudio-ux-team-public/sdk-samples/aurora-read-demo.gif)

## ✨ Key Features

---

### 📚 **Versatile Reading Experience**

-   **Multi-Format Support**: Easily upload and enjoy your books in both `.txt` and `.epub` formats with a simple drag-and-drop interface.
-   **Three Dynamic Modes**:
    1.  **Immersive Reading**: A clean, distraction-free reading view.
    2.  **Karaoke Listening**: Follow along with synchronized, sentence-by-sentence highlighting as the book is read aloud.
    3.  **Hybrid View**: The best of both worlds—see the full text while the current sentence is highlighted and narrated.
-   **Realistic Paper Simulation**: For a truly immersive experience, switch to a stunning 3D two-page layout that mimics a physical book, complete with subtle paper textures and elegant page-turning animations.
-   **Native EPUB Rendering**: Preserves the original formatting, chapters, and table of contents of your EPUB files for an authentic experience.

### 🤖 **AI-Powered Insights (Powered by Gemini)**

-   **Smart Highlights**: Automatically analyze any chapter to reveal and highlight:
    -   🔴 **Key Plot Points**: Never miss a major story event.
    -   🔵 **Character Introductions**: Instantly recognize when a new character appears.
    -   🟣 **Foreshadowing**: Discover subtle hints and clues about future events.
-   **Character Tracker**: Get a complete breakdown of all major characters in the book. The AI generates detailed profiles including their role, personality, and a map of their relationships with other characters.
-   **AI-Generated Flashcards**: Instantly create study flashcards from any chapter. Perfect for students or anyone wanting to retain key information. Includes a built-in spaced repetition system (SRS) for effective learning.
-   **High-Quality Narration**: Leverages Google's generative AI to provide natural, human-like text-to-speech narration for any book.

### 🎨 **Deep Customization & Personalization**

-   **Multi-User Profiles**: Create separate profiles for everyone in the family. Each profile maintains its own library, reading progress, settings, and statistics.
-   **Advanced Display Settings**: Fine-tune your reading environment with options for:
    -   **Themes**: Light, Dark, Sepia, and Grey.
    -   **Fonts**: Choose from Serif, Sans-Serif, and an OpenDyslexic font for improved readability.
    -   **Typography**: Adjust font size, line height, and margins to your exact preference.
-   **Annotations**: Highlight your favorite passages and add notes. Your annotations are saved per-profile for each book.

### 📊 **Track Your Progress & Stay Motivated**

-   **Comprehensive Stats Dashboard**: Dive deep into your reading habits with visualizations for:
    -   **Reading Streak**: A calendar heatmap shows your day-by-day activity.
    -   **Listen Time**: Track your total listening duration and see your activity over the last 30 days.
    -   **Genre Breakdown**: A pie chart shows which genres you read the most.
-   **Achievements**: Stay motivated by unlocking badges for reaching milestones like finishing your first book, maintaining a long reading streak, or listening for dozens of hours.

### 🌐 **Built for the Modern Web**

-   **Offline First**: Using IndexedDB, your entire library, progress, and settings are stored locally. Listen to pre-cached chapters and read your books anytime, even without an internet connection.
-   **Performance Optimized**: Utilizes Web Workers for file parsing, ensuring the user interface remains smooth and responsive even when processing large books.
-   **Accessibility**: Designed with accessibility in mind, including ARIA attributes and high-contrast mode support.
-   **Sleep Timer**: Set a timer to automatically pause playback, perfect for listening before bed.

## 🛠️ Tech Stack

-   **Frontend**: [React](https://reactjs.org/), [TypeScript](https://www.typescriptlang.org/)
-   **Styling**: [Tailwind CSS](https://tailwindcss.com/)
-   **AI Integration**: [Google Gemini API](https://ai.google.dev/)
-   **Local Storage**: [IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
-   **EPUB Rendering**: [Epub.js](http://epubjs.org/)
-   **Concurrency**: [Web Workers](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API)

## 🚀 Getting Started

Aurora Read is a web application that runs entirely in your browser.

### API Key Configuration

The application requires a Google Gemini API key to function. This key must be available as an environment variable in the execution context.

-   The application will automatically look for `process.env.API_KEY`.
-   You do not need to enter the key in the UI; its availability is assumed.

### Usage Flow

1.  **Profile Selection**: On first launch, create a user profile. If profiles exist, select yours to continue.
2.  **Upload a Book**: In the library view, click the upload button to add a `.txt` or `.epub` file from your device.
3.  **Open the Player**: Click on a book in your library to open the main reader/player view.
4.  **Customize**: Use the settings icons to change the view mode, adjust display settings, or set a sleep timer.
5.  **Explore AI Tools**: Open the AI tools modal to analyze the current chapter, generate flashcards, or view character profiles.
6.  **Track Progress**: Navigate to the "Profile" tab to see your reading statistics and unlocked achievements.
