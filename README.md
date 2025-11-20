# 🌿 HealthNav - Personalized AI Health Navigator

**HealthNav** is an intelligent web application designed to bridge the gap between complex medical data and daily lifestyle choices. Unlike generic health apps, HealthNav uses Artificial Intelligence to interpret blood reports and nutrition labels specifically in the context of the user's individual health profile (e.g., diabetes, hypertension, or specific fitness goals).

## 🚀 Key Features

* **👤 Smart Profile System:** Collects detailed user data (lifestyle, medical history, dietary preferences) to build a context-layer for all AI analysis.
* **🩸 Blood Report Analysis:**
    * Uploads images of medical reports.
    * Uses **OCR (Tesseract.js)** to extract raw medical data.
    * Uses **Google Gemini AI** to interpret the results, explain them in plain English, and offer actionable wellness tips based on the user's specific health conditions.
* **🥗 Intelligent Product Scanner:**
    * Scans nutrition labels of packaged foods.
    * Parses nutritional values (Sodium, Sugar, Fats).
    * **Context-Aware Analysis:** Warns the user if a product conflicts with their health goals (e.g., flagging high sodium for a user with high BP).
* **💬 AI Health Assistant:** A built-in chatbot powered by Gemini to answer general health queries and explain medical concepts.
* **📊 Interactive Dashboard:** A central hub to view health stats, past reports, and AI insights.

## 🛠️ Tech Stack

* **Frontend:** React.js, TypeScript, Vite
* **Styling:** Tailwind CSS
* **Backend & Auth:** Firebase (Authentication, Firestore Database)
* **AI & Machine Learning:**
    * **Google Gemini API:** For generative text analysis and personalized insights.
    * **Tesseract.js:** For client-side Optical Character Recognition (OCR).

## 📸 Screenshots

*(You can drag and drop screenshots of your Dashboard, Scanner, and Chatbot here after uploading to GitHub)*

## 💻 Getting Started

Follow these steps to run the project locally:

1.  **Clone the repository**
    ```bash
    git clone [https://github.com/YOUR_USERNAME/health-navigator.git](https://github.com/YOUR_USERNAME/health-navigator.git)
    ```
    *(Replace YOUR_USERNAME with your actual GitHub username)*

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Set up Environment Variables**
    Create a `.env` file in the root directory and add your API keys:
    ```env
    VITE_FIREBASE_API_KEY=your_firebase_key_here
    VITE_GEMINI_API_KEY=your_gemini_key_here
    ```

4.  **Run the development server**
    ```bash
    npm run dev
    ```

---
*Created by Ballabh Agrawal*
