// assets/js/render.js

/**
 * 負責將商品資料轉化為 HTML 並放入指定的容器
 */
function renderProductList(container, products) {
    if (!container) return;

    const html = products.map(p => {
        const s = p.sizes || {};
        
        // 3. 處理顏色 (顯示 Q 欄 colorswatch 圖片)
        const colorsHTML = p.colors && p.colors.length > 0 ? `
            <div class="color-swatches">
                ${p.colors.map(c => `
                    <div class="color-swatch-item">
                        <img src="${c.value}" title="${c.name}" onerror="this.style.backgroundColor='#ddd'">
                    </div>
                `).join('')}
            </div>
        ` : '';

        // 2. 處理三種價格 (修正標籤：bebe, kids, elementary)
        const priceHTML = `
            <div class="price-group">
                ${renderPriceRow('bebe', s.baby)}
                ${renderPriceRow('kids', s.kids)}
                ${renderPriceRow('elementary', s.elementary)}
            </div>
        `;

        return `
            <div class="product-card">
                <div class="brand-tag">${p.brand || 'AiFang'}</div>
                
                <a href="detail.html?code=${p.code}" class="product-link">
                    <div class="image-wrapper">
                        <img src="${p.mainImage}" alt="${p.name}" loading="lazy" 
                             onerror="this.src='https://placehold.co/300x300?text=No+Image'">
                    </div>
                    <div class="product-info">
                        <h3 class="name">${p.name}</h3>
                        ${colorsHTML}
                        ${priceHTML}
                    </div>
                </a>
            </div>
        `;
    }).join('');

    container.innerHTML = html;
}

/**
 * 輔助函式：產生單一尺寸價格 HTML
 */
function renderPriceRow(label, sizeObj) {
    if (!sizeObj || (!sizeObj.price && !sizeObj.salePrice)) return '';
    
    // 確保價格是數字進行比較
    const price = Number(sizeObj.price);
    const salePrice = sizeObj.salePrice ? Number(sizeObj.salePrice) : null;
    const isSale = salePrice && salePrice < price;
    
    return `
        <div class="price-row">
            <span class="size-label">${label}</span>
            ${isSale 
                ? `<span class="original-price">NT$${price}</span><span class="sale-price">NT$${salePrice}</span>`
                : `<span class="normal-price">NT$${price}</span>`
            }
        </div>
    `;
}
