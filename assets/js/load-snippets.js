/**
 * assets/js/load-snippets.js
 * 職責：載入全站 HTML 片段並填充 [31項檢核] 相關數據
 */

async function loadSnippets() {
    console.log("🏗️ Snippets: 開始組裝頁面骨架...");

    const snippets = [
        { id: 'header-placeholder', file: 'assets/snippets/header.html' },
        { id: 'footer-placeholder', file: 'assets/snippets/footer.html' },
        { id: 'sidebar-placeholder', file: 'assets/snippets/sidebar.html' }
    ];

    for (const item of snippets) {
        const target = document.getElementById(item.id);
        if (!target) continue;

        try {
            const response = await fetch(item.file);
            if (!response.ok) throw new Error(`無法讀取 ${item.file}`);
            const html = await response.text();
            target.innerHTML = html;
        } catch (error) {
            console.error(`❌ Snippets Error [4.5]:`, error);
            target.style.display = 'none'; // 防錯：載入失敗就隱藏該區塊
        }
    }

    // 填充數據
    hydrateSnippets();
}

/**
 * 數據填充 (Hydration)
 * 對應項目：[1.1], [6.1], [6.2], [6.3], [5.4]
 */
function hydrateSnippets() {
    // [1.1] LOGO 設定 (修正路徑)
    const logoImgs = document.querySelectorAll('.header-logo img');
    logoImgs.forEach(img => {
        img.src = CONFIG.BRAND.LOGO_IMG;
        img.alt = CONFIG.BRAND.NAME;
    });

    // [6.2] 自動更新年份
    const yearSpan = document.getElementById('year');
    if (yearSpan) yearSpan.innerText = new Date().getFullYear();

    // [6.1] Footer 客服資訊
    const footerEmail = document.getElementById('footer-email');
    if (footerEmail) footerEmail.innerText = CONFIG.BRAND.EMAIL;
    
    // [6.3] 公司資訊
    const footerCompany = document.getElementById('footer-company');
    if (footerCompany) footerCompany.innerText = CONFIG.BRAND.COMPANY_FULL_NAME;

    const footerTax = document.getElementById('footer-tax');
    if (footerTax) footerTax.innerText = CONFIG.BRAND.TAX_ID;

    // [5.4] LINE 連結同步
    const lineLinks = document.querySelectorAll('.quick-line-link');
    lineLinks.forEach(link => {
        link.href = CONFIG.BRAND.LINE_URL;
    });

    console.log("✨ Snippets: 31項相關數據填充完成");
}

document.addEventListener('DOMContentLoaded', loadSnippets);