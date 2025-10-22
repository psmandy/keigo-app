// 引入 Firebase Admin SDK
const admin = require('firebase-admin');

// 引入您的服務帳戶金鑰和資料檔案
// 請確保這兩個 .json 檔案與此腳本放在同一個資料夾中
const serviceAccount = require('./serviceAccountKey.json');
const data = require('./firebase-expansion-data-v4.json');

// 使用您的服務帳戶金鑰初始化 Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// 取得 Firestore 資料庫的參考
const db = admin.firestore();

/**
 * 匯入場景資料到 'scenes' 集合
 */
async function importScenes() {
  console.log('開始匯入場景資料...');
  const scenes = data.new_scenes;
  
  // 使用 for...of 迴圈確保能正確處理非同步操作
  for (const sceneId in scenes) {
    if (scenes.hasOwnProperty(sceneId)) {
      const sceneData = scenes[sceneId];
      const docRef = db.collection('scenes').doc(sceneId);
      try {
        await docRef.set(sceneData);
        console.log(`  正在匯入場景: ${sceneId}... 成功!`);
      } catch (error) {
        console.error(`  匯入場景 ${sceneId} 失敗:`, error);
      }
    }
  }
  console.log('場景資料匯入完成。\n');
}

/**
 * 匯入單字資料到 'vocabulary' 集合
 * 這裡我們會讓 Firestore 自動產生文件 ID
 */
async function importVocabulary() {
  console.log('開始匯入單字資料...');
  const vocabulary = data.new_vocabulary;

  for (const vocabItem of vocabulary) {
    try {
      await db.collection('vocabulary').add(vocabItem);
      console.log(`  正在匯入單字: ${vocabItem.plain}... 成功!`);
    } catch (error) {
      console.error(`  匯入單字 ${vocabItem.plain} 失敗:`, error);
    }
  }
  console.log('單字資料匯入完成。\n');
}

/**
 * 主執行函式
 */
async function main() {
  console.log('--- 開始執行 Firebase 資料庫批次匯入 ---');
  await importScenes();
  await importVocabulary();
  console.log('🎉 所有資料已成功匯入到 Firestore！');
}

// 執行主函式
main().catch(console.error);
