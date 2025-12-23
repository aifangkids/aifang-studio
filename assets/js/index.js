// assets/js/index.js
document.addEventListener("DOMContentLoaded", async () => {
    const container = document.getElementById("product-list");
    if (!container) return;

    // 1. 顯示流沙卡片 (Loading)
    container.innerHTML = `<div class="skeleton-grid">${Array(4).fill('<div class="skeleton-card"><div class="skeleton skeleton-img"></div><div class="skeleton skeleton-text"></div></div>').join('')}</div>`;

    try {
        // 2. 呼叫 api.js 抓取 products 分頁資料
        const products = await fetchProducts();
        
        if (products && products.length > 0) {
            // 3. 呼叫 render.js 畫出商品
            renderProductList(container, products);
        } else {
            container.innerHTML = "<p>目前試算表中暫無商品資料。</p>";
        }
    } catch (error) {
        container.innerHTML = "<p>連線失敗，請檢查網路。</p>";
    }
});
