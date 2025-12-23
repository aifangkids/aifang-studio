// assets/js/api.js

/**
 * 從 GAS 取得所有商品資料
 */
async function fetchProducts() {
    try {
        // 確保這裡使用的是 CONFIG.API_URL，對應你的 config.js
        console.log("📡 正在連線至 API:", CONFIG.API_URL);
        
        const response = await fetch(CONFIG.API_URL);
        
        if (!response.ok) throw new Error('網路回應不正確');
        
        const data = await response.json();
        
        // 判斷 GAS 回傳格式：如果是 {status: 'success', data: [...]} 則取 data.data
        const products = data.data || data;
        
        console.log("✅ 成功取得資料，數量:", products.length);
        return products;
    } catch (error) {
        console.error("❌ fetchProducts 發生錯誤:", error);
        return [];
    }
}

/**
 * 根據商品編號 (Code) 取得單一商品詳情
 */
async function fetchDetailByCode(code) {
    try {
        const allProducts = await fetchProducts();
        const product = allProducts.find(p => String(p.code).toLowerCase() === String(code).toLowerCase());
        
        if (!product) return null;

        return {
            ...product,
            carousel: product.carousel || [product.mainImage],
            detailImages: product.detailImages || [],
            colors: product.colors || []
        };
    } catch (error) {
        console.error("❌ fetchDetailByCode 發生錯誤:", error);
        return null;
    }
}
