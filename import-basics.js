// 引入 Firebase Admin SDK
const admin = require('firebase-admin');

// 引入您的服務帳戶金鑰和資料檔案
// 請確保這兩個 .json 檔案與此腳本放在同一個資料夾中
const serviceAccount = require('./serviceAccountKey.json');
const data = require('./basics-database.json');

// 使用您的服務帳戶金鑰初始化 Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// 取得 Firestore 資料庫的參考
const db = admin.firestore();
const basicsCollectionRef = db.collection('basics');

/**
 * 匯入基礎知識資料到 'basics' 集合
 */
async function importBasics() {
  console.log('--- 開始執行 Firebase 基礎知識資料匯入 ---');
  
  // 使用 for...of 迴圈確保能正確處理非同步操作
  for (const docId in data) {
    if (data.hasOwnProperty(docId)) {
      const docData = data[docId];
      const docRef = basicsCollectionRef.doc(docId);
      try {
        await docRef.set(docData);
        console.log(`  正在匯入基礎知識: ${docId}... 成功!`);
      } catch (error) {
        console.error(`  匯入基礎知識 ${docId} 失敗:`, error);
      }
    }
  }
  
  console.log('🎉 所有基礎知識資料已成功匯入到 Firestore！');
}

// 執行主函式
importBasics().catch(console.error);
