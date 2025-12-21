// assets/js/index.js (偵錯版)

document.addEventListener("DOMContentLoaded", async () => {
  console.log("🚀 index.js 開始執行...");

  // 1. 檢查容器是否存在
  const container = document.getElementById("product-list");
  if (!container) {
    console.error("❌ 嚴重錯誤：找不到 id='product-list' 的 HTML 標籤！請檢查 index.html");
    return;
  }
  console.log("✅ 成功找到容器 product-list");

  // 2. 顯示 Skeleton
  container.innerHTML = `<p>⏳ 載入中...</p>`;

  // 3. 嘗試呼叫 API
  console.log("📡 準備呼叫 fetchProducts()...");
  try {
    const products = await fetchProducts();
    console.log("📦 API 回傳資料:", products);

    if (!products || products.length === 0) {
      console.warn("⚠️ API 回傳了空陣列 (沒有商品資料)");
      container.innerHTML = "<p>目前沒有商品。</p>";
      return;
    }

    // 4. 開始渲染
    console.log(`🎨 準備渲染 ${products.length} 筆商品...`);
    
    const html = products.map(p => {
      // 防呆：確保價格存在
      const price = p.sizes?.baby?.salePrice || p.sizes?.baby?.price || p.price || 999;
      
      return `
        <div class="product-card">
          <a href="detail.html?code=${p.code}">
            <img src="${p.mainImage}" alt="${p.name}" onerror="this.src='https://placehold.co/300x300?text=No+Image'">
          </a>
          <h3>${p.name}</h3>
          <p class="brand">${p.brand || ''}</p>
          <div class="price">NT$ ${price}</div>
        </div>
      `;
    }).join('');

    container.innerHTML = html;
    console.log("✅ 渲染完成！");

  } catch (error) {
    console.error("❌ 發生錯誤:", error);
    container.innerHTML = `<p style="color:red">系統發生錯誤，請查看 Console</p>`;
  }
});