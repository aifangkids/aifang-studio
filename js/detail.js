import { fetchProducts } from './api.js';

let currentProduct = null;

async function initDetail() {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const products = await fetchProducts();
    currentProduct = products.find(p => p.code === code);

    if (currentProduct) renderDetail(currentProduct);
}

function renderDetail(p) {
    // 安全地填入內容
    if(document.getElementById('product-code')) document.getElementById('product-code').innerText = p.code;
    if(document.getElementById('product-name')) document.getElementById('product-name').innerText = p.name;
    if(document.getElementById('main-image')) document.getElementById('main-image').src = p.image_main;

    const sizeContainer = document.getElementById('size-options');
    let sizeHtml = '';

    // 生成三色按鈕系統
    if (p.sizes_baby) {
        p.sizes_baby.split(',').forEach(s => {
            sizeHtml += `<button class="btn-size-baby" data-price="${p.price_baby_10off}" data-type="baby" onclick="selectSize(this)">${s}</button>`;
        });
    }
    if (p.sizes_kid) {
        p.sizes_kid.split(',').forEach(s => {
            sizeHtml += `<button class="btn-size-kid" data-price="${p.price_kid_10off}" data-type="kids" onclick="selectSize(this)">${s}</button>`;
        });
    }
    if (p.sizes_junior) {
        p.sizes_junior.split(',').forEach(s => {
            sizeHtml += `<button class="btn-size-junior" data-price="${p.price_junior_10off}" data-type="junior" onclick="selectSize(this)">${s}</button>`;
        });
    }
    sizeContainer.innerHTML = sizeHtml;
}

// 選擇尺寸並更新價格
window.selectSize = (btn) => {
    document.querySelectorAll('.size-buttons button').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const price = btn.getAttribute('data-price');
    document.getElementById('sale-price').innerText = `NT$ ${price}`;
    document.getElementById('sale-price').setAttribute('data-current-price', price);
};

// 加入購物車
document.getElementById('add-to-cart-btn')?.addEventListener('click', () => {
    const activeSize = document.querySelector('.size-buttons button.active');
    if (!activeSize) return alert("請先選擇尺寸");

    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const newItem = {
        code: currentProduct.code,
        name: currentProduct.name,
        image: currentProduct.image_main,
        size: activeSize.innerText,
        price: Number(activeSize.getAttribute('data-price')),
        styling_with: currentProduct.styling_with, // 1+1 折扣判定用
        quantity: 1
    };

    cart.push(newItem);
    localStorage.setItem('cart', JSON.stringify(cart));
    alert("已加入購物車！");
});

initDetail();