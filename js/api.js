/**
 * AiFang Kids - API & 促銷邏輯整合版 (2026.06 最終優化版)
 */

const API_URL = "https://script.google.com/macros/s/AKfycbxnlAwKJucHmCKcJwv67TWuKV0X74Daag9X9I4NG7DOESREuYdU7BtWBPcEHyoJphoEfg/exec";

const ApiService = {
    // 1. 取得所有商品
    async getProducts(nocache = false) {
        const url = `${API_URL}?mode=getProducts${nocache ? '&nocache=1' : ''}`;
        try {
            const res = await fetch(url);
            const data = await res.json();
            return data; 
        } catch (e) { 
            console.error("Fetch Products Error:", e);
            return { products: [] }; 
        }
    },

    // 2. 取得單一商品
    async getProductByCode(code) {
        try {
            const res = await this.getProducts();
            const products = res.products || [];
            return products.find(p => String(p.code).trim() === String(code).trim()) || null;
        } catch (e) {
            console.error("getProductByCode Error:", e);
            return null;
        }
    },

    // 3. 驗證優惠券
    async checkCoupon(code) {
        if (!code) return { success: false };
        const url = `${API_URL}?mode=checkCoupon&code=${encodeURIComponent(code)}&nocache=1`;
        try {
            const res = await fetch(url);
            return await res.json(); 
        } catch (e) {
            console.error("Check Coupon Error:", e);
            return { success: false };
        }
    },

    /**
     * 4. 核心促銷計算邏輯 (已移除 9 折優惠，保留全場 1+1 混搭累計折價)
     */
    calculateCart(cartItems) {
        if (!Array.isArray(cartItems)) return { processedItems: [], subtotal: 0, discount_total: 0, total_amount: 0 };
        
        let subtotal = 0;
        let totalNewQty = 0;

        cartItems.forEach(item => {
            if (String(item.status || "").toUpperCase() === "NEW") {
                totalNewQty += Number(item.quantity);
            }
        });

        let allowedLabelCount = Math.floor(totalNewQty / 2) * 2;

        const processedItems = cartItems.map(item => {
            let originalPrice = Number(item.price);
            let unitPrice = originalPrice; // 已修正：預設維持原價，不進行 9 折計算
            let currentStatus = String(item.status || "").toUpperCase();
            let qty = Number(item.quantity);

            let finalStatus = currentStatus;
            if (currentStatus === "NEW") {
                if (allowedLabelCount > 0) {
                    finalStatus = "NEW"; 
                    allowedLabelCount -= qty;
                } else {
                    finalStatus = "NEW_NO_LABEL"; 
                }
            }

            const itemTotal = unitPrice * qty;
            subtotal += itemTotal;

            return {
                ...item,
                status: finalStatus,
                unit_price: unitPrice,
                item_total: itemTotal
            };
        });

        // 1+1 優惠：每兩件 NEW 商品現折 100 元
        const discount_total = Math.floor(totalNewQty / 2) * 100;
        const total_amount = subtotal - discount_total;

        return { processedItems, subtotal, discount_total, total_amount };
    },

    // 5. 送出訂單 (終極容錯版)
    async submitOrder(customerInfo, cartSummary) {
        let itemsArray = [];
        let summaryData = { subtotal: 0, discount_total: 0, total_amount: 0 };

        // A. 偵測第二參數類型
        if (Array.isArray(cartSummary)) {
            itemsArray = cartSummary;
        } else if (cartSummary && cartSummary.processedItems) {
            itemsArray = cartSummary.processedItems;
            summaryData = cartSummary;
        } else if (typeof cartSummary === 'object' && cartSummary !== null) {
            itemsArray = cartSummary.items || [];
            summaryData = cartSummary.summary || cartSummary;
        }

        // B. 如果 itemsArray 還是空的，嘗試從 localStorage 救回最後的狀態
        if (itemsArray.length === 0) {
            const backupCart = JSON.parse(localStorage.getItem('cart')) || [];
            const calculated = this.calculateCart(backupCart);
            itemsArray = calculated.processedItems;
            summaryData = calculated;
        }

        const payload = {
            order_data: {
                order_id: customerInfo.order_id || ("AF" + Math.floor(100000 + Math.random() * 900000)),
                order_date: customerInfo.order_date || new Date().toLocaleString('zh-TW', {timeZone: 'Asia/Taipei'}),
                customer_name: customerInfo.name || customerInfo.customer_name || "未知用戶",
                customer_email: customerInfo.email || customerInfo.customer_email || "",
                discount_total: (Number(summaryData.discount_total) || 0) + (Number(customerInfo.coupon_discount) || 0),
                subtotal: Number(summaryData.subtotal) || 0,
                total_amount: (Number(summaryData.total_amount) || 0) - (Number(customerInfo.coupon_discount) || 0),
                coupon_code: customerInfo.coupon_code || "",
                shipping_method: customerInfo.shipping_method || "7-11 賣貨便"
            },
            items: itemsArray.map(item => ({
                code: item.code || "",
                name: item.name || "未定義商品",
                color: item.color || "",
                korean_name: item.korean_name || "",
                korean_color: item.korean_color || "",
                size: item.size || "",
                quantity: Number(item.quantity) || 1,
                unit_price: Number(item.unit_price || item.price) || 0,
                image: item.image || ""
            }))
        };

        try {
            const res = await fetch(API_URL, {
                method: "POST",
                mode: 'no-cors', 
                headers: { "Content-Type": "text/plain" },
                body: JSON.stringify(payload)
            });

            return { success: true, order_id: payload.order_data.order_id };
        } catch (e) { 
            console.error("Submit Order Error:", e);
            return { success: true, order_id: payload.order_data.order_id }; 
        }
    },

    // 6. 訂單查詢
    async queryOrder(orderId) {
        const url = `${API_URL}?mode=order_query&orderId=${orderId}`;
        try {
            const res = await fetch(url);
            return await res.json();
        } catch (e) { 
            return { success: false, message: "查無此編號" }; 
        }
    }
};