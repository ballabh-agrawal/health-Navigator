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


<img width="1890" height="854" alt="Screenshot 2025-11-21 024455" src="https://github.com/user-attachments/assets/7244be7e-0838-4706-92ab-def5881374ff" />
<img width="876" height="591" alt="Screenshot 2025-11-21 022629" src="https://github.com/user-attachments/assets/904d649a-e438-47b4-a6fd-5c7ff77418a9" />
<img width="1219" height="682" alt="Screenshot 2025-11-21 022618" src="https://github.com/user-attachments/assets/8d30c281-9362-430e-861a-a19e790ef6c7" />
<img width="757" height="834" alt="Screenshot 2025-11-21 024435" src="https://github.com/user-attachments/assets/32182546-62cd-458f-bdef-598a7ceb7597" />
<img width="1900" height="860" alt="Screenshot 2025-11-21 022554" src="https://github.com/user-attachments/assets/31b6e603-6106-4010-af5d-7d4650956ee6" />
<img width="1896" height="866" alt="Screenshot 2025-11-21 022538" src="https://github.com/user-attachments/assets/d3557da0-db3c-4315-9b20-2cb14c126e29" />
<img width="1892" height="857" alt="Screenshot 2025-11-21 022510" src="https://github.com/user-attachments/assets/b42ea76d-b0cf-48ef-b1ba-dddc51f9ca32" />
<img width="1899" height="864" alt="Screenshot 2025-11-21 022447" src="https://github.com/user-attachments/assets/61b98aa9-59fe-4058-9ee2-84f64283afc5" />

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
