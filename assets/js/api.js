// assets/js/api.js

async function fetchProducts() {
    try {
        // 使用您原本就有的 GAS_URL
        const response = await fetch(GAS_URL);
        if (!response.ok) throw new Error('連線失敗');
        
        const data = await response.json();
        
        // 【核心修正】只加這一行：自動判斷是直接給陣列還是包在 data 屬性裡
        const products = Array.isArray(data) ? data : (data.data || []);
        
        console.log("✅ 成功取得資料，數量:", products.length);
        return products;
    } catch (error) {
        console.error("❌ 抓取錯誤:", error);
        return [];
    }
}

// 這個函式給 detail.js 使用，完全不影響首頁
async function fetchDetailByCode(code) {
    const all = await fetchProducts();
    return all.find(p => String(p.code) === String(code)) || null;
}
