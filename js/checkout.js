/**
 * AiFang Kids - Checkout Logic
 * 功能：計算運費、顯示總額、封裝資料至 Google Sheets、引導至 LINE
 */

// 1. 配置您的 GAS 網址 (請確保已部署為「任何人」都可存取)
const API_URL = "您的_GAS_網址_在此"; 

document.addEventListener('DOMContentLoaded', () => {
    initCheckout();
});

// 初始化結帳頁面
function initCheckout() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    
    if (cart.length === 0) {
        alert("購物車內暫無商品，將為您導回購物車");
        window.location.href = "cart.html";
        return;
    }

    // 監聽付款方式與運送方式切換，即時更新運費
    const toggleElements = document.querySelectorAll('input[name="pay_method"], input[name="ship_method"]');
    toggleElements.forEach(el => {
        el.addEventListener('change', () => updateOrderSummary(cart));
    });

    // 初始計算
    updateOrderSummary(cart);
}

// 計算並更新金額摘要
function updateOrderSummary(cart) {
    // A. 計算商品小計
    const subtotal = cart.reduce((sum, item) => sum + (Number(item.price) * Number(item.quantity)), 0);
    
    // B. 獲取當前選中的付款方式
    const payMethod = document.querySelector('input[name="pay_method"]:checked').value;
    
    // C. 核心規則：銀行匯款 (transfer) 且 滿 1500 免運，否則 45
    let shippingFee = 45;
    if (payMethod === 'transfer' && subtotal >= 1500) {
        shippingFee = 0;
    }

    const totalAmount = subtotal + shippingFee;

    // D. 渲染到畫面上 (對應您 HTML 中的 ID)
    if(document.getElementById('show-subtotal')) 
        document.getElementById('show-subtotal').innerText = `NT$ ${subtotal.toLocaleString()}`;
    
    if(document.getElementById('show-shipping')) 
        document.getElementById('show-shipping').innerText = `NT$ ${shippingFee.toLocaleString()}`;
    
    if(document.getElementById('show-total')) 
        document.getElementById('show-total').innerText = `NT$ ${totalAmount.toLocaleString()}`;

    // E. 儲存計算結果供提交時使用
    window.currentCalcResult = {
        subtotal: subtotal,
        shipping_fee: shippingFee,
        total_amount: totalAmount
    };
}

// 送出訂單
async function submitOrder() {
    const cart = JSON.parse(localStorage.getItem('cart'));
    const calc = window.currentCalcResult;

    // 1. 取得並驗證欄位
    const name = document.getElementById('cust_name').value.trim();
    const phone = document.getElementById('cust_phone').value.trim();
    const address = document.getElementById('cust_address').value.trim();
    const payMethod = document.querySelector('input[name="pay_method"]:checked').value;
    const shipMethod = document.querySelector('input[name="ship_method"]:checked').value;

    if (!name || !phone || !address) {
        alert("請填寫完整的收件資訊（姓名、電話、地址）");
        return;
    }

    // 2. 封裝傳送給 GAS 的 Payload
    // 結構對應您的試算表：Order 與 Order_Items
    const payload = {
        mode: "createOrder",
        order_data: {
            customer_name: name,
            customer_phone: phone,
            shipping_address: address,
            payment_method: payMethod,
            shipping_method: shipMethod,
            subtotal: calc.subtotal,
            shipping_fee: calc.shipping_fee,
            total_amount: calc.total_amount,
            order_status: "待核款" // 預設狀態
        },
        items: cart.map(item => ({
            product_name: item.name,
            brand: item.brand || "AiFang",
            color: item.color || "F",
            size: item.size || "F",
            price: Number(item.price),
            quantity: Number(item.quantity)
        }))
    };

    // 3. 顯示讀取中 (防止重複點擊)
    const orderBtn = document.querySelector('.btn-order');
    orderBtn.disabled = true;
    orderBtn.innerText = "訂單處理中...";

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            body: JSON.stringify(payload)
        });
        
        const result = await response.json();

        if (result.success) {
            // A. 訂單成功，先存下明細供成功頁面複製資訊
            localStorage.setItem('last_order_info', JSON.stringify({
                id: result.order_id,
                name: name,
                pay: payMethod === 'transfer' ? '銀行匯款' : '貨到付款',
                total: calc.total_amount,
                items: cart
            }));

            // B. 清除購物車，跳轉至成功頁
            localStorage.removeItem('cart');
            window.location.href = "order_success.html";
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        console.error("提交失敗:", error);
        alert("系統暫時無法處理您的訂單，請直接透過 LINE 聯繫客服。");
        orderBtn.disabled = false;
        orderBtn.innerText = "確認下單";
    }
}