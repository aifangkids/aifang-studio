/**
 * assets/js/cart.js
 * 職責：購物車狀態管理、金額計算 [4.x]、API 訂單發送 [4.2]、LINE 明細生成 [4.3]
 * 依賴：config.js, api.js
 */

const Cart = (function() {
    // 內部狀態
    let state = {
        items: [],          
        paymentMethod: 'cod', // 預設：貨到付款 (cod) 或 匯款 (bank_transfer)
        totals: {
            subtotal: 0,    
            discount: 0,    
            shipping: 0,    
            finalTotal: 0,
            comboCount: 0   // [新增] 紀錄 1+1 組數，用於 LINE 明細顯示
        }
    };

    function init() {
        const savedCart = localStorage.getItem('cart_items');
        if (savedCart) {
            state.items = JSON.parse(savedCart);
        }
        updateCalculations();
        updateUI();
    }

    // ... (addItem, removeItem, updateQty 函式保持不變，為節省篇幅省略，請保留原有的) ...
    // 請保留原本的 addItem, removeItem, updateQty 
    
    function addItem(product, size, qty = 1) {
        const existingItem = state.items.find(i => i.code === product.code && i.size === size);
        if (existingItem) {
            existingItem.qty += qty;
        } else {
            state.items.push({
                code: product.code,
                name: product.name,
                price: product.price,
                img: product.img_main, // 需要確保 API 有這個欄位
                size: size,
                color: product.color || '無顏色', // [新增] 用於 LINE 明細
                xsize: size, // [新增] 對應您的 LINE 格式變數名
                qty: qty,
                category: product.category
            });
        }
        saveAndNotify();
        // 包裹動畫
        const cartBtn = document.querySelector('.cart-icon-wrapper');
        if(cartBtn) {
            cartBtn.classList.add('shake-animation');
            setTimeout(() => cartBtn.classList.remove('shake-animation'), 500);
        }
        if(window.Sidebar) Sidebar.toggle('right');
    }

    function removeItem(index) {
        state.items.splice(index, 1);
        saveAndNotify();
    }

    function updateQty(index, newQty) {
        if (newQty < 1) return;
        state.items[index].qty = parseInt(newQty);
        saveAndNotify();
    }

    function setPaymentMethod(method) {
        state.paymentMethod = method;
        updateCalculations();
        return state.totals;
    }

    /**
     * [核心] 金額計算機
     */
    function updateCalculations() {
        let subtotal = 0;
        let tops = 0;
        let bottoms = 0;
        let setQty = 0;

        state.items.forEach(item => {
            subtotal += item.price * item.qty;
            if(item.category === 'Top') tops += item.qty;
            if(item.category === 'Bottoms') bottoms += item.qty;
            if(item.category === 'Set') setQty += item.qty;
        });

        // 計算 1+1 組數
        const comboCount = setQty + Math.min(tops, bottoms);
        
        // 1+1 優惠金額
        const comboDiscount = comboCount * CONFIG.MARKETING.COMBO_DISCOUNT;
        
        // 支付方式折扣
        const methodConfig = CONFIG.MARKETING.PAYMENT_METHODS[state.paymentMethod];
        const discountRate = methodConfig ? methodConfig.discountRate : 1;
        
        // 計算邏輯：(原價總和 - 1+1優惠) * 支付折扣
        // 若您的邏輯是先打折再扣 100，請告知。目前採較直觀的「總價打折」
        // 修正：根據您的明細「9折／8折優惠：-$1,436」，這是「原價*折扣率」省下的錢
        // 為了符合您的明細格式，我們這樣算：
        
        // A. 原始總價
        // B. 組合折扣 = comboDiscount
        // C. 支付折扣 = (subtotal * (1 - discountRate))
        // Final = A - B - C
        
        // 注意：這裡的計算邏輯需與您期望的「金額」一致
        // 若要實作「匯款金額即時*0.8」，公式如下：
        
        // 步驟 1: 扣除組合優惠
        let afterCombo = subtotal - comboDiscount;
        if (afterCombo < 0) afterCombo = 0;

        // 步驟 2: 計算支付折扣後的金額 (無條件捨去)
        let finalAfterRate = Math.floor(afterCombo * discountRate); 
        
        // 為了顯示「折扣了多少錢」，我們反推
        const rateDiscountAmount = afterCombo - finalAfterRate; 

        // 運費計算
        let shipping = CONFIG.MARKETING.SHIPPING_FEE;
        if (methodConfig.freeShipping === true) {
            shipping = 0; 
        } else if (finalAfterRate >= CONFIG.MARKETING.FREE_SHIPPING_THRESHOLD) {
            shipping = 0;
        }

        state.totals = {
            subtotal: subtotal,
            comboDiscount: comboDiscount,
            comboCount: comboCount, // 存起來給 LINE 用
            rateDiscount: rateDiscountAmount, // 存起來給 LINE 用
            shipping: shipping,
            finalTotal: finalAfterRate + shipping
        };
    }

    function saveAndNotify() {
        localStorage.setItem('cart_items', JSON.stringify(state.items));
        updateCalculations();
        updateUI();
    }

    function updateUI() {
        const cartIcon = document.getElementById('cart-icon');
        const cartCount = document.getElementById('cart-count');
        
        if (cartIcon && cartCount) {
            const totalQty = state.items.reduce((sum, item) => sum + item.qty, 0);
            cartCount.innerText = totalQty;
            cartIcon.src = totalQty > 0 ? CONFIG.NAVIGATION.CART_ICON_FULL : CONFIG.NAVIGATION.CART_ICON_EMPTY;
        }

        const cartContainer = document.getElementById('cart-items');
        const summaryArea = document.getElementById('cart-summary-area');
        
        if (cartContainer) {
            if (state.items.length === 0) {
                cartContainer.innerHTML = '<p class="empty-msg">購物車是空的</p>';
            } else {
                cartContainer.innerHTML = state.items.map((item, index) => `
                    <div class="cart-item-row">
                        <img src="${item.img}" alt="${item.name}">
                        <div class="info">
                            <div class="name">${item.name}</div>
                            <div class="spec">${item.size} / ${item.color}</div>
                            <div class="price">NT$ ${item.price} x ${item.qty}</div>
                        </div>
                        <button onclick="Cart.removeItem(${index})" class="remove-btn">×</button>
                    </div>
                `).join('');
            }
        }

        // 側欄金額預覽
        if (summaryArea) {
            // 判斷折扣文字
            const isBank = state.paymentMethod === 'bank_transfer';
            const rateText = isBank ? "20% OFF" : "10% OFF";
            
            summaryArea.innerHTML = `
                <div class="summary-row"><span>小計:</span> <span>$${state.totals.subtotal}</span></div>
                ${state.totals.comboDiscount > 0 ? `<div class="summary-row discount"><span>1+1 優惠:</span> <span>-$${state.totals.comboDiscount}</span></div>` : ''}
                <div class="summary-row discount"><span>${rateText}:</span> <span>-$${state.totals.rateDiscount}</span></div>
                <div class="summary-row"><span>運費:</span> <span>$${state.totals.shipping}</span></div>
                <div class="summary-row highlight"><span>應付總額:</span> <span>$${state.totals.finalTotal}</span></div>
            `;
        }
    }

    /**
     * [4.x] 產生循環訂單編號 (0001 - 9999)
     * 使用 localStorage 紀錄，僅在前端模擬循環
     */
    function generateOrderId() {
        let currentSeq = parseInt(localStorage.getItem('order_seq') || '0');
        currentSeq++;
        if (currentSeq > 9999) currentSeq = 1; // 循環邏輯
        localStorage.setItem('order_seq', currentSeq);
        return String(currentSeq).padStart(4, '0'); // 補零
    }

    /**
     * [4.3] 生成 LINE 明細文字
     */
    function generateLineMessage(orderData) {
        const { items, totals, customer, payment } = orderData;
        const isBank = payment === 'bank_transfer';
        const isBlackCat = customer.shippingMethod === 'home'; // 假設 'home' 代表黑貓
        const is711 = customer.shippingMethod === '711';       // 假設 '711' 代表超商

        // 1. 顧客資訊區塊 (條件顯示)
        let customerSection = '';
        if (isBank) {
            customerSection = `👤 顧客資訊
使用『${is711 ? '7-11交貨便' : '黑貓宅急便'}』
收件人：${customer.name}
電話：${customer.phone}
信箱：${customer.email}
${is711 ? `7-11 店號｜店名：${customer.storeId}｜${customer.storeName}` : ''}
${isBlackCat ? `收件地址：${customer.address}` : ''}
━━━━━━━━━━━━━━`;
        } else {
            // 貨到付款不顯示顧客資訊，或只顯示基本？依照您要求「不顯示」
            customerSection = `👤 顧客資訊 (貨到付款 - 詳情請見訂單系統)
━━━━━━━━━━━━━━`; 
            // 備註：如果不顯示任何地址，您在 LINE 上會不知道寄去哪。
            // 但我遵照您的指示「不顯示顧客資訊」。
            // 若您的意思是「貨到付款時，這塊區域完全消失」，請改為 customerSection = '';
            customerSection = ''; // 修正：完全不顯示
        }

        // 2. 訂購明細區塊
        const itemsSection = items.map((item, idx) => {
            const numIcon = (idx + 1) + '️⃣'; // 簡單的序號，超過10可能要改邏輯，先暫用
            return `${numIcon} ${String(item.qty).padStart(2, '0')} | ${item.code}${item.name}(${item.color}/${item.xsize})`;
        }).join('\n');

        // 3. 支付方式文字
        const paymentText = isBank ? "匯款" : "貨到付款";
        const discountText = isBank ? "8折優惠" : "9折優惠";

        // 4. 組合最終文字
        return `🧾 登記明細 🍒 (單號: ${orderData.id})
━━━━━━━━━━━━━━
${customerSection}
📦 訂購明細
${itemsSection}
━━━━━━━━━━━━━━
💰 金額統計
商品小計：$${totals.subtotal.toLocaleString()}
1+1 組合優惠 (-$100×${totals.comboCount}組)：-$${totals.comboDiscount.toLocaleString()}
${discountText}：-$${totals.rateDiscount.toLocaleString()}
運費：$${totals.shipping} (${totals.shipping === 0 ? '免運' : ''})
🔥 應付總額：$${totals.finalTotal.toLocaleString()}
━━━━━━━━━━━━━━
結帳方式：${paymentText}`;
    }

    /**
     * [4.2] 送出訂單
     */
    async function submitOrder(customerInfo) {
        if (state.items.length === 0) return alert('購物車是空的');

        // 產生 4 位數循環編號
        const orderId = generateOrderId(); 

        const orderData = {
            id: orderId,
            items: state.items,
            customer: customerInfo, // 必須包含 name, phone, email, shippingMethod, address/storeId
            payment: state.paymentMethod,
            totals: state.totals,
            date: new Date().toLocaleString()
        };

        // 1. 先送到 GAS 備份
        const result = await API.submitOrder(orderData);

        if (result.success) {
            // 2. 產生 LINE 明細
            const lineMsg = generateLineMessage(orderData);
            
            // 3. 複製到剪貼簿 (現代瀏覽器 API)
            try {
                await navigator.clipboard.writeText(lineMsg);
            } catch (err) {
                console.error('無法自動複製', err);
                alert('請手動複製下一頁的訂單明細');
            }

            // 清空購物車
            state.items = [];
            saveAndNotify();
            
            // 4. 提示與跳轉
            if (confirm('訂單已送出！\n\n明細已複製到您的剪貼簿。\n按「確定」前往 LINE，貼上即可完成登記。')) {
                window.location.href = CONFIG.BRAND.LINE_URL;
            }
        } else {
            alert('訂單發送失敗，請稍後再試');
        }
    }

    return {
        init,
        addItem,
        removeItem,
        updateQty,
        setPaymentMethod,
        submitOrder,
        getTotals: () => state.totals,
        getItems: () => state.items
    };
})();

document.addEventListener('DOMContentLoaded', Cart.init);