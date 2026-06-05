const API_URL = "https://script.google.com/macros/s/AKfycbwgwzu96gbL1s2b7ZPVOiPJZDaBRHrx2K0zXYT5fblENjKJBYDa6v9O2gnkBuIEuXcMyQ/exec";

const ApiService = {
    // 1. 取得所有商品 
    async getProducts(nocache = false) {
        const url = `${API_URL}?mode=getProducts${nocache ? '&nocache=1' : ''}`;
        try {
            const res = await fetch(url);
            const data = await res.json();
            
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
            const res = await this.getProducts(true);
            const products = res.products || [];
            return products.find(p => String(p.code).trim() === String(code).trim()) || null;
        } catch (e) {
            console.error("getProductByCode Error:", e);
            return null;
        }
    },

    /**
     * 3. 基礎購物車計算邏輯 (✨ 關鍵修正：完美相容 unitprice 與 price，防止金額變 0)
     */
    calculateCart(cartItems) {
        if (!Array.isArray(cartItems)) return { processedItems: [], subtotal: 0, discount_total: 0, total_amount: 0 };
        let subtotal = 0;

        const processedItems = cartItems.map(item => {
            // ✨ 同時相容並防禦兩種前台可能出現的商品金額欄位名稱
            let unitPrice = Number(item.unitprice || item.price || 0);
            let qty = Number(item.quantity || 1);
            const itemTotal = unitPrice * qty;
            subtotal += itemTotal;

            return {
                ...item,
                unitprice: unitPrice, 
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

    // 4. 送出訂單 
    async submitOrder(customerInfo, cartSummary) {
        let itemsArray = [];
        let summaryData = { total_amount: 0 };

        if (Array.isArray(cartSummary)) {
            itemsArray = cartSummary;
        } else if (cartSummary && cartSummary.processedItems) {
            itemsArray = cartSummary.processedItems;
            summaryData = cartSummary;
        } else if (typeof cartSummary === 'object' && cartSummary !== null) {
            itemsArray = cartSummary.items || [];
            summaryData = cartSummary.summary || cartSummary;
        }

        if (itemsArray.length === 0) {
            const backupCart = JSON.parse(localStorage.getItem('cart')) || [];
            const calculated = this.calculateCart(backupCart);
            itemsArray = calculated.processedItems;
            summaryData = calculated;
        }

        const generatedOrderId = customerInfo.orderid || customerInfo.order_id || ("AF" + Math.floor(100000 + Math.random() * 900000));

        // ✨ 欄位完美扣合發送
        const payload = {
            order_data: {
                orderid: generatedOrderId,                                                  
                customername: customerInfo.name || customerInfo.customername || "無名氏",        
                customeremail: customerInfo.email || customerInfo.customeremail || "",         
                total: Number(summaryData.total_amount) || Number(summaryData.subtotal) || 0, 
                shipping: customerInfo.shipping_method || customerInfo.shipping || "7-11"      
            },
            items: itemsArray.map(item => ({
                code: item.code || "",
                name: item.name || "未定義商品",
                color: item.color || "",
                size: item.size || "",
                quantity: Number(item.quantity) || 1,
                unitprice: Number(item.unitprice || item.price || 0) // ✨ 確保帶入單價寫入後台
            }))
        };

        try {
            await fetch(API_URL, {
                method: "POST",
                mode: 'no-cors', 
                headers: { "Content-Type": "text/plain" },
                body: JSON.stringify(payload)
            });
            return { success: true, orderid: payload.order_data.orderid };
        } catch (e) { 
            console.error("Submit Order Error:", e);
            // ✨ 修正：出錯時必須回傳 false，前台才不會誤以為成功而洗掉購物車
            return { success: false, error: e.toString() }; 
        }
    }
};