/**
 * AiFang Kids - detail.js 完整優化版
 * 修正重點：
 * 1. 補全 status 欄位傳遞，解決結帳頁 SALE 折扣排除失效問題。
 * 2. 修正圖片渲染邏輯，防止 innerHTML 清空導致主圖切換功能失效。
 */

const API_URL = "https://script.google.com/macros/s/AKfycbxnlAwKJucHmCKcJwv67TWuKV0X74Daag9X9I4NG7DOESREuYdU7BtWBPcEHyoJphoEfg/exec"; 

const urlParams = new URLSearchParams(window.location.search);
const productCode = urlParams.get('code');

let currentProduct = null;
let selectedColor = { name: "", hex: "" };
let selectedItems = []; 
let colorImageMap = {}; 

/**
 * 初始化頁面
 */
async function init() {
    updateCartCount();
    if (!productCode) return;
    
    try {
        const response = await fetch(`${API_URL}?code=${productCode}`);
        const data = await response.json();
        // 兼容多種 API 回傳格式
        currentProduct = data.products ? data.products.find(p => p.code === productCode) : (Array.isArray(data) ? data[0] : data);
        
        if (!currentProduct) throw new Error("找不到商品");
        render(currentProduct);
    } catch (e) {
        console.error("載入失敗:", e);
        const titleEl = document.getElementById('p-title');
        if (titleEl) titleEl.innerText = "商品載入失敗";
    }
}

/**
 * 渲染商品資料
 */
function render(p) {
    document.getElementById('p-title').innerText = p.name;
    document.getElementById('p-brand').innerText = p.brand || "AIFANG SELECT";
    document.getElementById('p-id').innerText = `CODE: ${p.code}`;
    document.getElementById('styling-note').innerText = p.styling_note || "";
    
    // 設定主圖初始來源
    const primaryImg = document.getElementById('primary-img');
    if (primaryImg) primaryImg.src = p.image_main;

    // 解析顏色對應圖片地圖
    if (p.images_by_color) {
        try {
            colorImageMap = JSON.parse(p.images_by_color);
        } catch (e) {
            console.warn("images_by_color 解析失敗:", e);
        }
    }

    // 渲染額外細節圖片
    const imgArea = document.getElementById('image-main-area');
    if (p.image_extra && imgArea) {
        // 【優化核心】不要用 innerHTML = ""，這會刪掉 HTML 裡寫好的 primary-img
        // 我們只移除除了 primary-img 以外的所有細節圖
        const existingExtras = imgArea.querySelectorAll('img:not(#primary-img)');
        existingExtras.forEach(el => el.remove());

        p.image_extra.split(',').forEach(url => {
            const cleanUrl = url.trim();
            if(cleanUrl) {
                const img = document.createElement('img');
                img.src = cleanUrl;
                img.style.width = "100%"; // 確保寬度撐滿
                img.style.display = "block";
                imgArea.appendChild(img);
            }
        });
    }

    // 渲染顏色選項
    const swatchGroup = document.getElementById('swatch-group');
    if (swatchGroup) {
        swatchGroup.innerHTML = ""; 
        const colorNames = p.color ? p.color.toString().split(',').map(s => s.trim()) : [];
        const colorCodes = p.color_code ? p.color_code.toString().split(',').map(s => s.trim()) : [];
        const colorPatterns = p.color_pattern ? p.color_pattern.toString().split(',').map(s => s.trim()) : [];

        colorNames.forEach((name, i) => {
            const hex = colorCodes[i] || '#eee';
            const pattern = colorPatterns[i] || "";
            const item = document.createElement('div');
            item.className = "swatch-item";
            
            let innerStyle = pattern 
                ? `background-image: url('${pattern}'); background-size: cover;` 
                : `background: ${hex};`;

            item.innerHTML = `
                <div class="swatch-circle" style="${innerStyle}"></div>
                <span class="swatch-name">${name}</span>
            `;

            item.onclick = () => {
                const targetImg = colorImageMap[name] || p.image_main;
                selectColor(name, hex, item, targetImg);
                
                // 【切換核心】重新抓取主圖標籤並賦值
                const mainImg = document.getElementById('primary-img');
                if (mainImg) mainImg.src = targetImg;
            };

            swatchGroup.appendChild(item);
            if (i === 0) item.click(); // 預設選取第一個
        });
    }

    // 渲染尺寸選項與價格
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
}

/**
 * 選擇顏色邏輯
 */
function selectColor(name, hex, el, imageUrl) {
    selectedColor = { name, hex };
    document.querySelectorAll('.swatch-item').forEach(i => i.classList.remove('active'));
    el.classList.add('active');

    const mobilePreview = document.getElementById('mobile-color-preview-img');
    const mobileText = document.getElementById('mobile-color-preview-name');
    
    if (mobilePreview) {
        mobilePreview.src = imageUrl;
        mobilePreview.style.opacity = "0.5";
        setTimeout(() => mobilePreview.style.opacity = "1", 100);
    }
    if (mobileText) mobileText.innerText = name;

    // 手機版自動引導
    if (window.innerWidth <= 900) {
        const sizeArea = document.getElementById('size-area');
        if (sizeArea) sizeArea.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}

/**
 * 加入暫存清單 (尚未進入購物車)
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
        selectedItems.push({ key, color: selectedColor.name, size: sizeName, price, quantity: 1 });
    }
    renderSelectedList();
    showToast(`已選擇 ${selectedColor.name} / ${sizeName}`);
}

/**
 * 渲染暫存清單
 */
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

/**
 * 正式加入購物車 (儲存至 localStorage)
 */
function addAllToCart() {
    if (selectedItems.length === 0) { 
        showToast("請先選擇顏色與尺寸"); 
        return; 
    }
    
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    
    selectedItems.forEach(item => {
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
            image: colorImg,
            status: currentProduct.status 
        };
        
        const idx = cart.findIndex(i => 
            i.code === cartItem.code && 
            i.size === cartItem.size && 
            i.color === cartItem.color
        );

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
 * 更新購物車圖示數量
 */
function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const countEl = document.getElementById('cart-count');
    if (countEl) countEl.innerText = cart.reduce((sum, item) => sum + item.quantity, 0);
}

/**
 * 視窗載入後初始化
 */
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