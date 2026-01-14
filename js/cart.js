/**
 * AiFang Kids Cart Logic
 * 負責渲染購物車內容並計算「預估」金額
 */

document.addEventListener('DOMContentLoaded', () => {
    renderCart();
});

function renderCart() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const tbody = document.getElementById('cart-tbody');
    
    if (cart.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="padding:100px 0; color:#999; text-align:center;">您的購物車是空的</td></tr>';
        updateUI(0, 0);
        // 同步更新頁首計數器為 0
        updateHeaderCartCount(0);
        return;
    }

    let subtotal = 0;
    let totalQuantity = 0;

    tbody.innerHTML = cart.map((item, index) => {
        const itemTotal = item.price * item.quantity;
        subtotal += itemTotal;
        totalQuantity += item.quantity;

        // 圖片渲染優化：若無圖片則顯示預設佔位圖，確保排版不崩潰
        const displayImg = item.image ? item.image : './images/ui/no-image.jpg';

        return `
            <tr>
                <td>
                    <div class="product-item">
                        <img src="${displayImg}" alt="${item.name}" onerror="this.src='https://via.placeholder.com/90x110?text=No+Image'">
                        <div>
                            <span class="product-name">${item.name}</span>
                            <span class="product-option">[規格: ${item.brand || 'AiFang'} / ${item.color || 'F'} / ${item.size || 'F'}]</span>
                        </div>
                    </div>
                </td>
                <td>NT$ ${Number(item.price).toLocaleString()}</td>
                <td>
                    <div class="qty-box">
                        <button onclick="changeQty(${index}, -1)">-</button>
                        <input type="text" value="${item.quantity}" readonly>
                        <button onclick="changeQty(${index}, 1)">+</button>
                    </div>
                </td>
                <td><strong>NT$ ${itemTotal.toLocaleString()}</strong></td>
                <td>
                    <button onclick="deleteItem(${index})" style="background:none; border:none; cursor:pointer; color:#bbb; font-size:18px;">&times;</button>
                </td>
            </tr>
        `;
    }).join('');

    // 更新頁首的 CART (N) 數量
    updateHeaderCartCount(totalQuantity);

    // --- 運費預估邏輯 ---
    // 規則：滿 1500 免運，否則 60
    let shipping = (subtotal >= 1500) ? 0 : 60;

    updateUI(subtotal, shipping);
}

// 更改數量
window.changeQty = function(index, delta) {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    
    if (cart[index].quantity + delta > 0) {
        cart[index].quantity += delta;
        localStorage.setItem('cart', JSON.stringify(cart));
        renderCart();
    }
};

// 刪除商品
window.deleteItem = function(index) {
    if(!confirm("確定要刪除這項商品嗎？")) return;
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    cart.splice(index, 1);
    localStorage.setItem('cart', JSON.stringify(cart));
    renderCart();
};

// 更新畫面金額
function updateUI(subtotal, shipping) {
    const subtotalEl = document.getElementById('cart-subtotal');
    const shippingEl = document.getElementById('cart-shipping');
    const totalEl = document.getElementById('cart-total');

    if (subtotalEl) subtotalEl.innerText = `NT$ ${subtotal.toLocaleString()}`;
    if (shippingEl) shippingEl.innerText = `NT$ ${shipping.toLocaleString()}`;
    if (totalEl) totalEl.innerText = `NT$ ${(subtotal + shipping).toLocaleString()}`;
}

// 新增：同步更新頁首的購物車計數器
function updateHeaderCartCount(count) {
    const countEl = document.getElementById('cart-count');
    if (countEl) {
        countEl.innerText = count;
    }
}