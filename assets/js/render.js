/**
 * 負責將商品資料轉化為 HTML 並放入指定的容器
 * @param {HTMLElement} container - 要放入的標籤 (例如：document.getElementById("product-list"))
 * @param {Array} products - 從 API 抓回來的商品資料陣列
 */
function renderProductList(container, products) {
    if (!container) return;

    const html = products.map(p => {
        // 價格邏輯防呆：優先取 baby 尺寸的特價，再取原價，都沒有就顯示預設文字
        const displayPrice = p.sizes?.baby?.salePrice || p.sizes?.baby?.price || p.price || "未標價";
        
        return `
            <div class="product-card">
                <a href="detail.html?code=${p.code}" class="product-link">
                    <div class="image-wrapper">
                        <img src="${p.mainImage}" alt="${p.name}" loading="lazy" 
                             onerror="this.src='https://placehold.co/300x300?text=No+Image'">
                    </div>
                    <div class="product-info">
                        <p class="brand">${p.brand || 'AiFang Kids'}</p>
                        <h3 class="name">${p.name}</h3>
                        <div class="price">NT$ ${displayPrice}</div>
                    </div>
                </a>
            </div>
        `;
    }).join('');

    container.innerHTML = html;
}
