// js/checkout.js
const API_URL = "https://script.google.com/macros/s/AKfycbxnlAwKJucHmCKcJwv67TWuKV0X74Daag9X9I4NG7DOESREuYdU7BtWBPcEHyoJphoEfg/exec"; 

document.addEventListener('DOMContentLoaded', () => {
    initCheckout();
});

function initCheckout() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    if (cart.length === 0) {
        alert("購物車是空的，為您返回首頁");
        window.location.href = "index.html";
        return;
    }
    renderOrderItems(cart); 
    handlePaymentChange();
}

function renderOrderItems(cart) {
    const listContainer = document.getElementById('checkout-items-list');
    if (!listContainer) return;

    let hasSaleItem = false;
    listContainer.innerHTML = cart.map(item => {
        const isSale = (item.status || "").toString().trim().toUpperCase() === 'SALE';
        if (isSale) hasSaleItem = true;

        return `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px; padding-bottom:10px; border-bottom:1px solid #f9f9f9; font-size:13px;">
                <div style="display:flex; align-items:center; gap:12px;">
                    <img src="${item.image}" width="50" height="50" style="object-fit:cover; border-radius:2px;">
                    <div>
                        <div style="font-weight:bold; color: #333;">
                            ${isSale ? '<span style="background:#e74c3c; color:#fff; font-size:9px; padding:1px 4px; border-radius:2px; margin-right:5px;">SALE</span>' : ''}
                            ${item.name}
                        </div>
                        <div style="color:#888; font-size:11px;">${item.color} / ${item.size} x ${item.quantity}</div>
                    </div>
                </div>
                <div style="font-weight:bold;">NT$ ${(item.price * item.quantity).toLocaleString()}</div>
            </div>
        `;
    }).join('');

    const note = document.getElementById('sale-exclude-note');
    if (note) {
        note.style.display = hasSaleItem ? 'block' : 'none';
        note.style.color = '#e74c3c';
        note.style.fontSize = '12px';
        note.style.marginTop = '5px';
    }
}

function handlePaymentChange() {
    const payMethodEl = document.querySelector('input[name="pay_method"]:checked');
    if (!payMethodEl) return;

    const payMethod = payMethodEl.value;
    const shipContainer = document.getElementById('ship-method-container');
    const addrLabel = document.getElementById('address-label');
    
    let html = '';
    if (payMethod === 'transfer') {
        html = `
            <label class="radio-item"><input type="radio" name="ship_method" value="home" checked onchange="updateSummary()"> 宅配到府</label>
            <label class="radio-item"><input type="radio" name="ship_method" value="store" onchange="updateSummary()"> 7-11 超商取貨</label>
        `;
        addrLabel.innerText = "收件地址 / 門市名稱";
    } else {
        html = `
            <label class="radio-item"><input type="radio" name="ship_method" value="store" checked onchange="updateSummary()"> 7-11 超商取貨</label>
        `;
        addrLabel.innerText = "7-11 門市名稱及店號";
    }
    shipContainer.innerHTML = html;
    updateSummary();
}

function updateSummary() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const payMethodEl = document.querySelector('input[name="pay_method"]:checked');
    if (!payMethodEl) return;

    const payMethod = payMethodEl.value;
    
    let subtotal = 0;
    let discountAmount = 0;

    cart.forEach(item => {
        const itemPrice = Number(item.price) || 0;
        const itemTotal = itemPrice * item.quantity;
        subtotal += itemTotal;

        const currentStatus = (item.status || "").toString().trim().toUpperCase();

        if (currentStatus !== 'SALE') {
            const rate = (payMethod === 'transfer') ? 0.2 : 0.1; 
            discountAmount += Math.round(itemTotal * rate);
        }
    });

    const discountedSubtotal = subtotal - discountAmount;
    let shippingFee = (payMethod === 'transfer') ? 0 : (discountedSubtotal >= 1500 ? 0 : 60);
    const finalTotal = discountedSubtotal + shippingFee;

    if(document.getElementById('show-subtotal')) document.getElementById('show-subtotal').innerText = `NT$ ${subtotal.toLocaleString()}`;
    if(document.getElementById('show-discount')) document.getElementById('show-discount').innerText = `- NT$ ${discountAmount.toLocaleString()}`;
    if(document.getElementById('show-shipping')) document.getElementById('show-shipping').innerText = (shippingFee === 0) ? "免運" : `NT$ ${shippingFee.toLocaleString()}`;
    if(document.getElementById('show-total')) document.getElementById('show-total').innerText = `NT$ ${finalTotal.toLocaleString()}`;

    window.finalOrderCalc = { subtotal, discountAmount, shippingFee, finalTotal };
}

async function submitOrder() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const calc = window.finalOrderCalc;

    const payMethodEl = document.querySelector('input[name="pay_method"]:checked');
    const shipMethodEl = document.querySelector('input[name="ship_method"]:checked');
    
    if (!payMethodEl || !shipMethodEl) {
        alert("請選擇付款與運送方式");
        return;
    }

    const name = document.getElementById('cust_name').value.trim();
    const phone = document.getElementById('cust_phone').value.trim();
    const email = document.getElementById('cust_email').value.trim();
    const address = document.getElementById('cust_address').value.trim();

    if (!name || !phone || !address) {
        alert("請填寫完整收件資訊");
        return;
    }

    const submitBtn = document.getElementById('submit-btn');
    submitBtn.disabled = true;
    submitBtn.innerText = "PROCESSING...";

    const orderId = "AF" + new Date().getTime().toString().slice(-6);

    let lineMsg = `📦 【AIFANG KIDS 訂單確認】\n`;
    lineMsg += `━━━━━━━━━━\n`;
    lineMsg += `🆔 訂單編號：${orderId}\n`;
    lineMsg += `👤 收件人：${name}\n`;
    lineMsg += `📞 電話：${phone}\n`;
    lineMsg += `💳 方式：${payMethodEl.value === 'transfer' ? '銀行匯款(8折)' : '貨到付款(9折)'}\n`;
    lineMsg += `📍 地址：${address}\n`;
    lineMsg += `━━━━━━━━━━\n`;
    lineMsg += `🛍️ 內容：\n`;
    cart.forEach((item, i) => {
        const isSale = (item.status || "").toString().trim().toUpperCase() === 'SALE';
        lineMsg += `${i+1}. ${isSale ? '[SALE] ' : ''}${item.name} (${item.color}/${item.size}) x${item.quantity}\n`;
    });
    lineMsg += `━━━━━━━━━━━━━━━\n`;
    lineMsg += `⭐ 應付金額：NT$ ${calc.finalTotal.toLocaleString()}\n\n`;

    const order_payload = {
        mode: "createOrder",
        order_data: {
            order_id: orderId,
            customer_name: name,
            customer_phone: phone,
            customer_email: email,
            shipping_address: address,
            payment_method: payMethodEl.value,
            shipping_method: shipMethodEl.value,
            subtotal: calc.subtotal,
            discount: calc.discountAmount,
            shipping_fee: calc.shippingFee,
            total_amount: calc.finalTotal
        },
        items: cart
    };

    try {
        await fetch(API_URL, {
            method: 'POST',
            mode: 'no-cors',
            body: JSON.stringify(order_payload)
        });

        // --- 【核心修正段落】 ---
        // 存入成功頁面時，確保欄位名稱 unit_price 與 order_success.html 一致
        const formattedItems = cart.map(item => ({
            product_name: item.name,
            color: item.color,
            size: item.size,
            quantity: Number(item.quantity),
            unit_price: Number(item.price), // 確保這裏叫 unit_price 且是數字
            status: item.status
        }));

        localStorage.setItem('last_order_info', JSON.stringify({
            id: orderId,
            customer_name: name,
            customer_phone: phone,
            customer_address: address,
            total_amount: calc.finalTotal,
            pay_method_text: payMethodEl.value === 'transfer' ? '銀行匯款(8折)' : '貨到付款(9折)',
            line_msg: lineMsg, 
            items: formattedItems // 使用格式化後的陣列
        }));

        localStorage.removeItem('cart');

        setTimeout(() => {
            window.location.href = "order_success.html";
        }, 300);

    } catch (e) {
        console.error(e);
        alert("系統傳送失敗，請聯繫 LINE 客服");
        submitBtn.disabled = false;
        submitBtn.innerText = "PLACE ORDER";
    }
}