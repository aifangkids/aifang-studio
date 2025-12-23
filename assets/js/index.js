// assets/js/index.js

document.addEventListener("DOMContentLoaded", async () => {
    const container = document.getElementById("product-list");
    if (!container) return;

    // 1. 顯示流沙卡片
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
        // 2. 抓取資料
        const products = await fetchProducts();
        
        // 3. 渲染
        if (products && products.length > 0) {
            if (typeof renderProductList === "function") {
                renderProductList(container, products);
            }
        } else {
            container.innerHTML = "<p>目前暫無商品，請稍後再來！</p>";
        }
    } catch (error) {
        console.error("❌ index.js 錯誤:", error);
        container.innerHTML = "<p>載入異常，請重整頁面。</p>";
    }
});
