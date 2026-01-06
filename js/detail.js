// 請務必替換為您的真實網址
const API_URL = "https://script.google.com/macros/s/AKfycbxnlAwKJucHmCKcJwv67TWuKV0X74Daag9X9I4NG7DOESREuYdU7BtWBPcEHyoJphoEfg/exec"; 

const urlParams = new URLSearchParams(window.location.search);
const productCode = urlParams.get('code');

let currentProduct = null;
let selectedOption = { color: "", size: "", price: 0 };

async function init() {
    if (!productCode) {
        alert("無效的商品代碼");
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}?code=${productCode}`);
        const data = await response.json();
        
        // 處理資料結構：支援直接回傳物件或包在 products 陣列中
        if (data.products) {
            currentProduct = data.products.find(p => p.code === productCode);
        } else {
            currentProduct = Array.isArray(data) ? data[0] : data;
        }

        if (!currentProduct) throw new Error("找不到商品");
        
        render(currentProduct);
    } catch (e) {
        console.error("載入失敗:", e);
        document.getElementById('p-title').innerText = "商品載入失敗";
    }
}

function render(p) {
    // 基礎資訊
    document.getElementById('p-title').innerText = p.name;
    document.getElementById('p-brand').innerText = p.brand;
    document.getElementById('p-id').innerText = `CODE: ${p.code}`;
    document.getElementById('styling-note').innerText = p.styling_note || "";
    document.getElementById('primary-img').src = p.image_main;

    // 詳情圖片 (image_extra)
    const imgArea = document.getElementById('image-main-area');
    if (p.image_extra) {
        const extraImgs = p.image_extra.split(',');
        extraImgs.forEach(url => {
            const img = document.createElement('img');
            img.src = url.trim();
            img.className = 'extra-img';
            img.onerror = () => img.style.display = 'none'; // 沒圖就隱藏
            imgArea.appendChild(img);
        });
    }

    // 顏色顯示
    const swatchGroup = document.getElementById('swatch-group');
    swatchGroup.innerHTML = `
        <div class="swatch-item">
            <div class="swatch-circle" style="background:${p.color_code || '#eee'}"></div>
            <span class="swatch-name">${p.color}</span>
        </div>
    `;
    selectedOption.color = p.color;

    // 尺寸與價格分組
    const sizeArea = document.getElementById('size-area');
    const categories = [
        { key: 'baby', label: 'BABY', cls: 'babe' },
        { key: 'kid', label: 'KIDS', cls: 'kids' },
        { key: 'junior', label: 'JUNIOR', cls: 'kids' },
        { key: 'adult', label: 'ADULT', cls: 'kids' }
    ];

    categories.forEach(cat => {
        const sizes = p[`sizes_${cat.key}`];
        // 優先讀取 10off 價格，沒有則讀取原價
        const price = p[`price_${cat.key}_10off`] || p[`price_${cat.key}`];

        if (sizes && sizes !== "" && price && price !== "FREE") {
            const box = document.createElement('div');
            box.className = 'size-group';
            box.innerHTML = `
                <div class="group-header">
                    <span>${cat.label}</span>
                    <span class="price-tag">NT$ ${price}</span>
                </div>
                <div>
                    ${sizes.split(',').map(s => `
                        <button class="s-btn" onclick="selectSize(this, '${cat.cls}', ${price}, '${s.trim()}')">
                            ${s.trim()}
                        </button>
                    `).join('')}
                </div>
            `;
            sizeArea.appendChild(box);
        }
    });
}

function selectSize(btn, type, price, sizeName) {
    document.querySelectorAll('.s-btn').forEach(b => b.classList.remove('active', 'babe', 'kids'));
    btn.classList.add('active', type);
    selectedOption.size = sizeName;
    selectedOption.price = price;
}

function changeQty(v) {
    const input = document.getElementById('qty');
    let n = parseInt(input.value) + v;
    if (n >= 1) input.value = n;
}

function addToCart() {
    if (!selectedOption.size) {
        alert("請選擇尺寸");
        return;
    }

    const item = {
        code: currentProduct.code,
        name: currentProduct.name,
        brand: currentProduct.brand,
        color: selectedOption.color,
        size: selectedOption.size,
        price: selectedOption.price,
        quantity: parseInt(document.getElementById('qty').value),
        image: currentProduct.image_main
    };

    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    const existing = cart.findIndex(i => i.code === item.code && i.size === item.size && i.color === item.color);
    
    if (existing > -1) cart[existing].quantity += item.quantity;
    else cart.push(item);

    localStorage.setItem('cart', JSON.stringify(cart));
    
    if (confirm("已加入購物車！要前往結帳嗎？")) {
        location.href = 'cart.html';
    }
}

window.onload = init;