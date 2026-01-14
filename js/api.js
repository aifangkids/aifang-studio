// 您的 GAS 網址
const API_URL = 'https://script.google.com/macros/s/AKfycbxnlAwKJucHmCKcJwv67TWuKV0X74Daag9X9I4NG7DOESREuYdU7BtWBPcEHyoJphoEfg/exec';

export async function fetchProducts() {
    try {
        const response = await fetch(API_URL);
        const data = await response.json();
        // 根據您的 JSON 結構，資料在 data.products 裡
        return data.products || []; 
    } catch (error) {
        console.error("資料讀取失敗:", error);
        return [];
    }
}