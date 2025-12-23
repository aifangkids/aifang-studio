// assets/js/api.js

/**
 * 從 GAS 取得所有商品資料
 */
async function fetchProducts() {
    try {
        // 請確保 CONFIG.API_URL 已經在 config.js 中定義
        const response = await fetch(CONFIG.API_URL);
        if (!response.ok) throw new Error('網路回應不正確');
        
        const data = await response.json();
        
        // 假設 GAS 回傳的結構是 { status: 'success', data: [...] }
        return data.data || []; 
    } catch (error) {
        console.error("fetchProducts 發生錯誤:", error);
        return [];
    }
}

/**
 * 根據商品編號 (Code) 取得單一商品詳情
 * 這是專門給 detail.js 使用的
 */
async function fetchDetailByCode(code) {
    try {
        // 1. 先取得所有商品 (因為 GAS 通常是一次回傳整張表)
        const allProducts = await fetchProducts();
        
        // 2. 尋找 code 符合的商品 (不分大小寫)
        const product = allProducts.find(p => String(p.code).toLowerCase() === String(code).toLowerCase());
        
        if (!product) {
            console.warn(`找不到編號為 ${code} 的商品`);
            return null;
        }

        // 3. 可以在這裡確保資料結構完整 (例如輪播圖與詳情圖的預設值)
        return {
            ...product,
            carousel: product.carousel || [product.mainImage], // 若無輪播圖則用主圖
            detailImages: product.detailImages || [],
            colorswatch: product.colorswatch || [],
            colors: product.colors || []
        };

    } catch (error) {
        console.error("fetchDetailByCode 發生錯誤:", error);
        return null;
    }
}
