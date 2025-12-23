// assets/js/index.js

document.addEventListener("DOMContentLoaded", async () => {
    console.log("🚀 index.js 開始執行...");

    const container = document.getElementById("product-list");
    if (!container) {
        console.error("❌ 找不到 id='product-list' 的容器");
        return;
    }

    // 5. 顯示等待畫面：流沙商品卡 (顯示 4 張)
    container.innerHTML = `
        <div class="skeleton-grid">
            ${Array(4).fill(0).map(() => `
                <div class="skeleton-card">
                    <div class="skeleton skeleton-img"></div>
                    <div class="skeleton skeleton-text"></div>
                    <div class="skeleton skeleton-text short"></div>
                    <div class="skeleton skeleton-text short"></div>
                </div>
            `).join('')}
        </div>
    `;

    try {
        console.log("📡 正在抓取商品資料...");
        const products = await fetchProducts();
        
        if (!products || products.length === 0) {
            container.innerHTML = "<p>目前暫無商品上架。</p>";
            return;
        }

        // 呼叫渲染函式
        if (typeof renderProductList === "function") {
            renderProductList(container, products);
            console.log("✅ 畫面渲染完成！");
        } else {
            throw new Error("找不到 renderProductList 函式，請檢查 render.js");
        }

    } catch (error) {
        console.error("❌ 執行發生錯誤:", error);
        container.innerHTML = `<p style="color:red">系統忙碌中，請稍後再試。</p>`;
    }
});
