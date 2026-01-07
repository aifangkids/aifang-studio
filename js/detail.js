const API_URL = "https://script.google.com/macros/s/AKfycbxnlAwKJucHmCKcJwv67TWuKV0X74Daag9X9I4NG7DOESREuYdU7BtWBPcEHyoJphoEfg/exec"; 

const urlParams = new URLSearchParams(window.location.search);
const productCode = urlParams.get('code');

let currentProduct = null;
let selectedColor = { name: "", hex: "" };
let selectedItems = []; 
let colorImageMap = {}; // 用於儲存解析後的顏色圖片對照表

async function init() {
    updateCartCount();
    if (!productCode) return;
    
    try {
        const response = await fetch(`${API_URL}?code=${productCode}`);
        const data = await response.json();
        currentProduct = data.products ? data.products.find(p => p.code === productCode) : (Array.isArray(data) ? data[0] : data);
        if (!currentProduct) throw new Error("找不到商品");
        render(currentProduct);
    } catch (e) {
        console.error("載入失敗:", e);
        document.getElementById('p-title').innerText = "商品載入失敗";
    }
}

function render(p) {
    // 基礎資訊渲染
    document.getElementById('p-title').innerText = p.name;
    document.getElementById('p-brand').innerText = p.brand || "AIFANG SELECT";
    document.getElementById('p-id').innerText = `CODE: ${p.code}`;
    document.getElementById('styling-note').innerText = p.styling_note || "";
    document.getElementById('primary-img').src = p.image_main;

    // --- 【優化】解析 JSON 顏色聯動圖片 ---
    if (p.images_by_color) {
        try {
            // 處理從 API 傳來的字串格式 JSON
            colorImageMap = JSON.parse(p.images_by_color);
        } catch (e) {
            console.warn("images_by_color 解析失敗:", e);
        }
    }

    // 處理副圖 (原本的副圖列表邏輯)
    const imgArea = document.getElementById('image-main-area');
    if (p.image_extra) {
        p.image_extra.split(',').forEach(url => {
            const cleanUrl = url.trim();
            if(cleanUrl) {
                const img = document.createElement('img');
                img.src = cleanUrl;
                imgArea.appendChild(img);
            }
        });
    }

    // --- 【優化】多顏色方框渲染邏輯 ---
    const swatchGroup = document.getElementById('swatch-group');
    swatchGroup.innerHTML = ""; 

    const colorNames = p.color ? p.color.toString().split(',').map(s => s.trim()) : [];
    const colorCodes = p.color_code ? p.color_code.toString().split(',').map(s => s.trim()) : [];
    const colorPatterns = p.color_pattern ? p.color_pattern.toString().split(',').map(s => s.trim()) : [];

    colorNames.forEach((name, i) => {
        const hex = colorCodes[i] || '#eee';
        const pattern = colorPatterns[i] || "";
        
        const item = document.createElement('div');
        item.className = "swatch-item";
        
        // 優先顯示花色圖片，其次色碼，最後預設灰色
        let innerStyle = "";
        if (pattern) {
            innerStyle = `background-image: url('${pattern}'); background-size: cover;`;
        } else {
            innerStyle = `background: ${hex};`;
        }

        item.innerHTML = `
            <div class="swatch-circle" style="${innerStyle}"></div>
            <span class="swatch-name">${name}</span>
        `;

        // 點擊事件：切換選取樣式 + 切換聯動圖片
        item.onclick = () => {
            selectColor(name, hex, item);
            
            // 聯動圖片切換邏輯
            const mainImg = document.getElementById('primary-img');
            if (colorImageMap[name]) {
                mainImg.src = colorImageMap[name];
            } else {
                mainImg.src = p.image_main; // 若無對應圖則回歸預設主圖
            }
        };

        swatchGroup.appendChild(item);

        // 預設點擊第一個顏色
        if (i === 0) {
            item.click();
        }
    });

    // --- 【原本邏輯保留】尺寸與價格 ---
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
                <div class="s-btn-wrap">
                    ${sizes.split(',').map(s => `<button class="s-btn" onclick="addToList('${s.trim()}', ${price}, '${cat.cls}')">${s.trim()}</button>`).join('')}
                </div>`;
            sizeArea.appendChild(box);
        }
    });
}

function selectColor(name, hex, el) {
    selectedColor = { name, hex };
    document.querySelectorAll('.swatch-item').forEach(i => i.classList.remove('active'));
    el.classList.add('active');
}

function addToList(sizeName, price, type) {
    if (!selectedColor.name) {
        showToast("請先選擇顏色");
        return;
    }
    const key = `${selectedColor.name}-${sizeName}`;
    const existing = selectedItems.find(i => i.key === key);
    if (existing) {
        existing.quantity += 1;
    } else {
        selectedItems.push({ key, color: selectedColor.name, size: sizeName, price, quantity: 1 });
    }
    renderSelectedList();
    showToast(`已選擇 ${selectedColor.name} / ${sizeName}`);
}

function renderSelectedList() {
    const listArea = document.getElementById('selected-list');
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
        </div>`).join('');
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

function showToast(msg) {
    const toast = document.getElementById('custom-toast');
    if (toast) {
        toast.innerText = msg;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 2000);
    }
}

function addAllToCart() {
    if (selectedItems.length === 0) { showToast("請先選擇顏色與尺寸"); return; }
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    
    selectedItems.forEach(item => {
        // --- 【關鍵優化】判斷要存入哪張圖片 ---
        // 如果 colorImageMap 裡有當前顏色的圖，就用那張；否則用主圖
        const colorImg = (colorImageMap && colorImageMap[item.color]) 
                         ? colorImageMap[item.color] 
                         : currentProduct.image_main;

        const cartItem = { 
            code: currentProduct.code, 
            name: currentProduct.name, 
            brand: currentProduct.brand, 
            color: item.color, 
            size: item.size, 
            price: item.price, 
            quantity: item.quantity, 
            image: colorImg  // <--- 這裡改存顏色對應圖
        };
        
        const idx = cart.findIndex(i => i.code === cartItem.code && i.size === cartItem.size && i.color === cartItem.color);
        if (idx > -1) cart[idx].quantity += cartItem.quantity;
        else cart.push(cartItem);
    });
    
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    selectedItems = [];
    renderSelectedList();
    showToast("商品已加入購物車");
}

function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const countEl = document.getElementById('cart-count');
    if (countEl) countEl.innerText = cart.reduce((sum, item) => sum + item.quantity, 0);
}

window.onload = init;