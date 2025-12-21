// cart.js

// 取得購物車資料，若沒有則初始化為空陣列
let cart = JSON.parse(localStorage.getItem('cart')) || [];

// 更新購物車 UI
function updateCartUI() {
    const cartContainer = document.getElementById('cart-items');
    const cartTotal = document.getElementById('cart-total');
    if (!cartContainer || !cartTotal) return;

    cartContainer.innerHTML = '';
    let total = 0;

    cart.forEach((item, index) => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;

        const div = document.createElement('div');
        div.className = 'cart-item';
        div.innerHTML = `
            <span class="item-name">${item.name}</span>
            <span class="item-price">$${item.price.toFixed(0)}</span>
            <input type="number" class="item-qty" min="1" value="${item.quantity}" data-index="${index}">
            <button class="remove-item" data-index="${index}">❌</button>
        `;
        cartContainer.appendChild(div);
    });

    cartTotal.textContent = `$${total.toFixed(0)}`;
    localStorage.setItem('cart', JSON.stringify(cart));
}

// 加入商品到購物車
function addToCart(product) {
    const index = cart.findIndex(item => item.id === product.id);
    if (index > -1) {
        cart[index].quantity += product.quantity || 1;
    } else {
        cart.push({ ...product, quantity: product.quantity || 1 });
    }
    updateCartUI();
}

// 移除商品
function removeFromCart(index) {
    cart.splice(index, 1);
    updateCartUI();
}

// 調整數量
function updateQuantity(index, quantity) {
    if (quantity < 1) quantity = 1;
    cart[index].quantity = quantity;
    updateCartUI();
}

// 監聽數量改變和刪除按鈕
document.addEventListener('input', (e) => {
    if (e.target.classList.contains('item-qty')) {
        const index = parseInt(e.target.dataset.index);
        updateQuantity(index, parseInt(e.target.value));
    }
});

document.addEventListener('click', (e) => {
    if (e.target.classList.contains('remove-item')) {
        const index = parseInt(e.target.dataset.index);
        removeFromCart(index);
    }
});

// 初始渲染
document.addEventListener('DOMContentLoaded', updateCartUI);
