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
        tbody.innerHTML = '<tr><td colspan="5" style="padding:100px 0; color:#999;">您的購物車是空的</td></tr>';
        updateUI(0, 0);
        return;
    }

    let subtotal = 0;

    tbody.innerHTML = cart.map((item, index) => {
        const itemTotal = item.price * item.quantity;
        subtotal += itemTotal;

        return `
            <tr>
                <td>
                    <div class="product-item">
                        <img src="${item.image || 'https://via.placeholder.com/90x110?text=No+Image'}" alt="${item.name}">
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

    // --- 運費預估邏輯 ---
    // 購物車頁面預設顯示「匯款」的最優惠可能，引導客戶前往結帳
    // 規則：滿 1500 免運，否則 45
    let shipping = (subtotal >= 1500) ? 0 : 45;

    updateUI(subtotal, shipping);
}

// 更改數量
window.changeQty = function(index, delta) {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    cart[index].quantity += delta;
    
    if (cart[index].quantity < 1) cart[index].quantity = 1;
    
    localStorage.setItem('cart', JSON.stringify(cart));
    renderCart();
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
    document.getElementById('cart-subtotal').innerText = `NT$ ${subtotal.toLocaleString()}`;
    document.getElementById('cart-shipping').innerText = `NT$ ${shipping.toLocaleString()}`;
    document.getElementById('cart-total').innerText = `NT$ ${(subtotal + shipping).toLocaleString()}`;
}