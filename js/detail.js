const API_URL = "https://script.google.com/macros/s/AKfycbxnlAwKJucHmCKcJwv67TWuKV0X74Daag9X9I4NG7DOESREuYdU7BtWBPcEHyoJphoEfg/exec"; 

const urlParams = new URLSearchParams(window.location.search);
const productCode = urlParams.get('code');

let currentProduct = null;
let selectedColor = { name: "", hex: "" };
let selectedItems = []; 
let colorImageMap = {}; 

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
    document.getElementById('p-title').innerText = p.name;
    document.getElementById('p-brand').innerText = p.brand || "AIFANG SELECT";
    document.getElementById('p-id').innerText = `CODE: ${p.code}`;
    document.getElementById('styling-note').innerText = p.styling_note || "";
    document.getElementById('primary-img').src = p.image_main;

    if (p.images_by_color) {
        try {
            colorImageMap = JSON.parse(p.images_by_color);
        } catch (e) {
            console.warn("images_by_color 解析失敗:", e);
        }
    }

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

        item.onclick = () => {
            // 找出對應圖片網址，若無則用主圖
            const targetImg = colorImageMap[name] || p.image_main;
            selectColor(name, hex, item, targetImg);
            
            const mainImg = document.getElementById('primary-img');
            mainImg.src = targetImg;
        };

        swatchGroup.appendChild(item);
        if (i === 0) item.click();
    });

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

/**
 * 修正後的 selectColor：整合手機版投影顯示框
 */
function selectColor(name, hex, el, imageUrl) {
    selectedColor = { name, hex };
    
    // 1. 更新 UI 選取狀態
    document.querySelectorAll('.swatch-item').forEach(i => i.classList.remove('active'));
    el.classList.add('active');

    // 2. 更新手機版投影預覽框 (如果有該 HTML 元素)
    const mobilePreview = document.getElementById('mobile-color-preview-img');
    const mobileText = document.getElementById('mobile-color-preview-name');
    
    if (mobilePreview) {
        mobilePreview.src = imageUrl;
        // 加入簡單的視覺反饋效果
        mobilePreview.style.opacity = "0.5";
        setTimeout(() => mobilePreview.style.opacity = "1", 100);
    }
    if (mobileText) {
        mobileText.innerText = name;
    }
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
            image: colorImg
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