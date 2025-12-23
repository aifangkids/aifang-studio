// assets/js/config.js
// 改回您原本 api.js 認得的變數名稱
const GAS_URL = "https://script.google.com/macros/s/AKfycbxrmloTY4wCo1Sn5tgMQDRwhU8uXWBTA0c6v17ec7M6W5LkufjES1fjJBolMb_552z5/exec";

// 為了讓 detail.js 也能用，我們保留一個物件封裝
const CONFIG = {
    API_URL: GAS_URL,
    SITE_NAME: "AiFang Kids Studio"
};

console.log("✅ 設定檔已載入，GAS_URL 已就緒");
