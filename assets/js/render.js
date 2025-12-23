/**
 * 負責渲染商品列表
 */
function renderProductList(container, products) {
    if (!container) return;

    const html = products.map(p => {
        const s = p.sizes || {};
        
        // 修正色碼判斷：支援網址圖片與純顏色
        const colorsHTML = p.colors && p.colors.length > 0 ? `
            <div class="color-swatches">
                ${p.colors.map(c => {
                    const val = c.value.trim();
                    // 檢查是否為圖片網址 (以 http 開頭)
                    const isUrl = val.toLowerCase().startsWith('http');
                    
                    // 如果是網址，使用背景圖；否則使用背景顏色
                    const style = isUrl 
                        ? `background-image: url('${val}'); background-color: transparent;` 
                        : `background-color: ${val};`;
                    
                    return `<div class="swatch-dot" style="${style}" title="${c.name}"></div>`;
                }).join('')}
            </div>
        ` : '';

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
