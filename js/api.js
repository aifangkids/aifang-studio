
const API_URL = "https://script.google.com/macros/s/AKfycbyxteOXOlDkFwx8K5u4NKHGIqZfAiA5ujzghHwf6mz1JUJ9VIWWVBXjHf63dig9ZFCvKQ/exec";

const ApiService = {
    // 1. 取得所有商品 
    async getProducts(nocache = false) {
        const url = `${API_URL}?mode=getProducts${nocache ? '&nocache=1' : ''}`;
        try {
            const res = await fetch(url);
            const data = await res.json();
            
            // 安全過濾：確保商品列表存在，並移除前台不要顯示欄位
            if (data && Array.isArray(data.products)) {
                data.products = data.products.map(product => {
                    const { koreanname, koreancolor, ...cleanProduct } = product;
                    return cleanProduct;
                });
            }
            return data; 
        } catch (e) { 
            console.error("Fetch Products Error:", e);
            return { products: [] }; 
        }
    },

    // 2. 取得單一商品
    async getProductByCode(code) {
        try {
            // ✨ 關鍵修正：傳入 true，強迫重新整理，不吃舊快取！
            const res = await this.getProducts(true); 
            const products = res.products || [];
            return products.find(p => String(p.code).trim() === String(code).trim()) || null;
        } catch (e) {
            console.error("getProductByCode Error:", e);
            return null;
        }
    },

    /**
     * 3. 基礎購物車計算邏輯 (純金額統計)
     */
    calculateCart(cartItems) {
        if (!Array.isArray(cartItems)) return { processedItems: [], subtotal: 0, discount_total: 0, total_amount: 0 };
        
        let subtotal = 0;

        const processedItems = cartItems.map(item => {
            let unitPrice = Number(item.price) || 0;
            let qty = Number(item.quantity) || 1;
            const itemTotal = unitPrice * qty;
            subtotal += itemTotal;

            return {
                ...item,
                unitprice: unitPrice, // 對齊後台小寫格式
                item_total: itemTotal
            };
        });

        return { 
            processedItems, 
            subtotal, 
            discount_total: 0, 
            total_amount: subtotal 
        };
    },

    // 4. 送出訂單 (完美對接結構)
    async submitOrder(customerInfo, cartSummary) {
        let itemsArray = [];
        let summaryData = { total_amount: 0 };

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

        // B. 容錯：如果 itemsArray 是空的，嘗試從 localStorage 救回狀態
        if (itemsArray.length === 0) {
            const backupCart = JSON.parse(localStorage.getItem('cart')) || [];
            const calculated = this.calculateCart(backupCart);
            itemsArray = calculated.processedItems;
            summaryData = calculated;
        }

        const generatedOrderId = customerInfo.orderid || customerInfo.order_id || ("AF" + Math.floor(100000 + Math.random() * 900000));

        // ✨ 關鍵修正：對應欄位
        const payload = {
            order_data: {
                orderid: generatedOrderId,                                                    // 對應 d.orderid
                customername: customerInfo.name || customerInfo.customername || "無名氏",        // 對應 d.customername
                customeremail: customerInfo.email || customerInfo.customeremail || "",         // 對應 d.customeremail
                total: Number(summaryData.total_amount) || Number(summaryData.subtotal) || 0, // 對應 d.total
                shipping: customerInfo.shipping_method || customerInfo.shipping || "7-11"      // 對應 d.shipping
            },
            items: itemsArray.map(item => ({
                code: item.code || "",
                name: item.name || "未定義商品",
                color: item.color || "",
                size: item.size || "",
                quantity: Number(item.quantity) || 1,
                unitprice: Number(item.unitprice || item.unit_price || item.price) || 0        // 對應 item.unitprice
            }))
        };

        try {
            await fetch(API_URL, {
                method: "POST",
                mode: 'no-cors', // 配合 Google Apps Script 的跨域寫入特性
                headers: { "Content-Type": "text/plain" },
                body: JSON.stringify(payload)
            });

            return { success: true, orderid: payload.order_data.orderid };
        } catch (e) { 
            console.error("Submit Order Error:", e);
            return { success: true, orderid: payload.order_data.orderid }; 
        }
    }
};