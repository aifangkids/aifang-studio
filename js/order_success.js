/**
 * AiFang Kids - order_success.js
 * [2026.02 最終整合版]
 * 負責：隨機成功圖示、完整訂單明細展示、LINE 訊息複製與跳轉
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. 取得從 cart.js 存入的資料
    const orderData = JSON.parse(localStorage.getItem('last_order_info'));

    // 異常處理：若無資料則導回首頁
    if (!orderData) {
        console.warn("未找到訂單資料，跳轉回首頁...");
        window.location.href = 'index.html';
        return;
    }

    // 2. 執行隨機圖片更換 (success01 ~ success05)
    randomizeSuccessImage();

    // 3. 渲染頁面資訊
    renderOrderInfo(orderData);

    // 4. 初始化 LINE 轉傳按鈕邏輯
    initLineAction(orderData);
    
    // 畫面置頂
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

/**
 * 隨機更換成功圖片
 */
function randomizeSuccessImage() {
    const imgEl = document.getElementById('success-icon-img');
    if (imgEl) {
        const randomNum = Math.floor(Math.random() * 5) + 1; 
        imgEl.src = `./images/ui/success0${randomNum}.png`;
    }
}

/**
 * 渲染訂單主要資訊與商品明細
 */
function renderOrderInfo(data) {
    const safeSetText = (id, text) => {
        const el = document.getElementById(id);
        if (el) el.innerText = text || '';
    };

    // 基本資訊渲染 (對接 cart.js 存入的物件層級)
    safeSetText('display-order-id', data.order_id);
    safeSetText('display-name', data.customer.name);
    safeSetText('display-email', data.customer.email);
    safeSetText('display-total', `NT$ ${Number(data.summary.total_payable).toLocaleString()}`);

    // 渲染商品明細列表
    const listContainer = document.getElementById('display-item-list');
    if (listContainer && data.items) {
        listContainer.innerHTML = data.items.map(item => `
            <div class="success-item-row" style="display:flex; align-items:center; gap:15px; padding:15px 0; border-bottom:1px solid #f5f5f5;">
                <div style="position:relative;">
                    <img src="${item.image || './images/ui/no-image.jpg'}" 
                         style="width:70px; height:70px; object-fit:cover; border-radius:8px; border:1px solid #eee;"
                         onerror="this.src='./images/ui/no-image.jpg'">
                </div>
                <div style="flex:1;">
                    <div style="font-weight:700; font-size:14px; color:#333; margin-bottom:4px;">${item.name}</div>
                    <div style="font-size:12px; color:#777;">
                        規格：${item.color} / ${item.size}
                    </div>
                    <div style="font-size:12px; color:#999; margin-top:2px;">數量：${item.quantity} 件</div>
                </div>
                <div style="font-weight:700; color:#111; font-size:14px;">
                    NT$ ${(Number(item.unit_price || item.price || 0) * Number(item.quantity)).toLocaleString()}                </div>
            </div>
        `).join('');
    }

    // 渲染費用摘要
    safeSetText('display-subtotal', `NT$ ${Number(data.summary.subtotal).toLocaleString()}`);
    
    // 折扣金額 (組合折扣 + 優惠券折抵)
    const totalDiscount = Number(data.summary.discount_total || 0);
    safeSetText('display-discount', `- NT$ ${totalDiscount.toLocaleString()}`);

    // 顯示優惠碼備註
    const remarkEl = document.getElementById('display-coupon-remark');
    if (remarkEl && data.coupon && data.coupon.code) {
        remarkEl.innerText = `(已套用優惠: ${data.coupon.code})`;
        remarkEl.style.display = 'block';
    } else if (remarkEl) {
        remarkEl.style.display = 'none';
    }
}

/**
 * 初始化 LINE 跳轉按鈕
 */
function initLineAction(orderData) {
    const lineBtn = document.getElementById('line-link');
    const copyHelper = document.getElementById('copy-helper'); // 隱藏的 textarea 用於複製
    if (!lineBtn) return;

    lineBtn.addEventListener('click', async (e) => {
        e.preventDefault();

        // 1. 自動生成要傳送給客服的訊息內容
        const itemsDetail = orderData.items.map(i => ` - ${i.name} (${i.color}/${i.size}) x${i.quantity}`).join('\n');
        const msg = `💗 AiFang Kids 訂單確認 💗\n--------------------\n訂單編號：${orderData.order_id}\n訂購人：${orderData.customer.name}\n應付總額：NT$ ${orderData.summary.total_payable.toLocaleString()}\n配送方式：${orderData.customer.shipping_method}\n--------------------\n訂單明細：\n${itemsDetail}\n\n我已完成下單，請幫我確認訂單，謝謝！`;

        // 2. 執行複製動作
        const originalContent = lineBtn.innerHTML;
        lineBtn.innerHTML = "<span>✅ 訂單已複製！跳轉 LINE 中...</span>";

        try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(msg);
            } else if (copyHelper) {
                copyHelper.value = msg;
                copyHelper.select();
                document.execCommand('copy');
            }

            // 3. 延遲後跳轉至 LINE 官方帳號並帶入訊息 (或讓用戶手動貼上)
            setTimeout(() => {
                const encodedMsg = encodeURIComponent(msg);
                // 跳轉至 LINE 並嘗試開啟對話框
                window.location.href = `https://line.me/R/oaMessage/@844bwwjl/?${encodedMsg}`;
                
                // 兩秒後恢復按鈕文字
                setTimeout(() => {
                    lineBtn.innerHTML = originalContent;
                }, 2000);
            }, 600);

        } catch (err) {
            console.error("LINE Action error:", err);
            alert("訂單已提交成功！請截圖此頁面並傳送給官方 LINE 客服。");
            lineBtn.innerHTML = originalContent;
        }
    });
}