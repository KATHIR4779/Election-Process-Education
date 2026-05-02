# 🇮🇳 Bharat Voter Guide - Indian Election Assistant

A premium, interactive educational platform designed to empower Indian citizens with accurate information about the electoral process. Built with **Node.js**, **Google Gemini AI**, and a modern, glassmorphic UI.

![Project Preview](https://drive.google.com/file/d/1J439mCqDTU1t9nk-r7oBGDFrNDun6cRP/view?usp=drive_link)


## 🎯 Hackathon Focus (PromptWars: Virtual)

- **Chosen Vertical**: Civic Tech / Public Education.
- **Approach & Logic**: We utilize a **Hybrid Grounding Logic**. While the AI (Gemini 3 Flash) handles complex procedural queries, we use a deterministic data layer for state-specific links and a step-by-step UI for the voting guide. 
- **Full-Stack Excellence**:
    - **Testing (CI/CD Ready)**: Integrated **Jest** and **Supertest** for automated API and frontend validation.
    - **Google Services Integration**:
        - **Google Gemini 3 Flash**: Core AI reasoning.
        - **Google Cloud Run**: Production-grade serverless hosting.
        - **Google Cloud Logging (Winston)**: Integrated centralized logging for monitoring.
        - **Google Analytics**: Integrated user interaction tracking.
        - **Google Fonts**: Optimized typography via Google Fonts API.
    - **Accessibility (WCAG 2.1 Ready)**: Implemented ARIA labels, semantic landmark elements, skip-to-content links, and optimized keyboard navigation.
    - **Security & Efficiency**: Implemented **Helmet** for secure headers, **Express-Rate-Limit** for DDoS protection, and winston-based audit trails.

## 🌟 Key Features

- **BharatVoter AI Assistant**: A conversational AI grounded in official ECI guidelines. It answers queries about registration, forms (6, 8), and voting procedures without hallucinating dates.
- **State-wise Directory**: A searchable database of all 28 states and 8 Union Territories with direct links to their official Chief Electoral Officer (CEO) portals.
- **Interactive Voting Guide**: A step-by-step visual timeline explaining exactly what happens inside a polling booth.
- **Rich Aesthetics**: A modern, responsive design featuring glassmorphism, smooth scroll-reveal animations, and an Indian-inspired color palette.
- **Smart Search**: Real-time filtering for state information to find your region instantly.

## 🛠️ Technology Stack

- **Frontend**: 
    - **Vanilla JavaScript**: For high-performance, lightweight interactions.
    - **Vanilla CSS**: Custom design system with glassmorphism and responsive layouts.
    - **HTML5**: Semantic structure for better accessibility and SEO.
- **Backend**:
    - **Node.js & Express**: Scalable server-side architecture.
    - **Google Generative AI SDK**: Integrated with **Gemini 3 Flash** for intelligent, grounded conversations.
- **Infrastructure**:
    - **Docker**: Containerized setup for consistent deployment.
    - **Google Cloud Run**: Ready for production hosting with environment-based secret management.

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- A Google Gemini API Key from [Google AI Studio](https://aistudio.google.com/)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/KATHIR4779/Election-Process-Education.git
   cd Election-Process-Education
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env` file in the root directory and add your API key:
   ```env
   GOOGLE_API_KEY=your_gemini_api_key_here
   PORT=8080
   ```

4. **Run the application:**
   ```bash
   npm start
   ```
   The app will be available at `http://localhost:8080`.

## ☁️ Deployment (Google Cloud Run)

This project is optimized for Cloud Run. You can deploy it using the following command:

```bash
gcloud run deploy election-assistant \
  --image gcr.io/[YOUR_PROJECT_ID]/election-assistant \
  --set-env-vars GOOGLE_API_KEY=[YOUR_API_KEY] \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

## 📜 License
This project is for educational purposes. All data is based on official guidelines provided by the **Election Commission of India (ECI)**.

---
Created with ❤️ to empower the Indian Electorate.
