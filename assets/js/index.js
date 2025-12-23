// assets/js/index.js

document.addEventListener("DOMContentLoaded", async () => {
    const container = document.getElementById("product-list");
    if (!container) return;

    // 顯示流沙卡片 (4張)
    container.innerHTML = `
        <div class="skeleton-grid">
            ${Array(4).fill(0).map(() => `
                <div class="skeleton-card">
                    <div class="skeleton skeleton-img"></div>
                    <div class="skeleton skeleton-text"></div>
                    <div class="skeleton skeleton-text short"></div>
                </div>
            `).join('')}
        </div>
    `;

    try {
        // 執行抓取
        const products = await fetchProducts();
        
        if (!products || products.length === 0) {
            container.innerHTML = "<p>目前暫無商品，請稍後再來！</p>";
            return;
        }

        // 渲染畫面
        if (typeof renderProductList === "function") {
            renderProductList(container, products);
        } else {
            console.error("❌ 找不到 renderProductList 函式，請檢查 render.js 是否載入");
        }
    } catch (error) {
        console.error("❌ index.js 執行出錯:", error);
        container.innerHTML = "<p>資料載入異常，請重新整理網頁。</p>";
    }
});
