// assets/js/render.js

function renderProductList(container, products) {
    if (!container) return;

    const html = products.map(p => {
        const s = p.sizes || {};
        
        // 1. 處理顏色 (顯示 Q 欄 colorswatch 圖片)
        const colorsHTML = p.colors && p.colors.length > 0 ? `
            <div class="color-swatches">
                ${p.colors.map(c => `
                    <div class="color-swatch-item">
                        <img src="${c.value}" title="${c.name}" onerror="this.style.backgroundColor='#ddd'">
                    </div>
                `).join('')}
            </div>
        ` : '';

        // 2. 處理三種價格 (對應 GAS 結構)
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

function renderPriceRow(label, sizeObj) {
    if (!sizeObj || (!sizeObj.price && !sizeObj.salePrice)) return '';
    const isSale = sizeObj.salePrice && Number(sizeObj.salePrice) < Number(sizeObj.price);
    return `
        <div class="price-row">
            <span class="size-label">${label}</span>
            ${isSale 
                ? `<span class="original-price">NT$${sizeObj.price}</span><span class="sale-price">NT$${sizeObj.salePrice}</span>`
                : `<span class="normal-price">NT$${sizeObj.price}</span>`
            }
        </div>
    `;
}
