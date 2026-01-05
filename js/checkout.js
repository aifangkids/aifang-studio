async function submitOrder(orderData) {
    const response = await fetch(https://script.google.com/macros/s/AKfycbxnlAwKJucHmCKcJwv67TWuKV0X74Daag9X9I4NG7DOESREuYdU7BtWBPcEHyoJphoEfg/exec, {
        method: 'POST',
        body: JSON.stringify(orderData)
    });
    
    if (response.ok) {
        alert("訂單已成立！訂單編號：" + generateOrderNo()); [cite: 23]
        localStorage.removeItem('cart'); // 清空購物車
        window.location.href = 'index.html';
    }
}