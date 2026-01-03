const API_URL = "https://script.google.com/macros/s/AKfycbxnlAwKJucHmCKcJwv67TWuKV0X74Daag9X9I4NG7DOESREuYdU7BtWBPcEHyoJphoEfg/exec";

async function fetchProducts() {
    try {
        const res = await fetch(API_URL);
        const data = await res.json();
        return data.products || [];
    } catch (err) {
        console.error("API fetch error:", err);
        return [];
    }
}
