/**
 * AiFang Kids - cart.js
 * [2026.021 效能優化版]
 * 負責：渲染購物車、即時計算金額、顯示 SALE 標籤與韓文規格
 */

document.addEventListener('DOMContentLoaded', () => {
    renderCart();

    // 監聽結帳按鈕 (負責跳轉)
    const checkoutBtn = document.getElementById('checkout-btn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', handleCheckout);
    }
});

/**
 * 1. 核心計算邏輯
 */
function calculateOrder(cart) {
    let subtotal = 0;
    let totalQuantity = 0;

    cart.forEach(item => {
        // item.price 已經是 detail.js 根據 9 折或 SALE 狀態算好的價格
        subtotal += Number(item.price) * Number(item.quantity);
        totalQuantity += Number(item.quantity);
    });

    // 運費規則：滿 1500 免運，否則 60
    const shipping = (subtotal >= 1500) ? 0 : 60;
    const total = subtotal + shipping;

    return {
        subtotal,
        shipping,
        total,
        totalQuantity,
        discount: 0 
    };
}

/**
 * 2. 渲染購物車 Table
 */
function renderCart() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const tbody = document.getElementById('cart-tbody');
    if (!tbody) return;

    if (cart.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="padding:100px 0; color:#999; text-align:center;">您的購物車是空的</td></tr>';
        updateUI(0, 0, 0);
        updateHeaderCartCount(0);
        return;
    }

    const result = calculateOrder(cart);

    tbody.innerHTML = cart.map((item, index) => {
        const itemTotal = Number(item.price) * Number(item.quantity);
        const displayImg = item.image ? item.image : './images/ui/no-image.jpg';
        
        // 判斷是否顯示 SALE 標籤 (由 detail.js 傳入的 status 決定)
        const saleBadge = item.status === 'SALE' 
            ? `<span style="background:#d9534f; color:#fff; font-size:10px; padding:2px 4px; border-radius:2px; margin-left:5px;">SALE</span>` 
            : `<span style="background:#eee; color:#666; font-size:10px; padding:2px 4px; border-radius:2px; margin-left:5px;">9折優惠</span>`;

        // 組合顏色顯示：中文 (韓文)
        const colorDisplay = item.korean_color ? `${item.color} (${item.korean_color})` : item.color;

        return `
            <tr>
                <td>
                    <div class="product-item">
                        <img src="${displayImg}" alt="${item.name}" onerror="this.src='https://via.placeholder.com/90x110?text=No+Image'">
                        <div style="text-align: left;">
                            <div class="product-name" style="font-weight:700;">${item.name} ${saleBadge}</div>
                            <div style="font-size:11px; color:#999; margin-top:4px;">${item.korean_name || ''}</div>
                            <span class="product-option" style="display:block; margin-top:8px; color:#666;">
                                [規格: ${item.brand || 'AiFang'} / ${colorDisplay} / ${item.size || 'F'}]
                            </span>
                        </div>
                    </div>
                </td>
                <td style="font-size: 14px;">NT$ ${Number(item.price).toLocaleString()}</td>
                <td>
                    <div class="qty-box">
                        <button onclick="changeQty(${index}, -1)" style="cursor:pointer;">-</button>
                        <input type="text" value="${item.quantity}" readonly style="width:30px; text-align:center; border:none; background:none; font-weight:bold;">
                        <button onclick="changeQty(${index}, 1)" style="cursor:pointer;">+</button>
                    </div>
                </td>
                <td style="font-size: 14px;"><strong>NT$ ${itemTotal.toLocaleString()}</strong></td>
                <td>
                    <button onclick="deleteItem(${index})" style="background:none; border:none; cursor:pointer; color:#bbb; font-size:20px; transition:0.2s;">&times;</button>
                </td>
            </tr>
        `;
    }).join('');

    updateHeaderCartCount(result.totalQuantity);
    updateUI(result.subtotal, result.shipping, result.total);
}

/**
 * 3. 處理結帳按鈕點擊
 */
function handleCheckout() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    if (cart.length === 0) {
        alert("購物車是空的！");
        return;
    }

    const result = calculateOrder(cart);
    localStorage.setItem('temp_order_summary', JSON.stringify(result));

    window.location.href = "checkout.html";
}

/**
 * 4. 輔助 UI 功能
 */
window.changeQty = function(index, delta) {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    if (cart[index] && cart[index].quantity + delta > 0) {
        cart[index].quantity += delta;
        localStorage.setItem('cart', JSON.stringify(cart));
        renderCart();
    }
};

window.deleteItem = function(index) {
    if(!confirm("確定要從購物車移除這項商品嗎？")) return;
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    cart.splice(index, 1);
    localStorage.setItem('cart', JSON.stringify(cart));
    renderCart();
};

function updateUI(subtotal, shipping, total) {
    const subtotalEl = document.getElementById('cart-subtotal');
    const shippingEl = document.getElementById('cart-shipping');
    const totalEl = document.getElementById('cart-total');

    if (subtotalEl) subtotalEl.innerText = `NT$ ${subtotal.toLocaleString()}`;
    if (shippingEl) shippingEl.innerText = `NT$ ${shipping.toLocaleString()}`;
    if (totalEl) totalEl.innerText = `NT$ ${total.toLocaleString()}`;
}

function updateHeaderCartCount(count) {
    const countEl = document.getElementById('cart-count');
    if (countEl) countEl.innerText = count;
}