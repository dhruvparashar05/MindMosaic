# 🧠 **MIND MOSAIC**

> **Mind Mosaic** is a modern web application that transforms scattered ideas, notes, and inputs into structured, meaningful insights using a powerful Next.js frontend and Firebase backend.

---

## 🚀 Live Demo
🔗 https://your-vercel-url.vercel.app  
_(Replace with your actual Vercel deployment link)_

---

## 🛠 Tech Stack

### Frontend
- **Next.js**
- **React**
- **Tailwind CSS** (if used)

### Backend & Services
- **Firebase Authentication**
- **Firebase Firestore**
- **Firebase Cloud Functions**

### Deployment
- **Vercel** – Frontend hosting  
- **Firebase** – Backend services  

---

## ✨ Features
- 🔐 Secure authentication with Firebase  
- ⚡ Fast, responsive UI  
- ☁️ Serverless backend using Firebase Functions  
- 🔄 Real-time data handling  
- 🚀 Automatic deployment via GitHub → Vercel  

---

## 📂 Project Structure
studio/
│── app/ or src/ # Next.js application
│── functions/ # Firebase Cloud Functions
│── public/ # Static assets
│── firebase.json
│── package.json
│── .gitignore
│── README.md


---

## 🧪 Run Locally

### 1️⃣ Clone the repository
```bash
git clone https://github.com/dhruvparashar05/studio.git
cd studio
npm install

NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

npm run dev

http://localhost:3000
