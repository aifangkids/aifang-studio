// assets/js/api.js
// 這裡直接填入您的 GAS 部署網址，確保串接您的試算表
const GAS_URL = "https://script.google.com/macros/s/AKfycbxrmloTY4wCo1Sn5tgMQDRwhU8uXWBTA0c6v17ec7M6W5LkufjES1fjJBolMb_552z5/exec";

/**
 * 抓取完整 JSON 資料 (含 products 與 details)
 */
async function getFullData() {
    try {
        const response = await fetch(GAS_URL);
        if (!response.ok) throw new Error("無法連線至試算表 API");
        const data = await response.json();
        return data; // 回傳 { products: [], details: [] }
    } catch (error) {
        console.error("❌ API 連線錯誤:", error);
        return { products: [], details: [] };
    }
}

/**
 * 供首頁使用：取得所有商品簡訊
 */
async function fetchProducts() {
    console.log("📡 正在從試算表抓取商品列表...");
    const data = await getFullData();
    console.log("✅ 已取得 products 數量:", data.products.length);
    return data.products; 
}

/**
 * 供詳情頁使用：根據 Code 取得詳情分頁 (details) 中的完整資訊
 */
async function fetchDetailByCode(code) {
    console.log(`📡 正在查詢商品詳情，代碼: ${code}`);
    const data = await getFullData();
    
    // 從 details 陣列中尋找符合 code 的那一筆
    const detail = data.details.find(d => String(d.code).toLowerCase() === String(code).toLowerCase());
    
    if (!detail) {
        console.warn("⚠️ 在 details 分頁中找不到此代碼");
        return null;
    }

    return detail;
}
