// assets/js/api.js

/**
 * 取得所有商品資料
 */
async function fetchProducts() {
    try {
        // 使用您原本定義的 GAS_URL
        const response = await fetch(GAS_URL);
        if (!response.ok) throw new Error('網路回應不正確');
        
        const data = await response.json();
        
        // 關鍵修正：相容 GAS 各種回傳格式，確保 products 一定是個陣列
        const products = Array.isArray(data) ? data : (data.data || []);
        
        console.log("✅ 成功取得資料，數量:", products.length);
        return products;
    } catch (error) {
        console.error("❌ fetchProducts 發生錯誤:", error);
        return [];
    }
}

/**
 * 根據商品編號 (Code) 取得單一商品詳情 (供 detail.js 使用)
 */
async function fetchDetailByCode(code) {
    try {
        const allProducts = await fetchProducts();
        const product = allProducts.find(p => String(p.code).toLowerCase() === String(code).toLowerCase());
        
        if (!product) return null;

        // 整理 detail.js 需要的資料格式
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
