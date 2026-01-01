// index.js (正式版)
// ⚠️ 注意：不改 api.js，直接使用它提供的資料或函式
document.addEventListener('DOMContentLoaded', () => {
    try {
        initPage();
    } catch (err) {
        console.error("初始化頁面錯誤", err);
    }
});

function initPage() {
    // 1️⃣ 動態生成分類 / 品牌
    generateCategories(products); // 假設 api.js 有全域變數 products

    // 2️⃣ 分流 NEW / COLLECTION
    const newProducts = products.filter(p => p.collection === 'NEW' && p.status === 'ACTIVE');
    const collectionProducts = products.filter(p => p.collection === 'COLLECTION' && p.status === 'ACTIVE');

    generateProductGrid('new-grid', newProducts);
    generateProductGrid('collection-grid', collectionProducts);

    // 3️⃣ 購物車初始化
    renderCart();
}

// -------------------- 左側分類 / 品牌 --------------------
function generateCategories(products) {
    const container = document.getElementById('category-container');
    const categoryMap = {};

    products.forEach(p => {
        if(p.status !== 'ACTIVE') return;
        if(!categoryMap[p.category]) categoryMap[p.category] = new Set();
        categoryMap[p.category].add(p.brand);
    });

    let html = '';
    Object.keys(categoryMap).forEach(cat => {
        html += `<div class="cat-item">${cat}<div class="brands">`;
        categoryMap[cat].forEach(brand => {
            html += `<label><input type="checkbox" class="brand-filter" value="${brand}"> ${brand}</label>`;
        });
        html += `</div></div>`;
    });

    container.innerHTML = html;

    // 篩選事件
    container.querySelectorAll('.brand-filter').forEach(cb => {
        cb.addEventListener('change', filterProductsByBrand);
    });
}

function filterProductsByBrand() {
    const checkedBrands = Array.from(document.querySelectorAll('.brand-filter:checked')).map(cb=>cb.value);
    const newProducts = products.filter(p => p.collection==='NEW' && p.status==='ACTIVE' && (checkedBrands.length===0 || checkedBrands.includes(p.brand)));
    const collectionProducts = products.filter(p => p.collection==='COLLECTION' && p.status==='ACTIVE' && (checkedBrands.length===0 || checkedBrands.includes(p.brand)));

    generateProductGrid('new-grid', newProducts);
    generateProductGrid('collection-grid', collectionProducts);
}

// -------------------- 生成商品卡 --------------------
function generateProductGrid(containerId, items) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';

    items.forEach(p => {
        const soldOut = !p.price_baby && !p.price_kid && !p.price_junior && !p.price_adult;
        const priceHtml = soldOut ? `<span class="sold-out">SOLD OUT</span>` :
            (p.price_baby_10off ? `<span class="price-off">NT$ ${p.price_baby_10off} <del>${p.price_baby}</del></span>` : `<span class="price">NT$ ${p.price_baby}</span>`);

        let colorHtml = '';
        if(p.color_code) {
            const colors = p.color_code.split(',');
            colors.forEach(c=>colorHtml+=`<span class="color-dot" style="background:${c}"></span>`);
        }
        container.innerHTML += `
        <div class="p-card" onclick="location.href='detail.html?code=${p.code}'">
            <div class="p-img-box">
                <img src="./images/${p.image_main}" class="p-img-main">
                ${p.image_hover ? `<img src="./images/${p.image_hover}" class="p-img-hover">` : ''}
            </div>
            <div class="p-info">
                <div class="brand-tag">${p.brand}</div>
                <div class="p-name">${p.name}</div>
                <div class="p-price">${priceHtml}</div>
                <div class="color-container">${colorHtml}</div>
            </div>
        </div>`;
    });
}

// -------------------- 購物車 --------------------
function renderCart() {
    const cartContainer = document.getElementById('cart-container');
    cartContainer.innerHTML = `<p>購物車預覽</p>`;
}

// -------------------- 側邊欄控制 --------------------
function openNav(id){document.getElementById(id).classList.add('active');document.getElementById('overlay').style.display='block';}
function closeAll(){document.getElementById('left-menu').classList.remove('active');document.getElementById('right-cart').classList.remove('active');document.getElementById('overlay').style.display='none';}
