// app.js (最頂端)

// 引入 Firebase 資料庫 (db)
import { db } from './fireconfig.js';
// 引入我們需要的 Firestore 函式
import { getDocs, collection, doc, getDoc } from './firebaseSDK.js';

// --- DOM Elements & State ---
const views = {
    home: document.getElementById('home-view'),
    scene: document.getElementById('scene-view'),
    vocabulary: document.getElementById('vocabulary-view'),
    basics: document.getElementById('basics-view'),
    quizSetup: document.getElementById('quiz-setup-view'),
    quizProgress: document.getElementById('quiz-progress-view'),
    quizResult: document.getElementById('quiz-result-view'),
    category: document.getElementById('category-view') ,// 【 <- 新增這一行】
    basicsCategory: document.getElementById('basics-category-view')
};
const synth = window.speechSynthesis;
let quizState = {};
let vocabState = { currentPage: 1, itemsPerPage: 10, searchTerm: '' };
let flashcardState = { deck: [], currentIndex: 0 };
let sceneUserAnswers = {};

// --- DATABASES ---
// (新增這三行)
let vocabularyDatabase = [];
let sceneDatabase = {};
let basicsDatabase = {};

// --- Core Functions ---
function showView(viewKey) {
    Object.keys(views).forEach(key => {
        if (views[key]) {
            views[key].style.display = (key === viewKey) ? 'block' : 'none';
        }
    });
    window.scrollTo(0, 0);
}

function speak(text) {
    if (synth.speaking) {
        synth.cancel();
    }
    if (text) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'ja-JP';
        utterance.rate = 0.9;
        synth.speak(utterance);
    }
}

// --- VIEW CONTROLLERS ---
// --- VIEW CONTROLLERS ---

// --- VIEW CONTROLLERS ---
function showHome() {
    // --- 【修改】產生「模組一：基礎知識」按鈕，使用 *指定順序* ---
    // 1. 定義你想要的分類順序
    const desiredBasicsOrder = [
        "總論",
        "核心概念",
        "詞彙變化",
        "尊敬語",
        "丁寧語",
        "謙讓語",
        "稱謂",
        "實用句型",
        "常見錯誤"
    ];

    // 2. 根據指定順序產生按鈕 HTML
    let basicsListHTML = '';
    desiredBasicsOrder.forEach(mainCategory => {
        // 我們假設 category 名稱就是我們要找的，
        // 這裡不再需要從 basicsDatabase 反查 title 或 description，
        // 因為按鈕的 data-arg 就是分類名本身。
        // 我們可以為 description 寫一個通用的描述。
        const description = `查看 ${mainCategory} 相關的知識點`;
        basicsListHTML += `
            <li class="nav-item">
                
                <button data-action="showBasicsCategory" data-arg="${mainCategory}">
                    <span class="icon"></span>
                    <div>
                        <span class="title">${mainCategory}</span> 
                        <p class="description">${description}</p>
                    </div>
                </button>
            </li>
        `;
    });

    // (如果 desiredBasicsOrder 是空的，理論上不會發生，但保留 fallback)
    if (!basicsListHTML) {
        basicsListHTML = '<p class="text-small" style="text-align: center;">未能載入基礎知識分類。</p>';
    }

    // --- 產生「模組三：情境應用」的固定分類按鈕列表 ---
    // (這部分邏輯不變)
    const fixedCategories = [
        { name: "A 職場商務篇", prefix: "A " },
        { name: "B 日常生活篇", prefix: "B " },
        { name: "C 特殊場合篇", prefix: "C " },
        { name: "D 溝通技巧篇", prefix: "D " }
    ];
    let categoryListHTML = '';
    fixedCategories.forEach(category => {
        const description = `查看 ${category.name.split(' ')[1]} 的相關場景`;
        categoryListHTML += `
            <li class="nav-item">
                <button data-action="showCategoryScenes" data-arg="${category.name}">
                    <span class="icon"></span>
                    <div>
                        <span class="title">${category.name}</span> 
                        <p class="description">${description}</p>
                    </div>
                </button>
            </li>
        `;
    });

    // --- 組合完整的首頁 HTML ---
    views.home.innerHTML = `
        <header style="text-align: center; padding: 2rem 0;">
             <h1 class="h1">日語敬語學習大全</h1>
             <p class="text-small" style="margin-top: 0.25rem;">版本: v1.1.0</p>
             <p style="margin-top: 1rem; max-width: 600px; margin-left: auto; margin-right: auto;">一個專為解決日語學習者最大痛點而設計的互動練習平台。從真實情境中掌握最道地的敬語用法。</p>
        </header>
        <main class="section">
            <div class="card section">
                <h2 class="h2">模組一：基礎知識</h2>
                <ul class="nav-list">
                    ${basicsListHTML} 
                </ul>
            </div>
            
            <div class="card section">
                <h2 class="h2">模組二：速查記憶</h2>
                 <ul class="nav-list">
                    <li class="nav-item">
                        <button data-action="showVocabulary">
                            <span class="icon"></span>
                            <div><span class="title jp">敬語動詞單字帳</span><p class="description">查詢常用動詞的特殊敬語變化。</p></div>
                        </button>
                    </li>
                </ul>
            </div>

            <div class="card section">
                <h2 class="h2">模組三：情境應用</h2>
                <ul class="nav-list">
                    ${categoryListHTML}
                </ul>
            </div>

            <div class="card">
                <h2 class="h2">模組四：綜合測驗</h2>
                 <ul class="nav-list">
                     <li class="nav-item">
                         <button data-action="showQuizSetup">
                             <span class="icon"></span>
                             <div><span class="title jp">開始測驗</span><p class="description">檢驗您的學習成果。</p></div>
                         </button>
                    </li>
                </ul>
            </div>
        </main>`;
    showView('home');
}


/**
 * 顯示特定分類下的所有場景列表
 * @param {string} categoryName - 被點擊的分類名稱
 */

/**
 * 顯示特定主分類下的所有相關場景列表
 * @param {string} categoryFullName - 被點擊的完整分類名稱 (例如 "A 職場商務篇")
 */
function showCategoryScenes(categoryFullName) {
    if (!categoryFullName) return;

    // --- 提取分類前綴 (例如 "A ") ---
    // 把加空格 ' ' 改成加句點 '.'
const categoryPrefix = categoryFullName.split(' ')[0] + '.';

    // --- 過濾出 parentCategory 以該前綴開頭的所有場景 ---
    const scenesInCategory = [];
    for (const sceneId in sceneDatabase) {
        const sceneData = sceneDatabase[sceneId];
        // 檢查 parentCategory 是否存在，並且是否以指定前綴開頭
        if (sceneData && sceneData.parentCategory && sceneData.parentCategory.startsWith(categoryPrefix)) {
            scenesInCategory.push({ id: sceneId, ...sceneData });
        }
    }
    // 根據標題排序
    scenesInCategory.sort((a, b) => (a.title || '').localeCompare(b.title || '')); 

    // --- 產生這些場景的按鈕 HTML ---
    let sceneListHTML = '';
    if (scenesInCategory.length > 0) {
        scenesInCategory.forEach(scene => {
            // (顯示邏輯不變)
            sceneListHTML += `
                <li class="nav-item">
                    <button data-action="showScene" data-arg="${scene.id}">
                        <span class="icon"></span>
                        <div>
                            <span class="title jp">${scene.title}</span>
                            <p class="description">${scene.description || '點此開始練習'}</p> 
                        </div>
                    </button>
                </li>
            `;
        });
    } else {
        sceneListHTML = `<p class="text-small" style="text-align: center;">此分類 (${categoryPrefix.trim()}) 下沒有場景。</p>`;
    }

    // --- 組合分類頁面的 HTML (標題使用完整的分類名稱) ---
    views.category.innerHTML = `
        <button data-action="showHome" class="btn-back">
            <svg xmlns="http://www.w3.org/2000/svg" style="width: 1rem; height: 1.5rem;" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            返回首頁
        </button>
        <main>
            <div class="section">
                <p class="text-accent">模組三：情境應用</p>
                
                <h2 class="h2" style="font-size: 1.875rem; margin-top: 0.25rem;">${categoryFullName}</h2> 
            </div>
            <div class="card section">
                <ul class="nav-list">
                    ${sceneListHTML}
                </ul>
            </div>
        </main>
    `;

    showView('category'); // 切換到 category 視圖
}

/**
 * 顯示特定基礎知識主分類下的所有知識點列表
 * @param {string} mainCategoryName - 被點擊的主分類名稱 (例如 "尊敬語")
 */
function showBasicsCategory(mainCategoryName) {
    // --- 【除錯】印出傳入的分類名稱 ---
    console.log("--- showBasicsCategory called with:", mainCategoryName, typeof mainCategoryName); 

    if (!mainCategoryName || typeof mainCategoryName !== 'string') {
        console.error("無效的 mainCategoryName:", mainCategoryName);
        return; // 如果參數有問題，直接返回
    }

    // --- 過濾出屬於這個主分類的所有知識點 ---
    const itemsInCategory = [];
    console.log("Filtering basicsDatabase which has keys:", Object.keys(basicsDatabase)); // 看看資料庫還在不在

    for (const basicsId in basicsDatabase) {
        const basicsData = basicsDatabase[basicsId];
        
        // 【除錯】印出正在檢查的項目
        // console.log(`Checking item: ${basicsId}, parentCategory: '${basicsData.parentCategory}'`); 

        if (basicsData && basicsData.parentCategory && typeof basicsData.parentCategory === 'string') { // 加上類型檢查
             const parts = basicsData.parentCategory.split('/');
             if (parts.length > 1) {
                 const extractedCategory = parts[1].trim();
                 
                 // --- 【除錯】印出比對的兩個值 ---
                 console.log(`  Comparing: extracted='${extractedCategory}' vs mainCategory='${mainCategoryName}'`); 

                 if (extractedCategory === mainCategoryName) {
                     console.log(`    MATCH FOUND for ${basicsId}!`); // 找到匹配時印出訊息
                     itemsInCategory.push({ id: basicsId, ...basicsData });
                 }
             }
        } else {
             // 【除錯】印出跳過的項目
             // console.log(`  Skipping item ${basicsId} due to missing or invalid parentCategory.`);
        }
    }
    
    // --- 【除錯】印出最終找到的項目數量 ---
    console.log("Filtering complete. Found items:", itemsInCategory.length); 

    // (可選) 根據標題排序
    itemsInCategory.sort((a, b) => (a.title || '').localeCompare(b.title || '')); 

    // --- 產生這些知識點的按鈕 HTML ---
    let itemListHTML = ''; // <-- 初始化 itemListHTML
    if (itemsInCategory.length > 0) {
        itemsInCategory.forEach(item => {
             let description = item.description || `學習 ${item.title.split(' ')[0]} 的相關知識。`;
            itemListHTML += `
                <li class="nav-item">
                    
                    <button data-action="showBasics" data-arg="${item.id}" data-category="${mainCategoryName}"> 
                        <span class="icon"></span>
                        <div>
                            <span class="title jp">${item.title}</span>
                            <p class="description">${description}</p> 
                        </div>
                    </button>
                </li>
            `;
        });
    } else {
        itemListHTML = `<p class="text-small" style="text-align: center;">此分類 (${mainCategoryName}) 下沒有知識點。</p>`;
    }

    // --- 【重點】組合基礎知識分類頁面的 HTML (這裡之前被省略了！) ---
    views.basicsCategory.innerHTML = `
        <button data-action="showHome" class="btn-back">
            <svg xmlns="http://www.w3.org/2000/svg" style="width: 1rem; height: 1.5rem;" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            返回首頁
        </button>
        <main>
            <div class="section">
                <p class="text-accent">模組一：基礎知識</p>
                
                <h2 class="h2" style="font-size: 1.875rem; margin-top: 0.25rem;">${mainCategoryName}</h2> 
            </div>
            <div class="card section">
                <ul class="nav-list">
                    ${itemListHTML}
                </ul>
            </div>
        </main>
    `;

    // --- 【重點】切換視圖 (這裡之前也被省略了！) ---
    showView('basicsCategory'); 
}

/**
 * 顯示單個基礎知識點的內容
 * @param {object} args - 包含知識點 ID 和來源分類名稱的物件
 * @param {string} args.id - 知識點的 ID (例如 "sonkeigo_form_verbs")
 * @param {string} args.category - 來源的主分類名稱 (例如 "尊敬語")
 */
function showBasics(args) { 
    // 參數檢查 (保留)
    if (!args || typeof args !== 'object' || !args.id) { 
         console.warn("showBasics 被呼叫，但缺少必要的參數:", args); 
         const basicsIdFallback = (typeof args === 'string') ? args : null; 
         if (!basicsIdFallback) return; 
         args = { id: basicsIdFallback, category: null }; 
    }

    const basicsId = args.id;       
    const categoryName = args.category; // 分類名稱，用於返回按鈕

    const basicsData = basicsDatabase[basicsId];
    if (!basicsData) return; 

    // --- 【修改】產生可點擊的分類路徑按鈕 HTML ---
    let categoryButtonHTML = '';
    // 只有當 categoryName 存在時，才產生返回分類列表的按鈕
    if (categoryName) {
        categoryButtonHTML = `
            <button data-action="showBasicsCategory" data-arg="${categoryName}" class="btn-back" style="margin-bottom: 0; padding-left: 0;"> 
                
                <p class="text-accent" style="margin: 0;">${basicsData.parentCategory}</p> 
            </button>
        `;
    } else {
        // 如果沒有 categoryName (例如直接跳轉到此頁)，只顯示文字
        categoryButtonHTML = `<p class="text-accent">${basicsData.parentCategory}</p>`;
    }

    // --- 組合內容頁面的 HTML ---
    views.basics.innerHTML = `
        
    
        
        <main>
             <div class="section">
                 
                 ${categoryButtonHTML} 
                 
                 
                 <h2 class="h2 jp" style="font-size: 1.875rem; margin-top: 0.25rem;">${basicsData.title}</h2>
             </div>
             
             ${basicsData.contentHTML}
        </main>`;
        
    showView('basics');
}


function showVocabulary() {
    vocabState.currentPage = 1;
    vocabState.searchTerm = '';
    views.vocabulary.innerHTML = `
        <button data-action="showHome" class="btn-back"><svg xmlns="http://www.w3.org/2000/svg" style="width: 1rem; height: 1.5rem;" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>返回首頁</button>
        <main>
             <div class="section"><p class="text-accent">模組二：速查記憶</p><h2 class="h2 jp" style="font-size: 1.875rem; margin-top: 0.25rem;">敬語動詞單字帳</h2></div>
             <div class="card section">
                 <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;">
                     <input type="text" id="vocab-search" class="search-input jp" style="flex-grow: 1; min-width: 200px;" placeholder="搜尋動詞 (例: 行く, いく)...">
                     <button data-action="startFlashcardMode" class="btn btn-primary">開始閃卡練習</button>
                 </div>
                 <div style="overflow-x: auto;"><table class="vocab-table"><thead><tr><th class="jp">原形</th><th class="jp">尊敬語</th><th class="jp">謙譲語</th><th class="jp">丁寧語</th></tr></thead><tbody id="vocab-table-body"></tbody></table></div>
                 <div id="pagination-controls" class="pagination-controls"></div>
             </div>
             <div id="flashcard-mode" class="hidden"></div>
        </main>`;
    showView('vocabulary');
    renderVocabulary(); 
}

function renderVocabulary() {
    const tableBody = document.getElementById('vocab-table-body');
    const paginationControls = document.getElementById('pagination-controls');
    if (!tableBody || !paginationControls) return;

    // 1. 根據搜尋關鍵字過濾資料
    const filteredData = vocabularyDatabase.filter(verb => 
        verb.plain.toLowerCase().includes(vocabState.searchTerm.toLowerCase())
    );

    // 2. 計算分頁
    const totalPages = Math.ceil(filteredData.length / vocabState.itemsPerPage);
    if (vocabState.currentPage > totalPages && totalPages > 0) {
        vocabState.currentPage = totalPages;
    }
    
    const start = (vocabState.currentPage - 1) * vocabState.itemsPerPage;
    const end = start + vocabState.itemsPerPage;
    const paginatedItems = filteredData.slice(start, end);

    // 3. 渲染單字列表
    tableBody.innerHTML = paginatedItems.map(verb => {
        const sonkeigoHTML = verb.sonkeigo.split(', ').map(s => `<div class="td-content"><span class="tag tag-sonkeigo jp">${s}</span><button class="speak-button" data-text-to-read="${s.split(' ')[0].split('(')[0]}"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M9.383 3.076a1 1 0 011.09.217l3.707 3.707H17a1 1 0 011 1v4a1 1 0 01-1 1h-2.586l-3.707 3.707a1 1 0 01-1.707-.707V4a1 1 0 01.617-.924zM14.657 5.757a1 1 0 010 1.414A3.986 3.986 0 0113 10a3.986 3.986 0 01-1.657 2.829 1 1 0 11-1.414-1.414A1.993 1.993 0 0011 10c0-1.028.77-1.884 1.818-1.99a1 1 0 011.839 1.154zM16.071 4.343a1 1 0 010 1.414A5.98 5.98 0 0115 10a5.98 5.98 0 01-1.071 4.243 1 1 0 11-1.414-1.414A3.986 3.986 0 0013 10c0-1.82.996-3.414 2.485-4.243a1 1 0 011.586.829z"/></svg></button></div>`).join('');
        const kenjogoHTML = verb.kenjogo.split(', ').map(k => `<div class="td-content"><span class="tag tag-kenjogo jp">${k}</span><button class="speak-button" data-text-to-read="${k.split(' ')[0].split('(')[0]}"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M9.383 3.076a1 1 0 011.09.217l3.707 3.707H17a1 1 0 011 1v4a1 1 0 01-1 1h-2.586l-3.707 3.707a1 1 0 01-1.707-.707V4a1 1 0 01.617-.924zM14.657 5.757a1 1 0 010 1.414A3.986 3.986 0 0113 10a3.986 3.986 0 01-1.657 2.829 1 1 0 11-1.414-1.414A1.993 1.993 0 0011 10c0-1.028.77-1.884 1.818-1.99a1 1 0 011.839 1.154zM16.071 4.343a1 1 0 010 1.414A5.98 5.98 0 0115 10a5.98 5.98 0 01-1.071 4.243 1 1 0 11-1.414-1.414A3.986 3.986 0 0013 10c0-1.82.996-3.414 2.485-4.243a1 1 0 011.586.829z"/></svg></button></div>`).join('');
        return `
            <tr>
                <td><div class="td-content"><span class="jp" style="font-weight: 600;">${verb.plain}</span><button class="speak-button" data-text-to-read="${verb.plain.split(' ')[0].split('(')[0]}"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M9.383 3.076a1 1 0 011.09.217l3.707 3.707H17a1 1 0 011 1v4a1 1 0 01-1 1h-2.586l-3.707 3.707a1 1 0 01-1.707-.707V4a1 1 0 01.617-.924zM14.657 5.757a1 1 0 010 1.414A3.986 3.986 0 0113 10a3.986 3.986 0 01-1.657 2.829 1 1 0 11-1.414-1.414A1.993 1.993 0 0011 10c0-1.028.77-1.884 1.818-1.99a1 1 0 011.839 1.154zM16.071 4.343a1 1 0 010 1.414A5.98 5.98 0 0115 10a5.98 5.98 0 01-1.071 4.243 1 1 0 11-1.414-1.414A3.986 3.986 0 0013 10c0-1.82.996-3.414 2.485-4.243a1 1 0 011.586.829z"/></svg></button></div></td>
                <td>${sonkeigoHTML}</td>
                <td>${kenjogoHTML}</td>
                <td><div class="td-content"><span class="tag tag-teineigo jp">${verb.teineigo}</span><button class="speak-button" data-text-to-read="${verb.teineigo.split(' ')[0].split('(')[0]}"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M9.383 3.076a1 1 0 011.09.217l3.707 3.707H17a1 1 0 011 1v4a1 1 0 01-1 1h-2.586l-3.707 3.707a1 1 0 01-1.707-.707V4a1 1 0 01.617-.924zM14.657 5.757a1 1 0 010 1.414A3.986 3.986 0 0113 10a3.986 3.986 0 01-1.657 2.829 1 1 0 11-1.414-1.414A1.993 1.993 0 0011 10c0-1.028.77-1.884 1.818-1.99a1 1 0 011.839 1.154zM16.071 4.343a1 1 0 010 1.414A5.98 5.98 0 0115 10a5.98 5.98 0 01-1.071 4.243 1 1 0 11-1.414-1.414A3.986 3.986 0 0013 10c0-1.82.996-3.414 2.485-4.243a1 1 0 011.586.829z"/></svg></button></div></td>
            </tr>
        `;
    }).join('');
    
    // 4. 渲染分頁按鈕
    let paginationHTML = '';
    if (totalPages > 1) {
        paginationHTML += `<button class="pagination-button" data-page="prev" ${vocabState.currentPage === 1 ? 'disabled' : ''}>&lt;&lt;</button>`;
        for (let i = 1; i <= totalPages; i++) {
            paginationHTML += `<button class="pagination-button ${i === vocabState.currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
        }
        paginationHTML += `<button class="pagination-button" data-page="next" ${vocabState.currentPage === totalPages ? 'disabled' : ''}>&gt;&gt;</button>`;
    }
    paginationControls.innerHTML = paginationHTML;
}

/**
 * 根據傳入的 sceneId，產生並顯示對應的情境應用練習頁面。
 * @param {string} sceneId - The ID of the scene to display (e.g., 'request', 'refusal').
 */
function showScene(sceneId) {
    const sceneData = sceneDatabase[sceneId];
    if (!sceneData) return;
    
    // Reset answers for the new scene
    sceneUserAnswers = {};

    // (程式夥伴修正：) 檢查 keyPatterns 是否存在，避免舊資料結構出錯
    const keyPatternsHTML = (sceneData.keyPatterns || []).map(p => `
        <div>
            <div class="td-content">
                <p class="jp" style="font-weight: 600; color: var(--text-primary);">${p.pattern}</p>
                <button class="speak-button" data-text-to-read="${p.pattern.replace(/「|」|〜/g, '')}">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M9.383 3.076a1 1 0 011.09.217l3.707 3.707H17a1 1 0 011 1v4a1 1 0 01-1 1h-2.586l-3.707 3.707a1 1 0 01-1.707-.707V4a1 1 0 01.617-.924zM14.657 5.757a1 1 0 010 1.414A3.986 3.986 0 0113 10a3.986 3.986 0 01-1.657 2.829 1 1 0 11-1.414-1.414A1.993 1.993 0 0011 10c0-1.028.77-1.884 1.818-1.99a1 1 0 011.839 1.154zM16.071 4.343a1 1 0 010 1.414A5.98 5.98 0 0115 10a5.98 5.98 0 01-1.071 4.243 1 1 0 11-1.414-1.414A3.986 3.986 0 0013 10c0-1.82.996-3.414 2.485-4.243a1 1 0 011.586.829z"/></svg>
                </button>
            </div>
            <p class="text-small" style="padding-left: 1rem;">${p.explanation}</p>
        </div>
    `).join('');

    // (程式夥伴修正：) 檢查 examples 是否存在，避免舊資料結構出錯
    const examplesHTML = (sceneData.examples || []).map((ex, index) => `
        <div style="${index > 0 ? 'border-top: 1px solid var(--color-border); padding-top: 1rem;' : ''}">
            <div class="td-content">
                <p class="jp" style="color: #166534;"><span style="font-weight: bold;">[OK ✓]</span> ${ex.ok}</p>
                <button class="speak-button" data-text-to-read="${ex.ok}">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M9.383 3.076a1 1 0 011.09.217l3.707 3.707H17a1 1 0 011 1v4a1 1 0 01-1 1h-2.586l-3.707 3.707a1 1 0 01-1.707-.707V4a1 1 0 01.617-.924zM14.657 5.757a1 1 0 010 1.414A3.986 3.986 0 0113 10a3.986 3.986 0 01-1.657 2.829 1 1 0 11-1.414-1.414A1.993 1.993 0 0011 10c0-1.028.77-1.884 1.818-1.99a1 1 0 011.839 1.154zM16.071 4.343a1 1 0 010 1.414A5.98 5.98 0 0115 10a5.98 5.98 0 01-1.071 4.243 1 1 0 11-1.414-1.414A3.986 3.986 0 0013 10c0-1.82.996-3.414 2.485-4.243a1 1 0 011.586.829z"/></svg>
                </button>
            </div>
            <p style="color: #b91c1c; margin-top: 0.25rem;"><span style="font-weight: bold;">[NG ✗]</span> <span class="jp">${ex.ng}</span><span style="font-size: 0.875rem; color: #dc2626; font-style: italic;"> (分析: ${ex.analysis})</span></p>
        </div>
    `).join('');

    // Generate HTML for interactive drills
    const drillsHTML = sceneData.drills.map(drill => `
        <div class="drill-item" id="drill-item-${drill.id}">
            <p class="text-small">${drill.situation}</p>
            <div class="drill-question-box">
                <p class="jp" style="white-space: pre-wrap; line-height: 2;">
                    ${drill.question.replace('（_______）', `<select class="form-select" data-drill-id="${drill.id}"><option value=""></option>${drill.options.slice(1).map(opt => `<option value="${opt}">${opt}</option>`).join('')}</select>`)}
                </p>
            </div>
            <div style="margin-top: 1rem;">
                <button class="btn btn-primary" data-action="submitSceneAnswer" data-drill-id="${drill.id}">確認答案</button>
                <p id="feedback-${drill.id}" style="margin-top: 0.75rem; font-weight: 600;"></p>
            </div>
        </div>
    `).join('');

    // Assemble the full scene view HTML
    views.scene.innerHTML = `
        <button data-action="showHome" class="btn-back">
            <svg xmlns="http://www.w3.org/2000/svg" style="width: 1rem; height: 1.5rem;" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            返回首頁
        </button>
        <main>
             <div class="section">
                 <p class="text-accent">${sceneData.parentCategory}</p>
                 <h2 class="h2 jp" style="font-size: 1.875rem; margin-top: 0.25rem;">${sceneData.title}</h2>
             </div>
             <div class="card section"><h3 class="h3">場景說明</h3><p>${sceneData.description}</p></div>
             
             ${keyPatternsHTML.length > 0 ? `<div class="card section" style="display: flex; flex-direction: column; gap: 1rem;"><h3 class="h3">核心句型</h3>${keyPatternsHTML}</div>` : ''}
             
             ${examplesHTML.length > 0 ? `<div class="card section" style="display: flex; flex-direction: column; gap: 1.5rem;"><h3 class="h3">實用例句</h3>${examplesHTML}</div>` : ''}
             
             <div class="card section"><h3 class="h3">互動練習</h3><div id="drill-container">${drillsHTML}</div></div>
        </main>`;
    
    showView('scene');
    setupSceneEventListeners(sceneData.drills);
}

/**
 * Sets up event listeners for the interactive drills in a scene.
 * @param {Array} drills - The array of drill objects for the current scene.
 */
function setupSceneEventListeners(drills) {
    views.scene.querySelectorAll('.form-select').forEach(select => {
        select.addEventListener('change', (e) => {
            const drillId = e.target.dataset.drillId;
            sceneUserAnswers[drillId] = e.target.value;
        });
    });
}

/**
 * Handles the logic for submitting a drill answer in a scene.
 * @param {string} drillId - The ID of the drill being answered.
 */
function submitSceneAnswer(drillId) {
    // (程式夥伴修正：) 修正 drillData 的查找方式
    const drillData = Object.values(sceneDatabase)
                                .flatMap(s => s.drills)
                                .find(d => d.id == drillId); 

    const userAnswer = sceneUserAnswers[drillId];
    const feedbackEl = document.getElementById(`feedback-${drillId}`);
    
    if (!feedbackEl || !drillData) return;

    if (!userAnswer) {
        feedbackEl.textContent = '請選擇一個答案。';
        feedbackEl.className = 'feedback-warning';
        return;
    }

    if (userAnswer === drillData.correctAnswer) {
        // (程式夥伴修正：) 增加預設的 feedback，避免舊資料結構出錯
        feedbackEl.textContent = drillData.feedback || '答對了！說法非常正確。';
        feedbackEl.className = 'feedback-correct';
    } else {
        feedbackEl.textContent = '再想一下喔。這個說法可能不太適合。';
        feedbackEl.className = 'feedback-incorrect';
    }
}

/**
 * Shuffles the vocabulary deck, resets the state, and renders the first flashcard.
 */
function startFlashcardMode() {
    // Shuffle the deck for a new session using the Fisher-Yates algorithm
    
    // (程式夥伴修正：)
    // 將 ES6 的 [...vocabularyDatabase] 改為 ES5 的 .slice() 語法來複製陣列
    // 並且將 const 改為 var 提高相容性
    var shuffledDeck = vocabularyDatabase.slice();
    
    var temp; // 用於交換的暫存變數
    for (var i = shuffledDeck.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        
        // (程式夥伴修正：)
        // 將 ES6 的 [a, b] = [b, a] 解構賦值語法
        // 改為 ES5 的 temp 變數交換
        temp = shuffledDeck[i];
        shuffledDeck[i] = shuffledDeck[j];
        shuffledDeck[j] = temp;
    }

    flashcardState.deck = shuffledDeck;
    flashcardState.currentIndex = 0;
    renderFlashcard();
}
/**
 * Renders the current flashcard based on the flashcardState.
 */
function renderFlashcard() {
    const vocabViewMain = document.querySelector('#vocabulary-view main');
    const listContainer = vocabViewMain.querySelector('.card'); // 單字列表的 <div class="card ...">
    let flashcardModeContainer = vocabViewMain.querySelector('#flashcard-mode');
    
    // 隱藏單字列表，顯示閃卡介面
    listContainer.classList.add('hidden');
    flashcardModeContainer.classList.remove('hidden');

    // 檢查是否練習完畢
    if (flashcardState.currentIndex >= flashcardState.deck.length) {
        flashcardModeContainer.innerHTML = `
            <div class="flashcard-container">
                <h3 class="h3">練習完成！</h3>
                <p>您已練習完所有單字。</p>
                <div class="flashcard-controls">
                    <button data-action="showVocabulary" class="btn btn-primary">返回單字帳</button>
                </div>
            </div>
        `;
        return;
    }

    // 取得目前卡片資料並渲染
    const cardData = flashcardState.deck[flashcardState.currentIndex];
    
    // (程式夥伴修正：清理 data-text-to-read，移除括號和多餘假名)
    const cleanSonkeigo = cardData.sonkeigo.split(', ')[0].split('(')[0];
    const cleanKenjogo = cardData.kenjogo.split(', ')[0].split('(')[0];
    const cleanTeineigo = cardData.teineigo.split(' ')[0].split('(')[0];
    const cleanPlain = cardData.plain.split(' ')[0].split('(')[0];
    
     // (修改 onclick 為 data-action)
    flashcardModeContainer.innerHTML = `
        <div class="flashcard-container">
            <div class="flashcard">
                <div class="flashcard-inner">
                
                    <div class="flashcard-front jp" data-action="flipFlashcard">${cardData.plain}</div>
                    <div class="flashcard-back">
                        <button class="btn btn-return-to-front" data-action="unflipFlashcard">返回正面</button>
                        <div class="flashcard-back-content">
                            <div class="flashcard-back-section">
                                <p class="flashcard-back-title">尊敬語</p>
                                <div class="td-content"><p class="jp tag tag-sonkeigo">${cardData.sonkeigo}</p><button class="speak-button" data-text-to-read="${cleanSonkeigo}"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M9.383 3.076a1 1 0 011.09.217l3.707 3.707H17a1 1 0 011 1v4a1 1 0 01-1 1h-2.586l-3.707 3.707a1 1 0 01-1.707-.707V4a1 1 0 01.617-.924zM14.657 5.757a1 1 0 010 1.414A3.986 3.986 0 0113 10a3.986 3.986 0 01-1.657 2.829 1 1 0 11-1.414-1.414A1.993 1.993 0 0011 10c0-1.028.77-1.884 1.818-1.99a1 1 0 011.839 1.154zM16.071 4.343a1 1 0 010 1.414A5.98 5.98 0 0115 10a5.98 5.98 0 01-1.071 4.243 1 1 0 11-1.414-1.414A3.986 3.986 0 0013 10c0-1.82.996-3.414 2.485-4.243a1 1 0 011.586.829z"/></svg></button></div>
                            </div>
                            <div class="flashcard-back-section">
                                <p class="flashcard-back-title">謙譲語</p>
                                <div class="td-content"><p class="jp tag tag-kenjogo">${cardData.kenjogo}</p><button class="speak-button" data-text-to-read="${cleanKenjogo}"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M9.383 3.076a1 1 0 011.09.217l3.707 3.707H17a1 1 0 011 1v4a1 1 0 01-1 1h-2.586l-3.707 3.707a1 1 0 01-1.707-.707V4a1 1 0 01.617-.924zM14.657 5.757a1 1 0 010 1.414A3.986 3.986 0 0113 10a3.986 3.986 0 01-1.657 2.829 1 1 0 11-1.414-1.414A1.993 1.993 0 0011 10c0-1.028.77-1.884 1.818-1.99a1 1 0 011.839 1.154zM16.071 4.343a1 1 0 010 1.414A5.98 5.98 0 0115 10a5.98 5.98 0 01-1.071 4.243 1 1 0 11-1.414-1.414A3.986 3.986 0 0013 10c0-1.82.996-3.414 2.485-4.243a1 1 0 011.586.829z"/></svg></button></div>
                            </div>
                            <div class="flashcard-back-section">
                                <p class="flashcard-back-title">丁寧語</p>
                                <div class="td-content"><p class="jp tag tag-teineigo">${cardData.teineigo}</p><button class="speak-button" data-text-to-read="${cleanTeineigo}"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M9.383 3.076a1 1 0 011.09.217l3.707 3.707H17a1 1 0 011 1v4a1 1 0 01-1 1h-2.586l-3.707 3.707a1 1 0 01-1.707-.707V4a1 1 0 01.617-.924zM14.657 5.757a1 1 0 010 1.414A3.986 3.986 0 0113 10a3.986 3.986 0 01-1.657 2.829 1 1 0 11-1.414-1.414A1.993 1.993 0 0011 10c0-1.028.77-1.884 1.818-1.99a1 1 0 011.839 1.154zM16.071 4.343a1 1 0 010 1.414A5.98 5.98 0 0115 10a5.98 5.98 0 01-1.071 4.243 1 1 0 11-1.414-1.414A3.986 3.986 0 0013 10c0-1.82.996-3.414 2.485-4.243a1 1 0 011.586.829z"/></svg></button></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="flashcard-controls">
                <button data-action="showVocabulary" class="btn">結束練習</button>
                <p class="flashcard-progress">${flashcardState.currentIndex + 1} / ${flashcardState.deck.length}</p>
                <button data-action="nextFlashcard" class="btn btn-primary">下一張 &gt;</button>
            </div>
        </div>
    `;
}

/**
 * Renders the next flashcard in the deck.
 */
function nextFlashcard() {
    flashcardState.currentIndex++;
    renderFlashcard();
}

function showQuizSetup() {
    const totalDrills = Object.values(sceneDatabase).reduce((acc, s) => acc + s.drills.length, 0);
    views.quizSetup.innerHTML = `
        <button data-action="showHome" class="btn-back"><svg xmlns="http://www.w3.org/2000/svg" style="width: 1rem; height: 1.5rem;" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>返回首頁</button>
        <main>
             <div class="section"><p class="text-accent">模組四：綜合測驗</p><h2 class="h2" style="font-size: 1.875rem; margin-top: 0.25rem;">測驗設定</h2></div>
             <div class="card section">
                 <div class="quiz-setup-group">
                     <label for="quiz-category">選擇測驗範圍</label>
                     <select id="quiz-category">
                         <option value="all-scenes">應對進退 (共 ${totalDrills} 題)</option>
                     </select>
                 </div>
                 <div class="quiz-setup-group">
                     <label for="quiz-questions-count">選擇題數</label>
                     <select id="quiz-questions-count">
                         <option value="5">5 題</option>
                         <option value="10">10 題</option>
                     </select>
                 </div>
                 <button data-action="startQuiz" class="btn btn-primary" style="width: 100%; padding: 0.75rem;">開始測驗</button>
             </div>
        </main>`;
    showView('quizSetup');
}

function startQuiz() {
    const category = document.getElementById('quiz-category').value;
    const count = parseInt(document.getElementById('quiz-questions-count').value, 10);
    let allDrills = [];
    if (category === 'all-scenes') { allDrills = Object.values(sceneDatabase).flatMap(scene => scene.drills); }
    const shuffledDrills = allDrills.sort(() => 0.5 - Math.random());
    quizState = { questions: shuffledDrills.slice(0, count), currentIndex: 0, answers: [] };
    showQuizProgress();
}

function showQuizProgress() {
    if (quizState.currentIndex >= quizState.questions.length) { showQuizResult(); return; }
    const currentQuestion = quizState.questions[quizState.currentIndex]; // (程式夥伴修正：這裡有錯字)
    const progress = ((quizState.currentIndex) / quizState.questions.length) * 100;
    views.quizProgress.innerHTML = `
        <main>
             <p class="text-small" style="text-align:center; margin-bottom: 0.5rem;">第 ${quizState.currentIndex + 1} / ${quizState.questions.length} 題</p>
             <div class="quiz-progress-bar"><div class="quiz-progress-bar-inner" style="width: ${progress}%"></div></div>
             <div class="card section quiz-question-container">
                 <p class="text-small">${currentQuestion.situation}</p>
                 <div style="background-color: var(--bg-muted); padding: 1rem; border-radius: 0.25rem; margin-top: 1rem;">
                     <p class="jp" style="white-space: pre-wrap; line-height: 2;">
                         ${currentQuestion.question.replace('（_______）', `<select id="quiz-answer-select"><option value=""></option>${currentQuestion.options.slice(1).map(opt => `<option value="${opt}">${opt}</option>`).join('')}</select>`)}
                     </p>
                 </div>
             </div>
             <div style="text-align: right;">
                  <button data-action="submitQuizAnswer" class="btn btn-primary">
                     ${quizState.currentIndex === quizState.questions.length - 1 ? '完成測驗' : '下一題'} &gt;
                  </button>
             </div>
        </main>`;
    showView('quizProgress');
}

function submitQuizAnswer() {
    const select = document.getElementById('quiz-answer-select');
    const userAnswer = select ? select.value : "";
    quizState.answers.push({ question: quizState.questions[quizState.currentIndex], userAnswer: userAnswer, isCorrect: userAnswer === quizState.questions[quizState.currentIndex].correctAnswer });
    quizState.currentIndex++;
    showQuizProgress();
}

function showQuizResult() {
    const correctAnswers = quizState.answers.filter(a => a.isCorrect).length;
    const totalQuestions = quizState.questions.length;
    const score = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
    const incorrectAnswersHTML = quizState.answers
        .filter(a => !a.isCorrect)
        .map(a => `
            <div class="quiz-result-item">
                 <p class="text-small">${a.question.situation}</p>
                 <p class="jp">${a.question.question.replace('（_______）', ` <strong class="feedback-incorrect">${a.userAnswer || '(未作答)'}</strong> `)}</p>
                 <p><strong>正解：</strong><span class="jp feedback-correct">${a.question.correctAnswer}</span></p>
            </div>
        `).join('') || '<div style="text-align:center; padding: 1rem;"><p>恭喜您全部答對了！</p></div>';

    views.quizResult.innerHTML = `
         <main>
             <div class="section"><p class="text-accent">模組四：綜合測驗</p><h2 class="h2" style="font-size: 1.875rem; margin-top: 0.25rem;">測驗結果</h2></div>
             <div class="card section" style="text-align: center;">
                 <p>您的得分</p>
                 <p class="quiz-result-score">${score}</p>
                 <p style="font-weight: 600;">${correctAnswers} / ${totalQuestions} 答對</p>
             </div>
             <div class="card section">
                 <h3 class="h3">錯題分析</h3>
                 ${incorrectAnswersHTML}
             </div>
             <div style="display: flex; gap: 1rem; justify-content: center;">
                 <button data-action="showQuizSetup" class="btn">重新測驗</button>
                 <button data-action="showHome" class="btn btn-primary">返回首頁</button>
             </div>
        </main>`;
    showView('quizResult');
}
 
// --- Event Delegation (Click) ---
// (程式夥伴修正：刪除了重複的 Click 監聽器，只保留這一個)
document.body.addEventListener('click', (e) => {
    const actionTarget = e.target.closest('[data-action]');
    const speakTarget = e.target.closest('.speak-button');
    const paginationTarget = e.target.closest('.pagination-button');

    // 1. 處理 [data-action] 按鈕
    if (actionTarget) {
        e.preventDefault();
        const action = actionTarget.dataset.action;
        const arg = actionTarget.dataset.arg;
        
        const actions = {
            showHome, 
            showScene, 
            showVocabulary, 
            showBasics,
            showQuizSetup, 
            startQuiz, 
            submitQuizAnswer,
            submitSceneAnswer, 
            startFlashcardMode,
            nextFlashcard,
            flipFlashcard: () => e.target.closest('.flashcard').classList.add('flipped'),
            unflipFlashcard: () => e.target.closest('.flashcard').classList.remove('flipped'),
            showCategoryScenes ,// 【 <- 新增這一行】
            showBasicsCategory
        };

        if (typeof actions[action] === 'function') {
            const category = actionTarget.dataset.category; // 嘗試讀取 data-category
            
            if (action === 'showBasics' && category) {
                // 如果是 showBasics 且有 category，傳遞物件
                actions[action]({ id: arg, category: category }); 
            } else {
                // 其他情況，維持原樣 (傳遞單一 arg 或 drillId)
                actions[action](arg || actionTarget.dataset.drillId); 
            }
        }
        return;
    }

    // 2. 處理 .speak-button 播放按鈕 (這個會自動支援閃卡中的播放按鈕)
    if (speakTarget) {
        const text = speakTarget.dataset.textToRead;
        speak(text);
        return;
    }

    // 3. 處理 .pagination-button 分頁按鈕
    if (paginationTarget) {
        const page = paginationTarget.dataset.page;
        if (page === "prev") {
            if (vocabState.currentPage > 1) vocabState.currentPage--;
        } else if (page === "next") {
            const totalPages = Math.ceil(vocabularyDatabase.filter(v => v.plain.toLowerCase().includes(vocabState.searchTerm.toLowerCase())).length / vocabState.itemsPerPage);
            if (vocabState.currentPage < totalPages) vocabState.currentPage++;
        } else {
            vocabState.currentPage = parseInt(page, 10);
        }
        renderVocabulary(); // 重新渲染單字列表
        return;
    }
});

// (程式夥伴修正：加回了遺失的 Input 監聽器)
// --- Event Delegation (Input) ---
document.body.addEventListener('input', (e) => {
    // 1. 處理 #vocab-search 搜尋框
    if (e.target.id === 'vocab-search') {
        vocabState.searchTerm = e.target.value;
        vocabState.currentPage = 1; // 搜尋時回到第一頁
        renderVocabulary(); // 重新渲染單字列表
    }
});
 
// --- app.js (最底部) ---

/**
 * 從 Firebase 載入所有必要的資料
 */
/**
 * 從 Firebase 載入所有必要的資料 (新版：自動抓取所有文件)
 */
async function loadFirebaseData() {
    try {
        // 1. 載入 Vocabulary (這段本來就是對的，保持不變)
        const vocabSnapshot = await getDocs(collection(db, "vocabulary"));
        vocabularyDatabase = vocabSnapshot.docs.map(doc => doc.data());

        // 2. 載入 Basics (【已修改】)
        //    舊方法是手動指定 ["keigoTypes", "verbRules"]
        //    新方法是自動抓取 "basics" 集合中的所有文件
        const basicsSnapshot = await getDocs(collection(db, "basics"));
        
        // 使用 forEach 迴圈，把抓到的所有文件都存進 basicsDatabase
        // doc.id 就是 Firebase 上的文件 ID (例如 "keigoTypes")
        // doc.data() 就是文件的內容
        basicsSnapshot.forEach(doc => {
            basicsDatabase[doc.id] = doc.data();
        });

        // 3. 載入 Scenes (【已修改】)
        //    舊方法是手動指定 ["request", "refusal", ...]
        //    新方法是自動抓取 "scenes" 集合中的所有文件
        const sceneSnapshot = await getDocs(collection(db, "scenes"));
        
        // 同上，自動把所有抓到的情境 (request, refusal, ...) 存進 sceneDatabase
        sceneSnapshot.forEach(doc => {
            sceneDatabase[doc.id] = doc.data();
        });

        console.log("Firebase 資料載入成功！");
        
        // (測試用) 你可以在 Console 檢查這兩個變數看資料是否正確
        console.log("載入的 Basics:", basicsDatabase);
        console.log("載入的 Scenes:", sceneDatabase);

    } catch (error) {
        console.error("Firebase 資料載入失敗:", error);
        // 顯示錯誤訊息給使用者
        const loadingOverlay = document.getElementById('loading-overlay');
        loadingOverlay.innerHTML = '<p style="color: var(--color-danger); font-weight: 600;">資料載入失敗，請檢查網路連線或 Firebase 設定。</p>';
    }
}
/**
 * 應用程式主啟動函式
 */
async function main() {
    // 顯示載入畫面 (雖然 HTML 裡已經預設顯示了)
    const loadingOverlay = document.getElementById('loading-overlay');
    loadingOverlay.style.display = 'flex';

    // 等待所有資料載入完成
    await loadFirebaseData();

    // 隱藏載入畫面
    loadingOverlay.style.display = 'none';

    // 啟動首頁
    showHome();
}

// --- 啟動應用程式 ---
main();