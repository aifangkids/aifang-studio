// assets/js/api.js

/**
 * 取得所有商品資料 (首頁 index.js 使用)
 */
async function fetchProducts() {
    try {
        // 使用您在 config.js 中定義的 GAS_URL
        console.log("📡 正在連線至 API...");
        
        const response = await fetch(GAS_URL);
        if (!response.ok) throw new Error('網路回應不正確');
        
        const data = await response.json();
        
        // 【關鍵除錯】在主控台顯示原始資料，方便之後有問題時檢查
        console.log("📦 原始回傳資料:", data);

        /**
         * 【核心防錯邏輯】
         * 1. 如果 data 本身就是 Array (陣列)，直接使用。
         * 2. 如果 data 是物件且包含 data 屬性，則取用 data.data。
         * 3. 如果以上皆非，回傳空陣列 []，確保不會發生 .map() 錯誤。
         */
        const products = Array.isArray(data) ? data : (data.data || []);
        
        console.log("✅ 成功解析商品，數量:", products.length);
        return products;
    } catch (error) {
        console.error("❌ fetchProducts 發生錯誤:", error);
        return []; // 發生錯誤時回傳空陣列，防止網頁當掉
    }
}

/**
 * 根據商品編號 (Code) 取得單一商品詳情 (詳情頁 detail.js 使用)
 */
async function fetchDetailByCode(code) {
    try {
        // 1. 先抓取所有商品
        const allProducts = await fetchProducts();
        
        // 2. 尋找符合 code 的商品 (強制轉為字串比對，避免數字與字串不匹配)
        const product = allProducts.find(p => String(p.code).toLowerCase() === String(code).toLowerCase());
        
        if (!product) {
            console.warn(`⚠️ 找不到商品代碼: ${code}`);
            return null;
        }

        /**
         * 3. 確保詳情頁需要的欄位都有預設值，避免 detail.js 報錯
         */
        return {
            ...product,
            carousel: product.carousel || [product.mainImage], // 若無輪播圖，預設用主圖
            detailImages: product.detailImages || [],          // 詳情細節圖
            colors: product.colors || []                       // 顏色清單
        };
    } catch (error) {
        console.error("❌ fetchDetailByCode 發生錯誤:", error);
        return null;
    }
}
