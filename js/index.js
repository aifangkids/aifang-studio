import { fetchProducts } from './api.js';

async function initIndex() {
    const products = await fetchProducts();
    renderFilters(products);
    renderProducts(products);
}

// 1. 動態生成分類與品牌篩選器 [cite: 52-54]
function renderFilters(products) {
    const categories = [...new Set(products.map(p => p.category))];
    const brands = [...new Set(products.map(p => p.brand))];

    const filterNav = document.getElementById('dynamic-filter');
    filterNav.innerHTML = `
        <div class="filter-group">
            <h4>Category</h4>
            ${categories.map(cat => `<label><input type="checkbox" value="${cat}" class="filter-cat"> ${cat}</label>`).join('')}
        </div>
        <div class="filter-group">
            <h4>Brand</h4>
            ${brands.map(br => `<label><input type="checkbox" value="${br}" class="filter-brand"> ${br}</label>`).join('')}
        </div>
    `;
}

// 2. 渲染商品卡片 [cite: 4, 55-60]
function renderProducts(products) {
    const grid = document.getElementById('product-grid');
    grid.innerHTML = products.map(p => {
        // 智慧售罄判斷：若三種價格都沒填則顯示 SOLD OUT [cite: 55]
        const isSoldOut = (!p.price_baby && !p.price_kid && !p.price_junior);
        
        return `
            <div class="product-card ${isSoldOut ? 'sold-out' : ''}" onclick="location.href='detail.html?code=${p.code}'">
                <div class="card-image">
                    ${isSoldOut ? '<div class="soldout-badge">SOLD OUT</div>' : ''}
                    <div class="brand-tag">${p.brand}</div>
                    <img src="${p.image_main}" alt="${p.name}">
                </div>
                <div class="card-info">
                    <p class="kor-name">${p.korean_name}</p>
                    <p class="name">${p.name}</p>
                    <div class="price-row">
                        <span class="original-price">NT$ ${p.price_kid}</span>
                        <span class="sale-price">NT$ ${p.price_kid_10off}</span>
                        <span class="discount-tag">-10%OFF</span>
                    </div>
                    <div class="swatches">
                        <span class="dot" style="background-color: ${p.color_code}"></span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

initIndex();