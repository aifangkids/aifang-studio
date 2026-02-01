/**
 * AiFang Kids - detail.js 2026 最終優化版
 * 1. 價格邏輯：對接 api.js 預處理數據 (price_final)
 * 2. UI 優化：3 種尺寸分組按鈕顏色優化
 * 3. 資料保留：背景儲存韓文、SALE 狀態
 */

const urlParams = new URLSearchParams(window.location.search);
const productCode = urlParams.get('code');

let currentProduct = null;
let selectedColor = { name: "", hex: "", krColor: "", image: "" }; 
let selectedItems = []; 
let colorImageMap = {}; 

/**
 * 1. 初始化頁面
 */
async function init() {
    updateCartCount();
    if (!productCode) return;
    
    try {
        // ApiService 已在 api.js 中處理好 9 折邏輯與 price_final 欄位
        const product = await ApiService.getProductByCode(productCode);
        
        if (!product) throw new Error("找不到商品");
        currentProduct = product;
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
    
    const primaryImg = document.getElementById('primary-img');
    if (primaryImg) primaryImg.src = p.image_main;

    // 解析顏色圖片映射
    if (p.images_by_color) {
        try { 
            colorImageMap = typeof p.images_by_color === 'string' ? JSON.parse(p.images_by_color) : p.images_by_color; 
        } catch (e) { console.warn("顏色對應圖解析失敗"); }
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
                imgArea.appendChild(img);
            }
        });
    }

    // 渲染顏色選項
    renderColorSwatches(p);

    // 渲染尺寸與價格 (重點優化區)
    renderSizeGroups(p);
}

/**
 * 3. 渲染尺寸分組與按鈕顏色 (核心優化)
 */
function renderSizeGroups(p) {
    const sizeArea = document.getElementById('size-area');
    if (!sizeArea) return;
    sizeArea.innerHTML = ""; 

    const status = (String(p.status) || "").toUpperCase();
    const isSale = status === 'SALE';

    // 定義各分組的按鈕顏色 (CSS Class)
    const groups = [
        { key: 'baby', label: 'BABY', colorClass: 'btn-baby' }, 
        { key: 'kid', label: 'KIDS', colorClass: 'btn-kid' }, 
        { key: 'junior', label: 'JUNIOR', colorClass: 'btn-junior' }, 
        { key: 'adult', label: 'ADULT', colorClass: 'btn-junior' } // JUNIOR/ADULT 共用深色
    ];

    groups.forEach(group => {
        const rawSizes = p[`sizes_${group.key}`];
        // 重要：這裡的價格要根據 api.js 的折扣邏輯顯示
        const originalPrice = Number(p[`price_${group.key}`] || 0);
        
        // 如果該分類沒有尺寸或價格為 0，則不顯示
        if (rawSizes && rawSizes !== "" && originalPrice > 0) {
            
            // 計算該分類的折扣價 (比照 api.js 邏輯)
            const finalPrice = isSale ? originalPrice : Math.round(originalPrice * 0.9);

            const box = document.createElement('div');
            box.className = 'size-group';
            
            // 價格顯示區塊 (配合刪除線樣式)
            const priceDisplay = isSale 
                ? `<span class="price-final sale-red">NT$ ${finalPrice.toLocaleString()}</span> <span class="badge-sale-mini">SALE</span>`
                : `<span class="price-original">NT$ ${originalPrice.toLocaleString()}</span> <span class="price-final">NT$ ${finalPrice.toLocaleString()}</span>`;

            box.innerHTML = `
                <div class="group-header">
                    <span class="group-label">${group.label}</span>
                    <div class="price-tag-wrap">${priceDisplay}</div>
                </div>
                <div class="s-btn-wrap">
                    ${String(rawSizes).split(',').map(s => `
                        <button class="s-btn ${group.colorClass}" onclick="addToList('${s.trim()}', ${finalPrice})">${s.trim()}</button>
                    `).join('')}
                </div>`;
            sizeArea.appendChild(box);
        }
    });
}

/**
 * 4. 顏色選取與渲染
 */
function renderColorSwatches(p) {
    const swatchGroup = document.getElementById('swatch-group');
    if (!swatchGroup) return;
    swatchGroup.innerHTML = ""; 

    const colorNames = String(p.color || "").split(',').map(s => s.trim());
    const colorCodes = String(p.color_code || "").split(',').map(s => s.trim());
    const colorPatterns = String(p.color_pattern || "").split(',').map(s => s.trim());
    const krColors = String(p.korean_color || "").split(',').map(s => s.trim());

    colorNames.forEach((name, i) => {
        if (!name) return;
        const hex = colorCodes[i] || '#eee';
        const pattern = colorPatterns[i] || "";
        const krColor = krColors[i] || ""; 

        const item = document.createElement('div');
        item.className = "swatch-item";
        let innerStyle = pattern ? `background-image: url('${pattern}'); background-size: cover;` : `background: ${hex};`;

        item.innerHTML = `
            <div class="swatch-circle" style="${innerStyle}"></div>
            <span class="swatch-name">${name}</span>
        `;

        item.onclick = () => {
            const targetImg = colorImageMap[name] || p.image_main;
            selectedColor = { name, hex, krColor, image: targetImg }; 
            document.querySelectorAll('.swatch-item').forEach(el => el.classList.remove('active'));
            item.classList.add('active');
            
            // 更新主圖與手機預覽
            const primaryImg = document.getElementById('primary-img');
            if (primaryImg) primaryImg.src = targetImg;
            
            const mobileImg = document.getElementById('mobile-color-preview-img');
            const mobileText = document.getElementById('mobile-color-preview-name');
            if (mobileImg) mobileImg.src = targetImg;
            if (mobileText) mobileText.innerText = name;
        };

        swatchGroup.appendChild(item);
        if (i === 0) item.click();
    });
}

/**
 * 5. 購物清單邏輯
 */
function addToList(sizeName, price) {
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
            krColor: selectedColor.krColor,
            size: sizeName, 
            price: price, // 這已經是打折後的 price_final
            quantity: 1,
            image: selectedColor.image 
        });
    }
    renderSelectedList();
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

/**
 * 6. 加入購物車
 */
function addAllToCart() {
    if (selectedItems.length === 0) { 
        showToast("請先選擇顏色與尺寸"); 
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
            price: item.price, // 存入打折後的價格
            quantity: item.quantity, 
            image: item.image,
            status: currentProduct.status,
            korean_name: currentProduct.korean_name || "", 
            korean_color: item.krColor 
        };
        
        const idx = cart.findIndex(i => i.code === cartItem.code && i.size === cartItem.size && i.color === cartItem.color);
        if (idx > -1) {
            cart[idx].quantity += cartItem.quantity;
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
 * 通用工具
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

window.addEventListener('load', init);