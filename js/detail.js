const API_URL = "https://script.google.com/macros/s/AKfycbxnlAwKJucHmCKcJwv67TWuKV0X74Daag9X9I4NG7DOESREuYdU7BtWBPcEHyoJphoEfg/exec"; 

const urlParams = new URLSearchParams(window.location.search);
const productCode = urlParams.get('code');

let currentProduct = null;
let selectedColor = { name: "", hex: "" };
let selectedItems = []; // 儲存 Bellot 樣式的待購清單

async function init() {
    updateCartCount();

    if (!productCode) {
        console.log("No product code found in URL.");
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}?code=${productCode}`);
        const data = await response.json();
        
        if (data.products) {
            currentProduct = data.products.find(p => p.code === productCode);
        } else {
            currentProduct = Array.isArray(data) ? data[0] : data;
        }

        if (!currentProduct) throw new Error("找不到商品");
        
        render(currentProduct);
    } catch (e) {
        console.error("載入失敗:", e);
        const titleEl = document.getElementById('p-title');
        if(titleEl) titleEl.innerText = "商品載入失敗";
    }
}

function render(p) {
    document.getElementById('p-title').innerText = p.name;
    document.getElementById('p-brand').innerText = p.brand || "AIFANG SELECT";
    document.getElementById('p-id').innerText = `CODE: ${p.code}`;
    document.getElementById('styling-note').innerText = p.styling_note || "";
    document.getElementById('primary-img').src = p.image_main;

    const imgArea = document.getElementById('image-main-area');
    if (p.image_extra) {
        const extraImgs = p.image_extra.split(',');
        extraImgs.forEach(url => {
            const cleanUrl = url.trim();
            if(cleanUrl) {
                const img = document.createElement('img');
                img.src = cleanUrl;
                img.className = 'extra-img';
                img.onerror = () => img.remove();
                imgArea.appendChild(img);
            }
        });
    }

    // --- 顏色選擇 (第一步) ---
    const swatchGroup = document.getElementById('swatch-group');
    // 預設選中第一個顏色
    selectedColor = { name: p.color, hex: p.color_code || '#eee' };
    
    swatchGroup.innerHTML = `
        <div class="swatch-item active" onclick="selectColor('${p.color}', '${p.color_code || '#eee'}', this)">
            <div class="swatch-circle" style="background:${p.color_code || '#eee'}"></div>
            <span class="swatch-name">${p.color}</span>
        </div>
    `;

    // --- 尺寸與價格 (第二步) ---
    const sizeArea = document.getElementById('size-area');
    sizeArea.innerHTML = ""; 
    const categories = [
        { key: 'baby', label: 'BABY', cls: 'babe' },
        { key: 'kid', label: 'KIDS', cls: 'kids' },
        { key: 'junior', label: 'JUNIOR', cls: 'kids' },
        { key: 'adult', label: 'ADULT', cls: 'kids' }
    ];

    categories.forEach(cat => {
        const sizes = p[`sizes_${cat.key}`];
        const price = p[`price_${cat.key}_10off`] || p[`price_${cat.key}`];

        if (sizes && sizes !== "" && price && price !== "FREE") {
            const box = document.createElement('div');
            box.className = 'size-group';
            box.innerHTML = `
                <div class="group-header">
                    <span>${cat.label}</span>
                    <span class="price-tag">NT$ ${Number(price).toLocaleString()}</span>
                </div>
                <div>
                    ${sizes.split(',').map(s => `
                        <button class="s-btn" onclick="addToList('${s.trim()}', ${price}, '${cat.cls}')">
                            ${s.trim()}
                        </button>
                    `).join('')}
                </div>
            `;
            sizeArea.appendChild(box);
        }
    });
}

// 選擇顏色邏輯
function selectColor(name, hex, el) {
    selectedColor = { name: name, hex: hex };
    document.querySelectorAll('.swatch-item').forEach(item => item.classList.remove('active'));
    el.classList.add('active');
}

// 點擊尺寸後，新增到 Bellot 樣式的清單中 (不直接入庫，先列出)
function addToList(sizeName, price, type) {
    if (!selectedColor.name) {
        alert("請先選擇顏色");
        return;
    }

    const key = `${selectedColor.name}-${sizeName}`;
    const existing = selectedItems.find(i => i.key === key);

    if (existing) {
        existing.quantity += 1;
    } else {
        selectedItems.push({
            key: key,
            color: selectedColor.name,
            size: sizeName,
            price: price,
            quantity: 1
        });
    }
    renderSelectedList();
}

// 渲染 Bellot 待選清單
function renderSelectedList() {
    const listArea = document.getElementById('selected-list');
    if (!listArea) return;

    listArea.innerHTML = selectedItems.map((item, index) => `
        <div class="selected-item">
            <img src="./images/ui/btn_close.jpg" class="sel-close" onclick="removeFromList(${index})">
            <div class="sel-info">${item.color} / ${item.size}</div>
            <div class="sel-bottom">
                <div class="qty-box">
                    <button class="qty-btn" onclick="updateListQty(${index}, -1)">-</button>
                    <input type="text" class="qty-input" value="${item.quantity}" readonly>
                    <button class="qty-btn" onclick="updateListQty(${index}, 1)">+</button>
                </div>
                <div class="sel-price">NT$ ${(item.price * item.quantity).toLocaleString()}</div>
            </div>
        </div>
    `).join('');
}

function updateListQty(index, delta) {
    if (selectedItems[index].quantity + delta > 0) {
        selectedItems[index].quantity += delta;
        renderSelectedList();
    }
}

function removeFromList(index) {
    selectedItems.splice(index, 1);
    renderSelectedList();
}

// 手機版抽屜控制
function toggleDrawer(isOpen) {
    const drawer = document.getElementById('product-drawer');
    const overlay = document.getElementById('overlay');
    if (isOpen) {
        drawer.classList.add('open');
        overlay.classList.add('active');
    } else {
        drawer.classList.remove('open');
        overlay.classList.remove('active');
    }
}

// 最終：將清單內所有東西加入購物車
function addAllToCart() {
    if (selectedItems.length === 0) {
        alert("請先選擇顏色與尺寸");
        return;
    }

    let cart = JSON.parse(localStorage.getItem('cart')) || [];

    selectedItems.forEach(item => {
        const cartItem = {
            code: currentProduct.code,
            name: currentProduct.name,
            brand: currentProduct.brand,
            color: item.color,
            size: item.size,
            price: item.price,
            quantity: item.quantity,
            image: currentProduct.image_main
        };

        const idx = cart.findIndex(i => i.code === cartItem.code && i.size === cartItem.size && i.color === cartItem.color);
        if (idx > -1) cart[idx].quantity += cartItem.quantity;
        else cart.push(cartItem);
    });

    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    
    // 清空目前選擇清單
    selectedItems = [];
    renderSelectedList();

    // 關閉手機抽屜
    if (window.innerWidth <= 900) toggleDrawer(false);

    if (confirm("已加入購物車！要前往結帳嗎？")) {
        location.href = 'cart.html';
    }
}

function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const totalQty = cart.reduce((sum, item) => sum + (item.quantity || 0), 0);
    const countEl = document.getElementById('cart-count');
    if (countEl) countEl.innerText = totalQty;
}

window.onload = init;