/**
 * load-snippets.js
 * --------------------------------------------------
 * 職責（非常單一、非常清楚）：
 * 1. 載入共用 HTML（header / footer / sidebar）
 * 2. 插入到對應容器
 * 3. 載入完成後，讓各元件「自己啟動」
 *
 * ❌ 不碰 API
 * ❌ 不碰商品資料
 * ❌ 不寫任何商業邏輯
 * --------------------------------------------------
 */

document.addEventListener("DOMContentLoaded", loadAllSnippets);

async function loadAllSnippets() {
  await Promise.all([
    loadSnippet("header",  "/assets/snippets/header.html"),
    loadSnippet("footer",  "/assets/snippets/footer.html"),
    loadSnippet("sidebar", "/assets/snippets/sidebar.html")
  ]);

  // snippets 載入完成後，通知全站
  document.dispatchEvent(new Event("snippets:loaded"));
}

/* ==================================================
   共用載入工具
================================================== */

async function loadSnippet(id, url) {
  const container = document.getElementById(id);
  if (!container) return;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`載入失敗：${url}`);

    const html = await res.text();
    container.innerHTML = html;
  } catch (err) {
    console.error(err);
  }
}
