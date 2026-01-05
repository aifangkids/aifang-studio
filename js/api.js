const API_URL = 'https://script.google.com/macros/s/AKfycbxnlAwKJucHmCKcJwv67TWuKV0X74Daag9X9I4NG7DOESREuYdU7BtWBPcEHyoJphoEfg/exec';

export async function loadProducts() {
    try {
        const response = await fetch(API_URL);
        const data = await response.json();
        renderProducts(data.products); // 將資料傳給渲染函式
    } catch (error) {
        console.error("無法取得商品資料，請檢查 GAS 部署權限", error);
    }
}

function renderProducts(products) {
    const container = document.getElementById('product-list');
    container.innerHTML = products.map(p => `
        <div class="product-card">
            <div class="brand-label">${p.brand}</div>
            <img src="${p.image_main}" alt="${p.name}">
            <h3>${p.name}</h3>
            <p class="price-original">NT$ ${p.price_kid}</p>
            <p class="price-discount">NT$ ${p.price_kid_10off} <span class="percent">-10%OFF</span></p>
            <div class="swatches">
                <span class="dot" style="background-color: ${p.color_code}"></span>
            </div>
        </div>
    `).join('');
}