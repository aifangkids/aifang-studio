/**
 * AiFang Kids - checkout.js
 * [2026.01 最終優化完整版 - 包含 Email 寫入與成功頁面 100% 對接]
 */

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
    
    // 綁定付款方式切換
    document.querySelectorAll('input[name="pay_method"]').forEach(radio => {
        radio.addEventListener('change', handlePaymentChange);
    });

    // 監聽地址欄位的「輸入/貼上」事件，自動處理 ibon 格式
    const addrInput = document.getElementById('cust_address');
    if (addrInput) {
        addrInput.addEventListener('input', formatStoreInput);
    }

    const submitBtn = document.getElementById('submit-btn');
    if (submitBtn) {
        submitBtn.addEventListener('click', submitOrder);
    }

    handlePaymentChange();
}

/**
 * 門市查詢小視窗 (使用 ibon 穩定連結)
 */
window.openIbonMap = function() {
    const mapUrl = 'https://www.ibon.com.tw/mobile/retail_inquiry.aspx#gsc.tab=0';
    const features = 'width=450,height=700,left=200,top=100,resizable=yes,scrollbars=yes';
    const newWin = window.open(mapUrl, 'ibonMap', features);
    if (!newWin || newWin.closed) window.open(mapUrl, '_blank');
};

/**
 * 自動格式化從 ibon 貼上的資訊
 */
function formatStoreInput(e) {
    const shipMethod = document.querySelector('input[name="ship_method"]:checked')?.value;
    if (shipMethod !== 'store') return;

    let val = e.target.value.trim();
    // 偵測 Tab (\t) 或 兩個以上的空格
    if (val.includes('\t') || /\s{2,}/.test(val)) {
        const parts = val.split(/[\t\s]{2,}/).map(p => p.trim());
        if (parts.length >= 2) {
            const storeId = parts[0];   // 110817
            const storeName = parts[1]; // 千翔
            e.target.value = `${storeName} (${storeId})`;
        }
    }
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

function handlePaymentChange() {
    const payMethodEl = document.querySelector('input[name="pay_method"]:checked');
    if (!payMethodEl) return;

    const shipContainer = document.getElementById('ship-method-container');
    const payMethod = payMethodEl.value;

    let html = (payMethod === 'transfer') 
        ? `<label class="radio-item"><input type="radio" name="ship_method" value="home" checked> 宅配到府</label>
           <label class="radio-item"><input type="radio" name="ship_method" value="store"> 7-11 超商取貨</label>`
        : `<label class="radio-item"><input type="radio" name="ship_method" value="store" checked> 7-11 超商取貨</label>`;
    
    shipContainer.innerHTML = html;

    shipContainer.querySelectorAll('input[name="ship_method"]').forEach(radio => {
        radio.addEventListener('change', () => {
            updateUIByShipMethod();
            updateSummary();
        });
    });

    updateUIByShipMethod();
    updateSummary();
}

function updateUIByShipMethod() {
    const shipMethod = document.querySelector('input[name="ship_method"]:checked')?.value;
    const addrLabel = document.getElementById('address-label');
    const helperArea = document.getElementById('store-helper-area');
    
    if (shipMethod === 'store') {
        if (addrLabel) addrLabel.innerText = "7-11 門市名稱及店號";
        if (helperArea) helperArea.style.display = 'block';
    } else {
        if (addrLabel) addrLabel.innerText = "收件地址";
        if (helperArea) helperArea.style.display = 'none';
    }
}

function updateSummary() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const payMethod = document.querySelector('input[name="pay_method"]:checked')?.value;
    if (!payMethod) return;

    let subtotal = 0, discountAmount = 0;
    cart.forEach(item => {
        const itemTotal = (Number(item.price) || 0) * item.quantity;
        subtotal += itemTotal;
        if ((item.status || "").toString().trim().toUpperCase() !== 'SALE') {
            discountAmount += Math.round(itemTotal * (payMethod === 'transfer' ? 0.2 : 0.1));
        }
    });

    const discountedSubtotal = subtotal - discountAmount;
    let shippingFee = (payMethod === 'transfer') ? 0 : (discountedSubtotal >= 1500 ? 0 : 60);
    const finalTotal = discountedSubtotal + shippingFee;

    document.getElementById('show-subtotal').innerText = `NT$ ${subtotal.toLocaleString()}`;
    document.getElementById('show-discount').innerText = `- NT$ ${discountAmount.toLocaleString()}`;
    document.getElementById('show-shipping').innerText = (shippingFee === 0) ? "免運" : `NT$ ${shippingFee.toLocaleString()}`;
    document.getElementById('show-total').innerText = `NT$ ${finalTotal.toLocaleString()}`;

    window.finalOrderCalc = { subtotal, discountAmount, shippingFee, finalTotal };
}

async function submitOrder() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const calc = window.finalOrderCalc;
    const payMethodEl = document.querySelector('input[name="pay_method"]:checked');
    const shipMethodEl = document.querySelector('input[name="ship_method"]:checked');

    // 獲取所有欄位資訊
    const email = document.getElementById('cust_email')?.value.trim();
    const name = document.getElementById('cust_name')?.value.trim();
    const phone = document.getElementById('cust_phone')?.value.trim();
    const address = document.getElementById('cust_address')?.value.trim();

    // 驗證（包含 Email）
    if (!email || !name || !phone || !address || !payMethodEl || !shipMethodEl) {
        alert("請填寫完整收件資訊（含 Email）並選擇運送方式");
        return;
    }

    const submitBtn = document.getElementById('submit-btn');
    submitBtn.disabled = true;
    submitBtn.innerText = "PROCESSING...";

    const orderId = "AF" + new Date().getTime().toString().slice(-6);
    const payText = payMethodEl.value === 'transfer' ? '銀行匯款(8折)' : '貨到付款(9折)';

    // LINE 訊息生成
    let lineMsg = `AIFANG KIDS 訂單確認\n•┈┈┈┈┈┈୨୧┈┈┈┈┈┈•\n訂單編號：${orderId}\n收件人：${name}\n付款方式：${payText}\n•┈┈┈┈┈┈୨୧┈┈┈┈┈┈•\n`;
    cart.forEach((item, i) => {
        lineMsg += `${i+1}. ${item.name} (${item.color}/${item.size}) x${item.quantity}\n`;
    });
    lineMsg += `•┈┈┈┈┈┈୨୧┈┈┈┈┈┈•\n應付金額：NT$ ${calc.finalTotal.toLocaleString()}`;

    // 傳送到試算表的資料 (加入 customer_email)
    const order_payload = {
        mode: "createOrder",
        order_data: { 
            order_id: orderId, 
            customer_email: email, 
            customer_name: name, 
            customer_phone: phone, 
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
            color: item.color, 
            size: item.size, 
            price: Number(item.price), 
            quantity: Number(item.quantity) 
        }))
    };

    // 存入 LocalStorage (給 order_success.js 使用，對齊欄位名)
    localStorage.setItem('last_order_info', JSON.stringify({ 
        id: orderId, 
        customer_name: name, 
        customer_phone: phone, 
        customer_address: address, 
        pay_method_text: payText,
        total_amount: calc.finalTotal, 
        line_msg: lineMsg,
        items: cart.map(item => ({
            product_name: item.name,
            color: item.color,
            size: item.size,
            quantity: item.quantity,
            unit_price: Number(item.price)
        }))
    }));

    try {
        await ApiService.submitOrder(order_payload);
        localStorage.removeItem('cart');
        window.location.href = "order_success.html";
    } catch (e) {
        localStorage.removeItem('cart');
        window.location.href = "order_success.html";
    }
}