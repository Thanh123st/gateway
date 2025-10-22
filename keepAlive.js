import fetch from "node-fetch";

/**
 * Gửi request keep-alive định kỳ cho các API được chỉ định.
 * @param {Object} targets - Danh sách các API cần ping.
 * @param {number} interval - Thời gian lặp lại (ms).
 */
export function startKeepAlive(targets, interval = 1000 * 60 * 5) {
  console.log("🚀 Keep-alive service started");

  setInterval(async () => {
    for (const [name, url] of Object.entries(targets)) {
      try {
        const res = await fetch(url);
        if (res.ok) {
          console.log(`✅ [${name}] Alive (${res.status})`);
        } else {
          console.warn(`⚠️ [${name}] Responded with status ${res.status}`);
        }
      } catch (err) {
        console.error(`❌ [${name}] Ping failed:`, err.message);
      }
    }
    console.log("🔁 Keep-alive round completed\n");
  }, interval);
}