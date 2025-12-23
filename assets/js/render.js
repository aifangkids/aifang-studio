/**
 * 負責將商品資料轉化為 HTML 並放入指定的容器 (支援多價格、特價、顏色顯示)
 */
function renderProductList(container, products) {
    if (!container) return;

    const html = products.map(p => {
        // --- 1. 處理價格邏輯 ---
        // 這裡假設你的 JSON 結構中有 p.sizes.baby, p.sizes.toddler, p.sizes.kids
        const s = p.sizes || {};
        const priceHTML = `
            <div class="price-group">
                ${renderPriceRow('嬰幼', s.baby)}
                ${renderPriceRow('小童', s.toddler)}
                ${renderPriceRow('中大童', s.kids)}
            </div>
        `;

        // --- 2. 處理顏色邏輯 ---
        // 假設 p.colors 是一個字串陣列，例如 ["#FF0000", "藍色"]
        const colorsHTML = p.colors ? `
            <div class="color-swatches">
                ${p.colors.map(c => `<span class="color-dot" style="background-color: ${c}" title="${c}"></span>`).join('')}
            </div>
        ` : '';

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
                        
                        ${colorsHTML} ${priceHTML}  </div>
                </a>
            </div>
        `;
    }).join('');

    container.innerHTML = html;
}

/**
 * 輔助函式：產生單一尺寸價格 HTML (含特價判斷)
 */
function renderPriceRow(label, sizeObj) {
    if (!sizeObj || (!sizeObj.price && !sizeObj.salePrice)) return '';
    
    const isSale = sizeObj.salePrice && sizeObj.salePrice < sizeObj.price;
    
    return `
        <div class="price-row">
            <span class="size-label">${label}:</span>
            ${isSale 
                ? `<span class="original-price">NT$${sizeObj.price}</span>
                   <span class="sale-price">NT$${sizeObj.salePrice}</span>`
                : `<span class="normal-price">NT$${sizeObj.price}</span>`
            }
        </div>
    `;
}
