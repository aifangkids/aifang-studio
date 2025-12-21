// load-snippets.js
// 功能：載入 HTML snippet，防呆、提示缺少檔案、路徑穩定

async function loadSnippet(fileName, containerId) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.warn(`loadSnippet 防呆：容器 #${containerId} 不存在`);
        return;
    }

    const snippetPath = `assets/snippets/${fileName}.html`; // 相對路徑，穩定

    try {
        const response = await fetch(snippetPath);
        if (!response.ok) {
            console.warn(`載入失敗：${snippetPath} (${response.status})`);
            container.innerHTML = `<p style="color:red;">⚠️ 無法載入 ${fileName}</p>`;
            return;
        }
        const html = await response.text();
        container.innerHTML = html;
    } catch (err) {
        console.error(`載入 ${snippetPath} 時發生錯誤:`, err);
        container.innerHTML = `<p style="color:red;">⚠️ 載入 ${fileName} 發生錯誤</p>`;
    }
}

// 一次載入多個 snippet
async function loadAllSnippets(snippets) {
    if (!Array.isArray(snippets) || snippets.length === 0) return;

    const promises = snippets.map(s => loadSnippet(s.fileName, s.containerId));
    await Promise.all(promises);
}

// 自動在 DOMContentLoaded 後載入
document.addEventListener('DOMContentLoaded', () => {
    // 這裡你可以自行改 snippet 名稱與對應容器 ID
    const snippetsToLoad = [
        { fileName: 'header', containerId: 'header-container' },
        { fileName: 'footer', containerId: 'footer-container' },
        { fileName: 'sidebar', containerId: 'sidebar-container' }
    ];

    loadAllSnippets(snippetsToLoad);
});
