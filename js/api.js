const GAS_URL = 'https://script.google.com/macros/s/AKfycbxnlAwKJucHmCKcJwv67TWuKV0X74Daag9X9I4NG7DOESREuYdU7BtWBPcEHyoJphoEfg/exec';

export async function fetchProducts() {
    try {
        const response = await fetch(GAS_URL);
        return await response.json(); [cite: 1, 44]
    } catch (error) {
        console.error("資料讀取失敗:", error);
        return [];
    }
}