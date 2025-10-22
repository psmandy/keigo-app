// fireconfig.js

// 從 Firebase SDK 載入函式
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

// 你的 Firebase 設定
const firebaseConfig = {
    apiKey: "AIzaSyAk_Wg8N9eusa8ZdDoMDiu2IB_EzYaHMFI",
    authDomain: "keigo-app-25a13.firebaseapp.com",
    projectId: "keigo-app-25a13",
    storageBucket: "keigo-app-25a13.firebasestorage.app",
    messagingSenderId: "862633014183",
    appId: "1:862633014183:web:e3425d0d0fd7054213bc82"
};

// 初始化 Firebase App
const app = initializeApp(firebaseConfig);

// 初始化 Firestore 並匯出
export const db = getFirestore(app);