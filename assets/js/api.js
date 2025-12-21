// assets/js/api.js
const API_URL = "https://script.google.com/macros/s/AKfycbxrmloTY4wCo1Sn5tgMQDRwhU8uXWBTA0c6v17ec7M6W5LkufjES1fjJBolMb_552z5/exec";

/**
 * 取得全部商品與詳情 JSON
 * @returns {Promise<{products:Array, details:Array}>}
 */
async function fetchAllData() {
  try {
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error("無法取得資料");
    const data = await res.json();
    return data;
  } catch (err) {
    console.error("fetchAllData error:", err);
    return { products: [], details: [] };
  }
}

/**
 * 取得單一商品詳情
 * @param {string} code 商品代碼
 * @returns {Promise<Object|null>}
 */
async function fetchDetailByCode(code) {
  const data = await fetchAllData();
  if (!data.details || data.details.length === 0) return null;
  const detail = data.details.find(d => d.code === code);
  return detail || null;
}

/**
 * 取得產品列表
 * @returns {Promise<Array>}
 */
async function fetchProducts() {
  const data = await fetchAllData();
  return data.products || [];
}

/**
 * 取得產品顏色對應輪播圖
 * @param {string} code 商品代碼
 * @returns {Promise<Object>} { colors: [], carousel: [] }
 */
async function fetchColorsAndCarousel(code) {
  const detail = await fetchDetailByCode(code);
  if (!detail) return { colors: [], carousel: [] };
  return {
    colors: detail.colors || [],
    carousel: detail.carousel || []
  };
}

// --- 範例使用 ---
// fetchProducts().then(p => console.log(p));
// fetchDetailByCode("vividi01").then(d => console.log(d));
// fetchColorsAndCarousel("vividi01").then(c => console.log(c));
