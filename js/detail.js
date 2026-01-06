const API_URL = "您的_GAS_API_URL"; // 確保與 index.html 使用同一個
const urlParams = new URLSearchParams(window.location.search);
const productCode = urlParams.get('code');

let currentProduct = null;
let selectedColor = "";
let selectedSize = "";

// 初始化
async function initDetail() {
    if (!productCode) {
        alert("找不到商品編號");
        location.href = "index.html";
        return;
    }

    try {
        const res = await fetch(`${API_URL}?code=${productCode}`);
        const data = await res.json();
        
        // 假設 GAS 回傳的是單一物件，或是一個陣列中的第一個
        currentProduct = Array.isArray(data) ? data[0] : data;
        
        renderProduct(currentProduct);
    } catch (e) {
        console.error("載入失敗", e);
    }
}

function renderProduct(p) {
    document.getElementById('p-title').innerText = p.name;
    document.getElementById('p-brand').innerText = p.brand || "AiFang Kids";
    document.getElementById('p-id').innerText = `CODE: ${p.code}`;
    document.getElementById('p-price').innerText = `NT$ ${Number(p.price).toLocaleString()}`;
    document.getElementById('p-desc').innerText = p.description || "";
    document.getElementById('primary-img').src = p.image_url;

    // 處理顏色按鈕 (假設欄位用逗號分隔，例如: 紅,藍,白)
    const colorArea = document.getElementById('color-group');
    if (p.colors) {
        p.colors.split(',').forEach(c => {
            const btn = document.createElement('button');
            btn.className = 'opt-btn';
            btn.innerText = c.trim();
            btn.onclick = () => {
                document.querySelectorAll('#color-group .opt-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                selectedColor = c.trim();
            };
            colorArea.appendChild(btn);
        });
    }

    // 處理尺寸按鈕 (假設欄位用逗號分隔)
    const sizeArea = document.getElementById('size-group');
    if (p.sizes) {
        p.sizes.split(',').forEach(s => {
            const btn = document.createElement('button');
            btn.className = 'opt-btn';
            btn.innerText = s.trim();
            btn.onclick = () => {
                document.querySelectorAll('#size-group .opt-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                selectedSize = s.trim();
            };
            sizeArea.appendChild(btn);
        });
    }
}

// 數量調整
function updateQty(val) {
    const qtyInput = document.getElementById('qty');
    let n = parseInt(qtyInput.value) + val;
    if (n >= 1) qtyInput.value = n;
}

// 加入購物車核心邏輯
function addToCart() {
    if (!selectedColor || !selectedSize) {
        alert("請選擇顏色與尺寸");
        return;
    }

    const qty = parseInt(document.getElementById('qty').value);
    
    // 取得現有購物車
    let cart = JSON.parse(localStorage.getItem('cart')) || [];

    // 檢查是否已有相同商品 (代碼+顏色+尺寸)
    const existingIndex = cart.findIndex(item => 
        item.code === currentProduct.code && 
        item.color === selectedColor && 
        item.size === selectedSize
    );

    if (existingIndex > -1) {
        cart[existingIndex].quantity += qty;
    } else {
        cart.push({
            code: currentProduct.code,
            name: currentProduct.name,
            price: currentProduct.price,
            image: currentProduct.image_url,
            color: selectedColor,
            size: selectedSize,
            quantity: qty,
            brand: currentProduct.brand
        });
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    
    if (confirm("已加入購物車！是否前往結帳？")) {
        location.href = "cart.html";
    }
}

window.onload = initDetail;