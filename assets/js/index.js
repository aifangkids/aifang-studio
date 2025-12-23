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
        const products = await fetchProducts();
        if (!products || products.length === 0) {
            container.innerHTML = "<p>目前暫無商品。</p>";
            return;
        }

        if (typeof renderProductList === "function") {
            renderProductList(container, products);
        }
    } catch (error) {
        console.error("API Error:", error);
        container.innerHTML = "<p>讀取失敗，請重新整理。</p>";
    }
});
