/**
 * ================================
 * AiFang Kids Frontend API
 * api.js（對接 GAS 商用版）
 * ================================
 */

const API_BASE_URL = "你的 GAS Web App URL"; 
// 例：https://script.google.com/macros/s/AKfycbxnlAwKJucHmCKcJwv67TWuKV0X74Daag9X9I4NG7DOESREuYdU7BtWBPcEHyoJphoEfg/exec

/**
 * 取得所有商品（前台）
 */
export async function fetchProducts() {
  const url = `${API_BASE_URL}?mode=products`;

  const res = await fetch(url);
  if (!res.ok) throw new Error("API 連線失敗");

  const data = await res.json();
  return data.products || [];
}

/**
 * ================================
 * 商品卡專用：計算顯示價格
 * 規則：
 * 1. 優先顯示 sale 價
 * 2. 沒有 sale → 顯示正常價
 * 3. 多尺寸 → 取最低價
 * ================================
 */
export function getDisplayPrice(product) {
  const priceFields = [
    product.price_baby_sale || product.price_baby,
    product.price_kid_sale || product.price_kid,
    product.price_junior_sale || product.price_junior,
    product.price_adult_sale || product.price_adult
  ].filter(p => p && p > 0);

  if (priceFields.length === 0) return 0;
  return Math.min(...priceFields);
}

/**
 * ================================
 * 商品卡狀態標籤
 * ================================
 */
export function getProductBadge(product) {
  if (product.status) return product.status.toUpperCase();
  if (product.is_new) return "NEW";
  return "";
}

/**
 * ================================
 * 色票處理
 * ================================
 */
export function getColorCodes(product) {
  if (!product.color_code) return [];
  return product.color_code
    .split(",")
    .map(c => c.trim())
    .filter(c => c.startsWith("#"));
}
