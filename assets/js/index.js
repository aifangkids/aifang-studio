// assets/js/index.js

document.addEventListener("DOMContentLoaded", async () => {
    const container = document.getElementById("product-list");
    if (!container) return;

    // 1. 顯示流沙卡片 (佔位符)
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
        // 2. 執行抓取
        const products = await fetchProducts();
        
        // 3. 判斷並渲染
        if (products && Array.isArray(products) && products.length > 0) {
            if (typeof renderProductList === "function") {
                // 清除流沙卡片，渲染真實商品
                renderProductList(container, products);
            }
        } else {
            container.innerHTML = "<p>目前暫無商品，請稍後再來！</p>";
        }
    } catch (error) {
        console.error("❌ index.js 執行出錯:", error);
        container.innerHTML = "<p>資料載入異常，請重新整理網頁。</p>";
    }
});
