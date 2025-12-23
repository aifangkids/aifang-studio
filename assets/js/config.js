// assets/js/config.js
// 全站設定：存放 API 網址與基本資訊

const CONFIG = {
    // 你的 Google Apps Script 部署網址
    API_URL: "https://script.google.com/macros/s/AKfycbxrmloTY4wCo1Sn5tgMQDRwhU8uXWBTA0c6v17ec7M6W5LkufjES1fjJBolMb_552z5/exec",
    
    // 網站基本資訊
    SITE_NAME: "AiFang Kids Studio",
    
    // 版本控制（可選，方便清除瀏覽器快取）
    VERSION: "1.0.2"
};

// 偵錯確認
console.log(`✅ ${CONFIG.SITE_NAME} 設定檔已載入 (v${CONFIG.VERSION})`);
