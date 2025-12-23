// assets/js/index.js

document.addEventListener("DOMContentLoaded", async () => {
    console.log("🚀 index.js 開始執行...");

    // 1. 檢查 HTML 容器是否存在
    const container = document.getElementById("product-list");
    if (!container) {
        console.error("❌ 找不到 id='product-list' 的容器");
        return;
    }

    // 2. 顯示載入中
    container.innerHTML = `<div class="loading">⏳ 正在為您挑選精美童裝...</div>`;

    try {
        // 3. 呼叫 api.js 裡的 fetchProducts
        console.log("📡 正在從 Google Sheets 抓取商品...");
        const products = await fetchProducts();
        console.log("📦 取得商品資料:", products);

        if (!products || products.length === 0) {
            container.innerHTML = "<p>目前暫無商品上架，敬請期待。</p>";
            return;
        }

        // 4. 呼叫 render.js 裡的渲染函式 (將資料傳遞過去)
        // 這樣 index.js 就不會塞滿一堆 HTML 標籤
        if (typeof renderProductList === "function") {
            renderProductList(container, products);
            console.log("✅ 畫面渲染完成！");
        } else {
            throw new Error("找不到 renderProductList 函式，請檢查 render.js 是否載入成功");
        }

    } catch (error) {
        console.error("❌ index.js 執行發生錯誤:", error);
        container.innerHTML = `<p style="color:red">抱歉，資料讀取失敗，請重新整理網頁。</p>`;
    }
});
