// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
 apiKey: "AIzaSyAk_Wg8N9eusa8ZdDoMDiu2IB_EzYaHMFI",
  authDomain: "keigo-app-25a13.firebaseapp.com",
  projectId: "keigo-app-25a13",
  storageBucket: "keigo-app-25a13.firebasestorage.app",
  messagingSenderId: "862633014183",
  appId: "1:862633014183:web:e3425d0d0fd7054213bc82"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// --- ▼▼▼ 新增以下兩行 ▼▼▼ ---
// 初始化 Firestore
const db = getFirestore(app);

// 將 db 匯出給 app.js 使用
export { db };
// --- ▲▲▲ 新增以上兩行 ▲▲▲ ---