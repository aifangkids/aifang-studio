import { fetchProducts } from './api.js';

async function initDetail() {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const products = await fetchProducts();
    const product = products.find(p => p.code === code);

    if (product) renderDetail(product);
}

function renderDetail(p) {
    document.getElementById('brand-tag').innerText = p.brand;
    document.getElementById('product-name').innerText = p.name;
    document.getElementById('main-image').src = p.image_main;

    // 1+1 提示判定 [cite: 72]
    if (p.styling_with && p.styling_with.length > 0) {
        document.getElementById('bundle-alert').style.display = 'block';
    }

    // 三色尺寸按鈕系統 [cite: 74, 77]
    const sizeContainer = document.getElementById('size-options');
    let sizeHtml = '';

    if (p.sizes_baby) {
        p.sizes_baby.split(',').forEach(s => {
            sizeHtml += `<button class="btn-size-baby" onclick="updatePrice(${p.price_baby_10off})">${s}</button>`;
        });
    }
    if (p.sizes_kid) {
        p.sizes_kid.split(',').forEach(s => {
            sizeHtml += `<button class="btn-size-kid" onclick="updatePrice(${p.price_kid_10off})">${s}</button>`;
        });
    }
    if (p.sizes_junior) {
        p.sizes_junior.split(',').forEach(s => {
            sizeHtml += `<button class="btn-size-junior" onclick="updatePrice(${p.price_junior_10off})">${s}</button>`;
        });
    }
    sizeContainer.innerHTML = sizeHtml;
}

// 即時價格切換函式 [cite: 74, 77]
window.updatePrice = (price) => {
    document.getElementById('sale-price').innerText = `NT$ ${price}`;
};

// 加入購物車邏輯 [cite: 76]
document.getElementById('add-to-cart-btn')?.addEventListener('click', () => {
    const selectedItem = {
        code: document.getElementById('product-code').innerText,
        // ...其餘規格收集
    };
    // 儲存至 localStorage
    alert('已加入購物車');
});

initDetail();