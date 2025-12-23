// assets/js/api.js

async function fetchProducts() {
    try {
        // 使用您原本就定義好的 GAS_URL
        const response = await fetch(GAS_URL);
        if (!response.ok) throw new Error('網路連線異常');
        
        const data = await response.json();
        
        // 【核心修正】不論 GAS 回傳的是 [ ... ] 還是 { data: [...] }，這行都能抓到
        const products = Array.isArray(data) ? data : (data.data || []);
        
        console.log("✅ 成功取得資料，數量:", products.length);
        return products;
    } catch (error) {
        console.error("❌ API 抓取失敗:", error);
        return [];
    }
}

/**
 * 根據商品編號取得單一商品詳情 (給 detail.js 使用)
 */
async function fetchDetailByCode(code) {
    try {
        const all = await fetchProducts();
        // 強制轉型為字串比對，避免類型錯誤
        return all.find(p => String(p.code) === String(code)) || null;
    } catch (error) {
        console.error("❌ fetchDetailByCode 錯誤:", error);
        return null;
    }
}
