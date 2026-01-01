// index.js
document.addEventListener('DOMContentLoaded', initPage);

function initPage() {
    const apiUrl = './js/api.js'; // api.js 鎖死，不能改
    // fetch API.js 或你的 JSON endpoint
    fetch(apiUrl)
        .then(res => res.json())
        .then(products => {
            generateCategories(products);
            generateProductGrid('new-grid', products.filter(p => p.collection === 'NEW'));
            generateProductGrid('collection-grid', products.filter(p => p.collection === 'COLLECTION'));
        })
        .catch(err => console.error('API fetch error:', err));
}

// 左側分類 / 品牌
function generateCategories(products) {
    const container = document.getElementById('category-list');
    const categories = [...new Set(products.map(p => p.category))];

    categories.forEach(cat => {
        const brands = [...new Set(products.filter(p => p.category === cat).map(p => p.brand))];
        const catDiv = document.createElement('div');
        catDiv.className = 'category';
        catDiv.innerHTML = `<div class="cat-title">${cat}</div>`;
        const brandList = document.createElement('ul');
        brands.forEach(brand => {
            const li = document.createElement('li');
            li.innerHTML = `<label><input type="checkbox" class="brand-checkbox" value="${brand}"> ${brand}</label>`;
            brandList.appendChild(li);
        });
        catDiv.appendChild(brandList);
        container.appendChild(catDiv);
    });
}

// 生成商品卡
function generateProductGrid(containerId, products) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    products.forEach(p => {
        const card = document.createElement('div');
        card.className = 'p-card';
        card.innerHTML = `
            <div class="p-img-box">
                <img class="p-img-main" src="./images/${p.image_main}" alt="${p.name}">
                <img class="p-img-hover" src="./images/${p.image_hover}" alt="${p.name}">
            </div>
            <div class="p-info">
                <div class="brand-tag">${p.brand}</div>
                <div class="p-name">${p.name}</div>
                <div class="p-price">
                    ${p.price_baby_10off ? `<span class="old">NT$${p.price_baby}</span> <span class="discount">NT$${p.price_baby_10off} -10%OFF</span>` : `NT$${p.price_baby}`}
                </div>
                <div class="color-swatch">
                    ${generateColorSwatch(p.color_code, p.color_pattern)}
                </div>
            </div>
        `;
        card.onclick = () => window.location.href = `detail.html?code=${p.code}`;
        container.appendChild(card);
    });
}

function generateColorSwatch(color_code, color_pattern) {
    let swatches = '';
    if(color_code) swatches += `<span class="swatch" style="background:${color_code}"></span>`;
    if(color_pattern) swatches += `<span class="swatch pattern" style="background:url('./images/${color_pattern}') center/cover"></span>`;
    return swatches;
}

// 右側購物車
function openCart() {
    document.getElementById('right-cart').classList.toggle('active');
}

function toggleLeftMenu(open) {
    document.getElementById('left-menu').classList.toggle('active', open);
}
