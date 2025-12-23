// assets/js/api.js
// 注意：這裡不再重複宣告 GAS_URL，直接使用 config.js 提供的變數

/**
 * 抓取完整 JSON 資料 (含 products 與 details)
 */
async function getFullData() {
    try {
        // 這裡會自動抓到 config.js 裡的 GAS_URL
        const response = await fetch(GAS_URL);
        if (!response.ok) throw new Error("無法連線至試算表 API");
        const data = await response.json();
        
        // 偵錯用：確保資料有抓到
        console.log("📦 原始回傳資料:", data);
        return data; 
    } catch (error) {
        console.error("❌ API 連線錯誤:", error);
        return { products: [], details: [] };
    }
}

/**
 * 供首頁使用：取得所有商品
 */
async function fetchProducts() {
    const data = await getFullData();
    // 根據您的 JSON 結構，取用 data.products
    const products = data.products || [];
    console.log("✅ 成功解析商品列表，數量:", products.length);
    return products; 
}

/**
 * 供詳情頁使用：根據 Code 取得詳情
 */
async function fetchDetailByCode(code) {
    const data = await getFullData();
    // 根據您的 JSON 結構，從 data.details 中尋找
    const detail = data.details.find(d => String(d.code).toLowerCase() === String(code).toLowerCase());
    
    if (!detail) {
        console.warn(`⚠️ 在 details 分頁中找不到代碼: ${code}`);
        return null;
    }
    return detail;
}
