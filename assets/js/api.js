// assets/js/api.js

async function fetchProducts() {
    try {
        // 使用您原本就設定好的 GAS_URL
        const response = await fetch(GAS_URL);
        if (!response.ok) throw new Error('連線失敗');
        
        const data = await response.json();
        
        // 【核心修正】這行會自動判斷：如果 data 直接是陣列就用 data，如果包在 data.data 裡也抓得到
        const products = Array.isArray(data) ? data : (data.data || []);
        
        console.log("✅ 成功取得資料，數量:", products.length);
        return products;
    } catch (error) {
        console.error("❌ 抓取錯誤:", error);
        return [];
    }
}

async function fetchDetailByCode(code) {
    const all = await fetchProducts();
    return all.find(p => String(p.code) === String(code)) || null;
}
