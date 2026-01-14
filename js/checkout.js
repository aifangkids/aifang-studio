/**
 * AiFang Kids - checkout.js
 * [2026.01 最終優化完整版]
 * * 功能亮點：
 * 1. SALE 商品金額鎖死：特價品不參與任何折扣計算。
 * 2. 付款折扣：銀行匯款扣 20% (8折)，貨到付款扣 10% (9折)。
 * 3. 運費邏輯：匯款免運；貨付折扣後滿 1500 免運，否則 60。
 * 4. LINE 訊息：精簡蝴蝶結分隔線格式。
 * 5. API 串接：使用 api.js 的 ApiService 進行資料對接。
 */

document.addEventListener('DOMContentLoaded', () => {
    initCheckout();
});

/**
 * 初始化結帳頁面
 */
function initCheckout() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    if (cart.length === 0) {
        alert("購物車是空的，為您返回首頁");
        window.location.href = "index.html";
        return;
    }

    // 1. 渲染商品清單
    renderOrderItems(cart);
    
    // 2. 綁定付款方式切換事件
    const payMethodRadios = document.querySelectorAll('input[name="pay_method"]');
    payMethodRadios.forEach(radio => {
        radio.addEventListener('change', handlePaymentChange);
    });

    // 3. 綁定結帳送出按鈕
    const submitBtn = document.getElementById('submit-btn');
    if (submitBtn) {
        submitBtn.addEventListener('click', submitOrder);
    }

    // 4. 初次載入計算金額
    handlePaymentChange();
}

/**
 * 渲染結帳頁面的商品摘要
 */
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
                    <img src="${item.image || './images/ui/no-image.jpg'}" width="50" height="50" style="object-fit:cover; border-radius:2px;" onerror="this.src='https://via.placeholder.com/50'">
                    <div>
                        <div style="font-weight:bold; color: #333;">
                            ${isSale ? '<span style="background:#e74c3c; color:#fff; font-size:9px; padding:1px 4px; border-radius:2px; margin-right:5px;">SALE</span>' : ''}
                            ${item.name}
                        </div>
                        <div style="color:#888; font-size:11px;">${item.color || 'F'} / ${item.size || 'F'} x ${item.quantity}</div>
                    </div>
                </div>
                <div style="font-weight:bold;">NT$ ${(Number(item.price) * item.quantity).toLocaleString()}</div>
            </div>
        `;
    }).join('');

    const note = document.getElementById('sale-exclude-note');
    if (note) note.style.display = hasSaleItem ? 'block' : 'none';
}

/**
 * 處理付款與運送方式的連動
 */
function handlePaymentChange() {
    const payMethodEl = document.querySelector('input[name="pay_method"]:checked');
    if (!payMethodEl) return;

    const payMethod = payMethodEl.value;
    const shipContainer = document.getElementById('ship-method-container');
    const addrLabel = document.getElementById('address-label');
    
    if (!shipContainer) return;

    let html = '';
    if (payMethod === 'transfer') {
        html = `
            <label class="radio-item"><input type="radio" name="ship_method" value="home" checked> 宅配到府</label>
            <label class="radio-item"><input type="radio" name="ship_method" value="store"> 7-11 超商取貨</label>
        `;
        if (addrLabel) addrLabel.innerText = "收件地址 / 門市名稱";
    } else {
        html = `
            <label class="radio-item"><input type="radio" name="ship_method" value="store" checked> 7-11 超商取貨</label>
        `;
        if (addrLabel) addrLabel.innerText = "7-11 門市名稱及店號";
    }
    shipContainer.innerHTML = html;

    const shipMethodRadios = shipContainer.querySelectorAll('input[name="ship_method"]');
    shipMethodRadios.forEach(radio => radio.addEventListener('change', updateSummary));

    updateSummary();
}

/**
 * 金額核心計算邏輯
 */
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

        // --- SALE 金額鎖死邏輯 ---
        const isSale = (item.status || "").toString().trim().toUpperCase() === 'SALE';
        if (!isSale) {
            // 匯款 8 折 (扣除 20%)，貨付 9 折 (扣除 10%)
            const rate = (payMethod === 'transfer') ? 0.2 : 0.1; 
            discountAmount += Math.round(itemTotal * rate);
        }
    });

    const discountedSubtotal = subtotal - discountAmount;
    
    // --- 運費邏輯 ---
    let shippingFee = (payMethod === 'transfer') ? 0 : (discountedSubtotal >= 1500 ? 0 : 60);
    const finalTotal = discountedSubtotal + shippingFee;

    if(document.getElementById('show-subtotal')) document.getElementById('show-subtotal').innerText = `NT$ ${subtotal.toLocaleString()}`;
    if(document.getElementById('show-discount')) document.getElementById('show-discount').innerText = `- NT$ ${discountAmount.toLocaleString()}`;
    if(document.getElementById('show-shipping')) document.getElementById('show-shipping').innerText = (shippingFee === 0) ? "免運" : `NT$ ${shippingFee.toLocaleString()}`;
    if(document.getElementById('show-total')) document.getElementById('show-total').innerText = `NT$ ${finalTotal.toLocaleString()}`;

    window.finalOrderCalc = { subtotal, discountAmount, shippingFee, finalTotal };
}

/**
 * 送出訂單
 */
async function submitOrder() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const calc = window.finalOrderCalc;
    const payMethodEl = document.querySelector('input[name="pay_method"]:checked');
    const shipMethodEl = document.querySelector('input[name="ship_method"]:checked');

    const name = document.getElementById('cust_name')?.value.trim();
    const phone = document.getElementById('cust_phone')?.value.trim();
    const email = document.getElementById('cust_email')?.value.trim();
    const address = document.getElementById('cust_address')?.value.trim();

    if (!name || !phone || !address || !payMethodEl || !shipMethodEl) {
        alert("請填寫完整收件資訊並選擇運送方式");
        return;
    }

    const submitBtn = document.getElementById('submit-btn');
    submitBtn.disabled = true;
    submitBtn.innerText = "PROCESSING...";

    const orderId = "AF" + new Date().getTime().toString().slice(-6);
    const payText = payMethodEl.value === 'transfer' ? '銀行匯款(8折)' : '貨到付款(9折)';

    // --- 【優化後的 LINE 訊息：蝴蝶結排版樣式】 ---
    let lineMsg = `AIFANG KIDS 訂單確認\n`;
    lineMsg += `•┈┈┈┈┈┈୨୧┈┈┈┈┈┈•\n`;
    lineMsg += `訂單編號：${orderId}\n`;
    lineMsg += `收件人：${name}\n`;
    lineMsg += `付款方式：${payText}\n`;
    lineMsg += `•┈┈┈┈┈┈୨୧┈┈┈┈┈┈•\n`;
    cart.forEach((item, i) => {
        const isSale = (item.status || "").toString().trim().toUpperCase() === 'SALE';
        lineMsg += `${i+1}. ${isSale ? '[SALE] ' : ''}${item.name} (${item.color}/${item.size}) x${item.quantity}\n`;
    });
    lineMsg += `•┈┈┈┈┈┈୨୧┈┈┈┈┈┈•\n`;
    lineMsg += `應付金額：NT$ ${calc.finalTotal.toLocaleString()}`;

    // --- 【資料傳送 Payload】 ---
    const order_payload = {
        mode: "createOrder",
        order_data: {
            order_id: orderId,
            customer_name: name,
            customer_phone: phone,
            customer_email: email,
            customer_address: address,
            payment_method: payMethodEl.value,
            shipping_method: shipMethodEl.value,
            subtotal: calc.subtotal,
            discount: calc.discountAmount,
            shipping_fee: calc.shippingFee,
            total_amount: calc.finalTotal
        },
        items: cart.map(item => ({
            code: item.code,
            name: item.name,
            brand: item.brand || "AiFang",
            color: item.color,
            size: item.size,
            price: Number(item.price),
            quantity: Number(item.quantity)
        }))
    };

    try {
        const response = await ApiService.submitOrder(order_payload);
        if (response.success) {
            // 存入成功頁所需資訊
            localStorage.setItem('last_order_info', JSON.stringify({
                id: orderId,
                customer_name: name,
                customer_phone: phone,
                customer_address: address,
                total_amount: calc.finalTotal,
                pay_method_text: payText,
                line_msg: lineMsg,
                items: order_payload.items.map(i => ({
                    product_name: i.name,
                    color: i.color,
                    size: i.size,
                    quantity: i.quantity,
                    unit_price: i.price
                }))
            }));
            
            localStorage.removeItem('cart');
            window.location.href = "order_success.html";
        } else {
            throw new Error(response.error || "伺服器無回應");
        }
    } catch (e) {
        alert("系統傳送失敗，請聯繫 LINE 客服\n錯誤資訊: " + e.message);
        submitBtn.disabled = false;
        submitBtn.innerText = "PLACE ORDER";
    }
}