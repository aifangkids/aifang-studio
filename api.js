/**
 * ================================
 * AiFang Kids Frontend API
 * api.js（ES Module）
 * ================================
 */

const API_BASE_URL =
  "https://script.google.com/macros/s/AKfycbxnlAwKJucHmCKcJwv67TWuKV0X74Daag9X9I4NG7DOESREuYdU7BtWBPcEHyoJphoEfg/exec";

/**
 * 前台：取得商品資料
 */
export async function fetchProducts() {
  const res = await fetch(`${API_BASE_URL}?mode=products`);
  if (!res.ok) throw new Error("API 連線失敗");

  const json = await res.json();
  return Array.isArray(json.products) ? json.products : [];
}
