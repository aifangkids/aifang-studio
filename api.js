const API_URL =
  "https://script.google.com/macros/s/AKfycbxnlAwKJucHmCKcJwv67TWuKV0X74Daag9X9I4NG7DOESREuYdU7BtWBPcEHyoJphoEfg/exec";

export async function fetchProducts() {
  const res = await fetch(`${API_URL}?mode=products`);
  const json = await res.json();
  return json.products || [];
}
