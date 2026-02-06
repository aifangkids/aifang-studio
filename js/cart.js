/**
 * AiFang Kids - cart.js 2026 最終整合優化版
 */

document.addEventListener('DOMContentLoaded', () => {
    renderCart();

    const applyCouponBtn = document.getElementById('apply-coupon');
    if (applyCouponBtn) {
        applyCouponBtn.addEventListener('click', handleApplyCoupon);
    }

    const shippingSelect = document.getElementById('shipping-method');
    if (shippingSelect) {
        shippingSelect.addEventListener('change', () => {
            updateShippingNotice();
            renderCart(); 
        });
    }

    const submitBtn = document.getElementById('submit-order-btn');
    if (submitBtn) {
        submitBtn.addEventListener('click', submitOrder);
    }
});

let appliedCoupons = []; 
const VIP_COUPONS = ["AIFANG VIP", "AIFANG VVIP"];

/**
 * 1. 核心計算 (與 ApiService.calculateCart 對接)
 */
function calculateOrder(cart) {
    const summary = ApiService.calculateCart(cart);
    const hasVipCoupon = appliedCoupons.some(c => VIP_COUPONS.includes(c.code));
    
    // 計算優惠券折扣總額
    const totalCouponDiscount = appliedCoupons.reduce((sum, c) => sum + Number(c.amount), 0);
    
    // 最終應付金額 = (商品小計 - 1+1折扣) - 優惠券折扣
    const finalTotal = summary.total_amount - totalCouponDiscount;

    // 免運判斷：滿1500 或 使用 VIP 優惠券
    const isFreeShipping = summary.total_amount >= 1500 || hasVipCoupon;

    return {
        subtotal: summary.subtotal,
        comboDiscount: summary.discount_total,
        couponDiscount: totalCouponDiscount,
        total: finalTotal > 0 ? finalTotal : 0,
        isFreeShipping,
        processedItems: summary.processedItems
    };
}

/**
 * 2. 輔助函式
 */
function generateShortOrderId() {
    const randomNum = Math.floor(100000 + Math.random() * 900000);
    return `AF${randomNum}`;
}

function getTaipeiTimeString() {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('zh-TW', {
        timeZone: 'Asia/Taipei',
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        hour12: false
    });
    return formatter.format(now).replace(/\//g, '-');
}

/**
 * 3. 渲染右側摘要 (針對響應式佈局優化版本)
 */
function renderCart() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const container = document.getElementById('cart-items-preview');
    if (!container) return;

    if (cart.length === 0) {
        container.innerHTML = `<div style="text-align:center; padding:40px 0;"><p style="color:#999;">購物車是空的</p></div>`;
        updateUI(0, 0, 0, 0, false);
        return;
    }

    const result = calculateOrder(cart);

    container.innerHTML = result.processedItems.map((item, index) => {
        // 修正 1+1 標籤：改用獨立 class 方便 CSS 控制換行
        let badgeHtml = item.status === 'NEW' ? `<span class="promo-tag-1plus1">1+1 組合優惠</span>` : '';
        const colorSpec = item.korean_color ? `${item.color} (${item.korean_color})` : item.color;

        return `
            <div class="cart-item-mini">
                <img src="${item.image || './images/ui/no-image.jpg'}" class="item-img-mini" onerror="this.src='./images/ui/no-image.jpg'">
                <div class="item-info-mini">
                    <div class="item-name-mini">${item.name}</div>
                    
                    ${badgeHtml}
                    
                    <div class="item-spec-mini">${colorSpec} / ${item.size}</div>
                    
                    <div class="item-bottom-row">
                        <div class="item-price-mini">NT$ ${item.item_total.toLocaleString()}</div>
                        <div class="qty-control">
                            <button class="qty-btn" onclick="changeQty(${index}, -1)">-</button>
                            <input type="text" class="qty-val" value="${item.quantity}" readonly>
                            <button class="qty-btn" onclick="changeQty(${index}, 1)">+</button>
                        </div>
                    </div>
                </div>
                <button onclick="deleteItem(${index})" class="delete-btn">&times;</button>
            </div>`;
    }).join('');

    // ... 後續的優惠券列表與 UI 更新邏輯維持不變 ...
    const couponListArea = document.getElementById('applied-coupons-list');
    if (couponListArea) {
        couponListArea.innerHTML = appliedCoupons.map((c, idx) => `
            <div style="display:flex; justify-content:space-between; background:#f9f9f9; padding:8px 12px; margin-bottom:5px; border-radius:4px; border-left:3px solid #d9534f;">
                <div style="font-size:12px;">
                    <span style="font-weight:bold; color:#d9534f;">[已套用]</span> ${c.remark || c.code}
                </div>
                <span onclick="removeCoupon(${idx})" style="cursor:pointer; color:#999; font-weight:bold;">&times;</span>
            </div>`).join('');
    }

    updateUI(result.subtotal, result.comboDiscount, result.couponDiscount, result.total, result.isFreeShipping);
}

/**
 * 4. 提交訂單 (精準對接修正後的 API.JS)
 */
async function submitOrder() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const name = document.getElementById('cust-name').value.trim();
    const email = document.getElementById('cust-email').value.trim();
    const shipping = document.getElementById('shipping-method').value;

    if (cart.length === 0) return showToast("購物車內沒有商品");
    if (!name || !email) return showToast("請填寫訂購資訊");

    const summary = calculateOrder(cart);
    
    // 建立一個完整的摘要物件傳遞給 ApiService
    const cartSummaryForApi = {
        processedItems: summary.processedItems,
        subtotal: summary.subtotal,
        discount_total: summary.comboDiscount, // 1+1 折扣
        total_amount: summary.subtotal - summary.comboDiscount // 扣掉優惠券前的金額
    };

    // 準備客戶與優惠券合併資訊
    const customerInfo = {
        order_id: generateShortOrderId(),
        order_date: getTaipeiTimeString(),
        name: name,
        email: email,
        shipping_method: shipping,
        coupon_code: appliedCoupons.map(c => c.code).join(', '),
        coupon_discount: summary.couponDiscount
    };

    try {
        const btn = document.getElementById('submit-order-btn');
        const originalText = btn.innerText;
        btn.innerText = "訂單處理中...";
        btn.disabled = true;

        // 呼叫 ApiService
        const response = await ApiService.submitOrder(customerInfo, cartSummaryForApi);
        
        if (response && response.success) { 
            // 存入成功頁面需要的格式化資料
            const finalOrderInfo = {
                order_id: customerInfo.order_id,
                order_date: customerInfo.order_date,
                customer: { 
                    name: customerInfo.name, 
                    email: customerInfo.email, 
                    shipping_method: customerInfo.shipping_method 
                },
                coupon: {
                    code: customerInfo.coupon_code,
                    discount: customerInfo.coupon_discount
                },
                summary: {
                    subtotal: summary.subtotal,
                    discount_total: summary.comboDiscount + summary.couponDiscount,
                    total_payable: summary.total
                },
                items: summary.processedItems
            };

            localStorage.setItem('last_order_info', JSON.stringify(finalOrderInfo));
            localStorage.removeItem('cart');
            window.location.href = "order_success.html"; 
        } else {
            throw new Error(response.error || "提交失敗");
        }
    } catch (err) {
        console.error("Submit Error:", err);
        showToast("提交失敗，請檢查網路連線");
        const btn = document.getElementById('submit-order-btn');
        btn.innerText = "提交訂單並結帳";
        btn.disabled = false;
    }
}

/**
 * 5. 優惠碼處理
 */
async function handleApplyCoupon() {
    const codeInput = document.getElementById('coupon-code');
    const applyBtn = document.getElementById('apply-coupon');
    const code = codeInput.value.trim().toUpperCase();
    if (!code) return showToast("請輸入優惠碼");
    if (appliedCoupons.some(c => c.code === code)) return showToast("此優惠代碼已套用");

    applyBtn.disabled = true;
    applyBtn.innerText = "...";
    try {
        const result = await ApiService.checkCoupon(code); 
        if (result.success) {
            appliedCoupons.push({ 
                code, 
                amount: Number(result.amount), 
                remark: result.remark || "優惠折扣" 
            });
            showToast(`成功套用：${result.remark || code}`);
            codeInput.value = ""; 
            updateShippingNotice();
            renderCart();
        } else {
            showToast("無效或已過期的優惠碼");
        }
    } catch (err) {
        showToast("系統繁忙");
    } finally {
        applyBtn.disabled = false;
        applyBtn.innerText = "套用";
    }
}

window.removeCoupon = function(idx) {
    appliedCoupons.splice(idx, 1);
    updateShippingNotice();
    renderCart();
    showToast("已移除優惠");
};

/**
 * 6. UI 更新與工具
 */
function updateUI(subtotal, combo, coupon, total, isFree) {
    const safeSet = (id, text) => {
        const el = document.getElementById(id);
        if (el) el.innerText = text;
    };

    safeSet('cart-subtotal', `NT$ ${subtotal.toLocaleString()}`);
    safeSet('discount-amount', `- NT$ ${(combo + coupon).toLocaleString()}`);
    safeSet('cart-total', `NT$ ${total.toLocaleString()}`);
    
    const shipText = document.getElementById('cart-shipping-text');
    if (shipText) {
        const method = document.getElementById('shipping-method').value;
        if (method === '面交' || isFree) {
            shipText.innerText = (method === '面交') ? "免運費" : "符合免運資格";
            shipText.style.color = "#2d8cf0";
        } else {
            shipText.innerText = "依賣場規定";
            shipText.style.color = "#888";
        }
    }
}

function updateShippingNotice() {
    const method = document.getElementById('shipping-method').value;
    const noticeEl = document.getElementById('shipping-notice');
    if (!noticeEl) return;
    const hasVipCoupon = appliedCoupons.some(c => VIP_COUPONS.includes(c.code));
    
    if (method === '7-11賣貨便') {
        const text = hasVipCoupon ? "※ 已套用 VIP 優惠，本單享受免運費優惠！" : "※ 官網只顯示商品金額與折扣金額，運費將由賣場當月設定為準。消費滿 NT$1,500 免運費";
        noticeEl.innerHTML = `<div style="background:#fff5f5; border:1px solid #d9534f; padding:12px; margin-top:10px; border-radius:4px;"><p style="color:#d9534f; font-size:12px; font-weight:bold; margin:0;">${text}</p></div>`;
    } else if (method === '面交') {
        noticeEl.innerHTML = `<div style="background:#f0f9ff; border:1px solid #337ab7; padding:12px; margin-top:10px; border-radius:4px;"><p style="color:#333; font-size:12px; font-weight:bold; margin:0;">※ 面交地點：雲林縣斗六市 - 斗六國中正大門 (640雲林縣斗六市育英北街69號)</p></div>`;
    } else { 
        noticeEl.innerHTML = ''; 
    }
}

function showToast(msg) {
    const toast = document.getElementById('custom-toast');
    if (toast) { 
        toast.innerText = msg; 
        toast.classList.add('show'); 
        setTimeout(() => toast.classList.remove('show'), 2500); 
    }
}

window.changeQty = function(index, delta) {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    if (cart[index] && cart[index].quantity + delta > 0) {
        cart[index].quantity += delta;
        localStorage.setItem('cart', JSON.stringify(cart));
        renderCart(); 
    }
};

window.deleteItem = function(index) {
    if(!confirm("確定移除商品？")) return;
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    cart.splice(index, 1);
    localStorage.setItem('cart', JSON.stringify(cart));
    renderCart();
    showToast("已移除商品");
};