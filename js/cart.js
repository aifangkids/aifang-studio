export function calculateTotal(cartItems, paymentMethod) {
    let subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0); [cite: 29]
    
    // 1+1 穿搭折扣計算 [cite: 85, 95, 96]
    let bundleDiscount = 0;
    // 邏輯：檢查購物車內是否有符合 Styling Tips 的 code 配對
    // 每符合一組折扣 100
    
    let discountedPrice = subtotal - bundleDiscount;

    // 付款方式折扣 [cite: 87, 97]
    let paymentRate = (paymentMethod === 'transfer') ? 0.8 : 0.9;
    let finalPrice = discountedPrice * paymentRate;

    // 運費判斷 [cite: 90, 98]
    let shipping = 45;
    if (finalPrice >= 1500 || paymentMethod === 'transfer') {
        shipping = 0;
    }

    return {
        subtotal,
        bundleDiscount,
        paymentDiscount: discountedPrice - finalPrice,
        shipping,
        total: finalPrice + shipping [cite: 33, 94]
    };
}