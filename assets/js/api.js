// assets/js/api.js

async function fetchProducts() {
    try {
        console.log("📡 正在連線至 API...");
        const response = await fetch(GAS_URL);
        if (!response.ok) throw new Error('連線失敗');
        
        const data = await response.json();
        
        // 【核心修正】根據你的截圖，資料就藏在 data.products 裡面
        console.log("📦 原始回傳資料:", data);
        const products = data.products || []; 
        
        console.log("✅ 成功解析商品，數量:", products.length);
        return products;
    } catch (error) {
        console.error("❌ 抓取錯誤:", error);
        return [];
    }
}

async function fetchDetailByCode(code) {
    try {
        const all = await fetchProducts();
        return all.find(p => String(p.code).toLowerCase() === String(code).toLowerCase()) || null;
    } catch (error) {
        return null;
    }
}
