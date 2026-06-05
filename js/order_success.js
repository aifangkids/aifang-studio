document.addEventListener('DOMContentLoaded', () => {
    // 1. 取得從 cart.js 存入的 localStorage 資料
    const orderData = JSON.parse(localStorage.getItem('last_order_info'));

    // 防錯處理：若無資料則導回首頁
    if (!orderData) {
        console.warn("未找到訂單資料，跳轉回首頁...");
        window.location.href = 'index.html';
        return;
    }

    // 2. 執行 Banner 圖與成功文字設定 (滿版響應式)
    setupSuccessBanner();

    // 3. 渲染網頁上的訂單明細資訊
    renderOrderInfo(orderData);

    // 4. 初始化全新指定格式的一鍵複製文字框
    initSharingMessage(orderData);
    
    // 畫面流暢置頂
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

/**
 * 設定滿版 Banner 圖與成功指定英文字
 */
function setupSuccessBanner() {
    document.body.classList.add('shop-active');
}
    const titleEl = document.getElementById('success-title-text');
    if (titleEl) {
        titleEl.innerText = "🌈 𝖸𝗈𝗎𝗋 𝗈𝗋𝖽𝖾𝗋 𝗁𝖺𝗌 𝖻𝖾𝖾𝗇 𝗉𝗅𝖺𝖼𝖾𝖽 𝗌𝗎𝖼𝖼𝖾𝗌𝗌𝖿𝗎𝗅𝗅𝗒";
    }

/**
 * 核心：渲染網頁訂單主要資訊與商品明細 (精準對齊 unitprice 欄位)
 */
function renderOrderInfo(data) {
    const safeSetText = (id, text) => {
        const el = document.getElementById(id);
        if (el) el.innerText = text || '';
    };

    // 基本資訊與配送方式對接
    safeSetText('display-order-id', data.order_id);
    safeSetText('display-name', data.customer.name);
    safeSetText('display-email', data.customer.email);
    safeSetText('display-shipping', data.customer.shipping_method || '7-11');
    safeSetText('display-subtotal', `NT$ ${Number(data.summary.subtotal).toLocaleString()}`);
    safeSetText('display-total', `NT$ ${Number(data.summary.total_payable).toLocaleString()}`);

    // 渲染商品明細列表 (✨ 修正：全面對齊 cart.js 與後台小寫 unitprice 格式)
    const listContainer = document.getElementById('display-item-list');
    if (listContainer && data.items) {
        listContainer.innerHTML = data.items.map(item => `
            <div class="success-item-row">
                <div class="item-img-box">
                    <img src="${item.image || './images/ui/no-image.jpg'}" onerror="this.src='./images/ui/no-image.jpg'">
                </div>
                <div class="item-details-box">
                    <div class="item-name-text">${item.name}</div>
                    <div class="item-spec-text">規格：${item.color} / ${item.size}</div>
                    <div class="item-qty-text">數量：${item.quantity} 件</div>
                </div>
                <div class="item-price-box">
                    NT$ ${(Number(item.unitprice || 0) * Number(item.quantity)).toLocaleString()}
                </div>
            </div>
        `).join('');
    }
}

/**
 * 生成全新指定格式的純淨複製文字內容
 */
function initSharingMessage(orderData) {
    // 組合訂單明細項 (格式： - 商品名稱 (顏色/尺寸) x數量)
    const itemsDetail = orderData.items.map(i => ` - ${i.name} (${i.color}/${i.size}) x${i.quantity}`).join('\n');
    
    // ✨ 嚴格更正為妳指定的純淨資料格式
    const msgText = `訂單編號：${orderData.order_id}
應付總額：NT$ ${orderData.summary.total_payable.toLocaleString()}
配送方式：${orderData.customer.shipping_method}
-----------------
預購明細：
${itemsDetail}`;

    // 填入前台顯示用的文字方塊
    const textareaEl = document.getElementById('order-summary-text');
    const copyBtn = document.getElementById('btn-copy-text');
    
    if (textareaEl) {
        textareaEl.value = msgText;
    }

    // 點擊按鈕一鍵複製到剪貼簿
    if (copyBtn) {
        copyBtn.addEventListener('click', async () => {
            try {
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    await navigator.clipboard.writeText(msgText);
                } else if (textareaEl) {
                    textareaEl.select();
                    document.execCommand('copy');
                }
                
                // 溫馨回饋視覺動態
                copyBtn.innerText = "✅ 複製成功";
                copyBtn.style.backgroundColor = "#c6dec6";
                copyBtn.style.color = "#4a6b4a";
                
                setTimeout(() => {
                    copyBtn.innerText = "📋 一鍵複製訂單訊息";
                    copyBtn.style.backgroundColor = "";
                    copyBtn.style.color = "";
                }, 2000);
            } catch (err) {
                console.error("複製失敗:", err);
                alert("複製失敗，請手動全選下方文字框內容進行複製。");
            }
        });
    }
}