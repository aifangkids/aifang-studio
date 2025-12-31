/**
 * index.js
 * AiFang Kids Studio - 商品列表正式版
 * -----------------------------------
 * - 只負責「顯示邏輯」
 * - 價格引擎 getDisplayPrice()
 * - status = ACTIVE 才顯示
 */

import { fetchProducts } from "./api.js";

/* ===============================
   初始化
================================ */
document.addEventListener("DOMContentLoaded", init);

async function init() {
  try {
    const products = await fetchProducts();
    const activeProducts = products.filter(p => p.status === "ACTIVE");
    renderProductList(activeProducts);
  } catch (err) {
    console.error("商品載入失敗", err);
  }
}

/* ===============================
   商品列表渲染
================================ */
function renderProductList(products) {
  const container = document.getElementById("product-list");
  if (!container) return;

  container.innerHTML = "";

  products.forEach(product => {
    const card = createProductCard(product);
    container.appendChild(card);
  });
}

/* ===============================
   商品卡
================================ */
function createProductCard(p) {
  const card = document.createElement("article");
  card.className = "product-card";

  /* NEW 標籤 */
  if (p.is_new === true || p.is_new === "TRUE") {
    const tag = document.createElement("div");
    tag.className = "tag-new";
    tag.textContent = "NEW";
    card.appendChild(tag);
  }

  /* 商品圖 */
  const img = document.createElement("img");
  img.className = "product-image";
  img.src = p.image_main;
  img.alt = p.name;

  /* hover 圖（桌機才用） */
  if (p.image_hover) {
    img.addEventListener("mouseenter", () => {
      img.src = p.image_hover;
    });
    img.addEventListener("mouseleave", () => {
      img.src = p.image_main;
    });
  }

  /* 資訊區 */
  const info = document.createElement("div");
  info.className = "product-info";

  const brand = document.createElement("div");
  brand.className = "product-brand";
  brand.textContent = p.brand || "";

  const name = document.createElement("div");
  name.className = "product-name";
  name.textContent = p.name;

  const price = document.createElement("div");
  price.className = "price";
  price.innerHTML = getDisplayPrice(p);

  info.appendChild(brand);
  info.appendChild(name);
  info.appendChild(price);

  card.appendChild(img);
  card.appendChild(info);

  return card;
}

/* ===============================
   價格引擎（最關鍵）
   顯示規則：
   - 有 10off → 顯示刪除線原價 + 特價
   - 沒有 → 顯示原價
   - 尺寸顯示順序：baby → kid → junior → adult
================================ */
function getDisplayPrice(p) {
  const currency = p.currency || "NT$";

  const sizePriority = [
    { size: "baby", price: "price_baby", sale: "price_baby_10off" },
    { size: "kid", price: "price_kid", sale: "price_kid_10off" },
    { size: "junior", price: "price_junior", sale: "price_junior_10off" },
    { size: "adult", price: "price_adult", sale: "price_adult_10off" }
  ];

  for (const s of sizePriority) {
    const original = Number(p[s.price]);
    const sale = Number(p[s.sale]);

    if (!isNaN(original) && original > 0) {
      if (!isNaN(sale) && sale > 0 && sale < original) {
        return `
          <span class="price-original">${currency} ${original}</span>
          <span class="price-sale">${currency} ${sale}</span>
        `;
      } else {
        return `<span>${currency} ${original}</span>`;
      }
    }
  }

  return `<span>—</span>`;
}
