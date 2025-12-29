const API_URL = "https://script.google.com/macros/s/AKfycbxGx5-DLVsOyEgFsCnASkCbikJk9qBNTWcO3hWNdWqYiYcyv9QS2eg4ugFEEZ_IFiHWEA/exec";
const API_KEY = "300689";

async function fetchProducts() {
    const res = await fetch(`${API_URL}?mode=products&api_key=${API_KEY}`);
    const data = await res.json();
    return data.products || [];
}

async function postOrder(action, orderData) {
    const formData = new URLSearchParams({...orderData, api_key: API_KEY, action});
    const res = await fetch(API_URL, { method:'POST', body: formData });
    return await res.json();
}
