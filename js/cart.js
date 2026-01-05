export function calculateOrder(cartItems, paymentMethod) {
    // 1. 商品小計
    let subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0); [cite: 29]

    // 2. 1+1 穿搭折扣 (自動判定配對)
    let bundleDiscount = 0;
    const itemCodesInCart = cartItems.map(item => item.code);
    
    cartItems.forEach(item => {
        // 檢查該商品的 styling_with 是否有出現在購物車中
        if (item.styling_with && item.styling_with.some(matchCode => itemCodesInCart.includes(matchCode))) {
            bundleDiscount += 100; // 每符合一組折扣 100 [cite: 85, 96]
        }
    });

    // 3. 付款方式折扣 (小計 - 1+1折扣後再打折)
    let afterBundle = subtotal - bundleDiscount;
    let paymentRate = (paymentMethod === 'transfer') ? 0.8 : 0.9; // 匯款 0.8 / 貨到 0.9 [cite: 31, 88-89]
    let finalAmount = afterBundle * paymentRate;

    // 4. 運費判斷
    let shipping = 45;
    // 匯款免運 或 最終金額 >= 1500 免運 [cite: 32, 91-92]
    if (paymentMethod === 'transfer' || finalAmount >= 1500) {
        shipping = 0;
    }

    return {
        subtotal,
        bundleDiscount,
        paymentDiscount: Math.round(afterBundle * (1 - paymentRate)),
        shipping,
        total: Math.round(finalAmount + shipping) [cite: 33, 94]
    };
}