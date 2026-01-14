/**
 * AiFang Kids - detail.js 2026 最終版本
 * 優化重點：
 * 1. 修正 split() 錯誤：透過 String() 強制轉型，防止數值型態導致當機。
 * 2. 移除前端韓文顯示：韓文名稱與顏色僅保留在後端資料傳遞中，不顯示於 UI。
 * 3. 補全 status 欄位：確保結帳頁面能識別 SALE 商品，正確排除折扣。
 * 4. 支援多重分段定價：BABY / KID / JUNIOR 不同尺寸對應不同價格。
 */

const API_URL = "https://script.google.com/macros/s/AKfycbxnlAwKJucHmCKcJwv67TWuKV0X74Daag9X9I4NG7DOESREuYdU7BtWBPcEHyoJphoEfg/exec"; 

const urlParams = new URLSearchParams(window.location.search);
const productCode = urlParams.get('code');

let currentProduct = null;
let selectedColor = { name: "", hex: "", krColor: "" }; // 增加背景韓文顏色變數
let selectedItems = []; 
let colorImageMap = {}; 

/**
 * 1. 初始化頁面
 */
async function init() {
    updateCartCount();
    if (!productCode) return;
    
    try {
        const response = await fetch(`${API_URL}?code=${productCode}`);
        const data = await response.json();
        // 兼容多種 API 回傳格式
        currentProduct = data.products ? data.products.find(p => String(p.code) === String(productCode)) : (Array.isArray(data) ? data[0] : data);
        
        if (!currentProduct) throw new Error("找不到商品");
        render(currentProduct);
    } catch (e) {
        console.error("載入失敗:", e);
        const titleEl = document.getElementById('p-title');
        if (titleEl) titleEl.innerText = "商品載入失敗";
    }
}

/**
 * 2. 渲染商品資料
 */
function render(p) {
    document.getElementById('p-title').innerText = p.name;
    document.getElementById('p-brand').innerText = p.brand || "AIFANG SELECT";
    document.getElementById('p-id').innerText = `CODE: ${p.code}`;
    document.getElementById('styling-note').innerText = p.styling_note || "";
    
    // 【隱藏韓文】不顯示 p.korean_name

    // 設定主圖與圖片地圖
    const primaryImg = document.getElementById('primary-img');
    if (primaryImg) primaryImg.src = p.image_main;

    if (p.images_by_color) {
        try { colorImageMap = JSON.parse(p.images_by_color); } catch (e) { console.warn("顏色圖解析失敗"); }
    }

    // 渲染額外細節圖
    const imgArea = document.getElementById('image-main-area');
    if (p.image_extra && imgArea) {
        const existingExtras = imgArea.querySelectorAll('img:not(#primary-img)');
        existingExtras.forEach(el => el.remove());

        String(p.image_extra).split(',').forEach(url => {
            const cleanUrl = url.trim();
            if(cleanUrl) {
                const img = document.createElement('img');
                img.src = cleanUrl;
                img.style.width = "100%"; 
                img.style.display = "block";
                imgArea.appendChild(img);
            }
        });
    }

    // 渲染顏色選項 (整合韓文對應邏輯)
    const swatchGroup = document.getElementById('swatch-group');
    if (swatchGroup) {
        swatchGroup.innerHTML = ""; 
        const colorNames = String(p.color || "").split(',').map(s => s.trim());
        const colorCodes = String(p.color_code || "").split(',').map(s => s.trim());
        const colorPatterns = String(p.color_pattern || "").split(',').map(s => s.trim());
        const krColors = String(p.korean_color || "").split(',').map(s => s.trim()); // 準備背景資料

        colorNames.forEach((name, i) => {
            if (!name) return;
            const hex = colorCodes[i] || '#eee';
            const pattern = colorPatterns[i] || "";
            const krColor = krColors[i] || ""; // 背景韓文

            const item = document.createElement('div');
            item.className = "swatch-item";
            
            let innerStyle = pattern ? `background-image: url('${pattern}'); background-size: cover;` : `background: ${hex};`;

            item.innerHTML = `
                <div class="swatch-circle" style="${innerStyle}"></div>
                <span class="swatch-name">${name}</span>
            `;

            item.onclick = () => {
                const targetImg = colorImageMap[name] || p.image_main;
                selectColor(name, hex, krColor, item, targetImg);
                const mainImg = document.getElementById('primary-img');
                if (mainImg) mainImg.src = targetImg;
            };

            swatchGroup.appendChild(item);
            if (i === 0) item.click(); 
        });
    }

    // 渲染分段尺寸與價格 (重點修正：強制轉型)
    const sizeArea = document.getElementById('size-area');
    if (sizeArea) {
        sizeArea.innerHTML = ""; 
        const categories = [
            { key: 'baby', label: 'BABY', cls: 'babe' }, 
            { key: 'kid', label: 'KIDS', cls: 'kids' }, 
            { key: 'junior', label: 'JUNIOR', cls: 'kids' }, 
            { key: 'adult', label: 'ADULT', cls: 'kids' }
        ];

        categories.forEach(cat => {
            const rawSizes = p[`sizes_${cat.key}`];
            const price = p[`price_${cat.key}_10off`] || p[`price_${cat.key}`];
            
            if (rawSizes && rawSizes !== "" && price && price !== "FREE") {
                const box = document.createElement('div');
                box.className = 'size-group';
                box.innerHTML = `
                    <div class="group-header">
                        <span>${cat.label}</span>
                        <span class="price-tag">NT$ ${Number(price).toLocaleString()}</span>
                    </div>
                    <div class="s-btn-wrap">
                        ${String(rawSizes).split(',').map(s => `
                            <button class="s-btn" onclick="addToList('${s.trim()}', ${price}, '${cat.cls}')">${s.trim()}</button>
                        `).join('')}
                    </div>`;
                sizeArea.appendChild(box);
            }
        });
    }
}

/**
 * 3. 顏色選取邏輯 (隱藏韓文)
 */
function selectColor(name, hex, krColor, el, imageUrl) {
    selectedColor = { name, hex, krColor }; // krColor 僅存於變數
    document.querySelectorAll('.swatch-item').forEach(i => i.classList.remove('active'));
    el.classList.add('active');

    const mobilePreview = document.getElementById('mobile-color-preview-img');
    const mobileText = document.getElementById('mobile-color-preview-name');
    
    if (mobilePreview) mobilePreview.src = imageUrl;
    if (mobileText) mobileText.innerText = name; // UI 只顯示中文名
}

/**
 * 4. 暫存清單與購物車處理
 */
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
        selectedItems.push({ 
            key, 
            color: selectedColor.name, 
            krColor: selectedColor.krColor, // 存入暫存
            size: sizeName, 
            price, 
            quantity: 1 
        });
    }
    renderSelectedList();
    showToast(`已選擇 ${selectedColor.name} / ${sizeName}`);
}

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
        </div>`).join('');
}

function addAllToCart() {
    if (selectedItems.length === 0) { 
        showToast("請先選擇顏色與尺寸"); 
        return; 
    }
    
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    
    selectedItems.forEach(item => {
        const colorImg = (colorImageMap && colorImageMap[item.color]) ? colorImageMap[item.color] : currentProduct.image_main;

        const cartItem = { 
            code: currentProduct.code, 
            name: currentProduct.name, 
            brand: currentProduct.brand, 
            color: item.color, 
            size: item.size, 
            price: item.price, 
            quantity: item.quantity, 
            image: colorImg,
            status: currentProduct.status, // 重要：SALE 排除邏輯依據
            korean_name: currentProduct.korean_name || "", // 背景韓文
            korean_color: item.krColor // 背景韓文
        };
        
        const idx = cart.findIndex(i => i.code === cartItem.code && i.size === cartItem.size && i.color === cartItem.color);
        if (idx > -1) {
            cart[idx].quantity += cartItem.quantity;
            cart[idx].status = currentProduct.status;
        } else {
            cart.push(cartItem);
        }
    });
    
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    selectedItems = [];
    renderSelectedList();
    showToast("商品已加入購物車");
}

/**
 * 5. 通用工具與滾動監聽
 */
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

function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const countEl = document.getElementById('cart-count');
    if (countEl) countEl.innerText = cart.reduce((sum, item) => sum + item.quantity, 0);
}

window.onload = () => {
    init();
    const trigger = document.getElementById('scroll-trigger');
    const aside = document.getElementById('product-info');
    
    window.addEventListener('scroll', () => {
        if (window.innerWidth <= 900 && trigger && aside) {
            const rect = aside.getBoundingClientRect();
            if (rect.top < 150) {
                trigger.style.opacity = '0';
                trigger.style.pointerEvents = 'none';
            } else {
                trigger.style.opacity = '1';
                trigger.style.pointerEvents = 'auto';
            }
        }
    });
};

function scrollToOptions() {
    const aside = document.getElementById('product-info');
    if (aside) {
        const offset = aside.offsetTop - 70;
        window.scrollTo({ top: offset, behavior: 'smooth' });
    }
}