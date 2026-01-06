const API_URL = "https://script.google.com/macros/s/AKfycbxnlAwKJucHmCKcJwv67TWuKV0X74Daag9X9I4NG7DOESREuYdU7BtWBPcEHyoJphoEfg/exec"; 

const urlParams = new URLSearchParams(window.location.search);
const productCode = urlParams.get('code');

let currentProduct = null;
let selectedOption = { color: "", size: "", price: 0 };

async function init() {
    // 1. 先更新購物車數量，這不需要商品代碼也能做
    updateCartCount();

    // 2. 如果目前不在 detail.html 頁面，或者沒有 productCode，就不要執行後續邏輯
    // 這樣就不會在你點擊購物車時跳出 "無效商品代碼" 的警告
    if (!productCode) {
        // 如果是詳情頁卻沒代碼，才印出 log，不要用 alert 打斷使用者
        console.log("No product code found in URL.");
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}?code=${productCode}`);
        const data = await response.json();
        
        // 支援多種 API 回傳格式
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

    // 顏色與色票
    const swatchGroup = document.getElementById('swatch-group');
    swatchGroup.innerHTML = `
        <div class="swatch-item">
            <div class="swatch-circle" style="background:${p.color_code || '#eee'}"></div>
            <span class="swatch-name">${p.color}</span>
        </div>
    `;
    selectedOption.color = p.color;

    // 尺寸與價格 (BABY, KID, JUNIOR, ADULT)
    const sizeArea = document.getElementById('size-area');
    sizeArea.innerHTML = ""; // 清空舊內容
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

// 修正後的 updateCartCount，加入防錯判斷
function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const totalQty = cart.reduce((sum, item) => sum + (item.quantity || 0), 0);
    const countEl = document.getElementById('cart-count');
    if (countEl) {
        countEl.innerText = totalQty;
    }
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
    const idx = cart.findIndex(i => i.code === item.code && i.size === item.size && i.color === item.color);
    
    if (idx > -1) cart[idx].quantity += item.quantity;
    else cart.push(item);

    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    
    if (confirm("已加入購物車！要前往結帳嗎？")) {
        location.href = 'cart.html';
    }
}

window.onload = init;