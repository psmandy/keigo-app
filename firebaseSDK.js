// firebaseSDK.js

// 從 CDN 引入所有我們需要用到的 Firestore 函式
import { 
    getDocs, 
    collection, 
    doc, 
    getDoc 
} from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

// 將它們全部匯出，給 app.js 使用
export { getDocs, collection, doc, getDoc };