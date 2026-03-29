import { sendProgress } from '../progress.js';
import { getGlobalContext, Business } from './whatsapp_fast.js';

export { Business };

/**
 * Scrapes Google Maps using a SHARED Global Browser window.
 */
export async function scrapeGoogleMaps(query: string): Promise<Business[]> {
  console.log(`🔍 [SINGLE-WINDOW] Discovery: ${query}`);

  const context = await getGlobalContext();
  const page = await context.newPage();

  try {
    await page.goto(`https://www.google.com/maps/search/${encodeURIComponent(query)}`, {
      waitUntil: 'domcontentloaded',
      timeout: 45000
    });

    await page.waitForSelector('div[role="feed"], .m67qEc, [role="article"]', { timeout: 15000 }).catch(() => { });

    console.log("📜 [SINGLE-WINDOW] Deep-Scrolling for 200+ review clinics...");
    sendProgress({ type: 'INFO', message: `🔍 Deep-Discovery for "${query}" (Target: 200+ Reviews)...` });

    for (let i = 0; i < 8; i++) {
      await page.evaluate('(() => { ' +
        'const f = document.querySelector(\'div[role="feed"]\'); ' +
        'if (f) { f.scrollTop = f.scrollHeight; f.scrollBy(0, 2000); } ' +
        'else { window.scrollBy(0, 1500); } ' +
        '})()');
      await new Promise(r => setTimeout(r, 2000));
    }

    const businesses: Business[] = [];
    const items = await page.$$('div[role="article"], a[href*="/maps/place/"], .Nv261d, .hfpxzc');
    console.log(`🕵️ Extraction phase for ${items.length} items.`);

    for (const item of items) {
      if (businesses.length >= 10) break;

      try {
        const name = await item.evaluate('el => { ' +
          'const h = el.querySelector(".fontHeadlineSmall, .qBF1Pd, .fontTitleLarge"); ' +
          'return h ? h.innerText : el.getAttribute("aria-label") || ""; ' +
          '}').catch(() => '');

        if (!name || name.length < 3) continue;

        const stats = await item.evaluate('el => { ' +
          'const aria = (el.getAttribute("aria-label") || "").toLowerCase(); ' +
          'const inner = el.innerText || ""; ' +
          'const combined = (aria + " " + inner).toLowerCase(); ' +
          'let s = 0; let r = 0; ' +
          'const sM = combined.match(/([\\d.]+)\\s*stars?/i) || combined.match(/rated\\s*([\\d.]+)/i) || combined.match(/^([\\d.]+)/); ' +
          'if (sM) s = parseFloat(sM[1]); ' +
          'const rM = combined.match(/([\\d,]+)\\s*reviews/i) || combined.match(/\\(([\\d,]+)\\)/) || combined.match(/by\\s*([\\d,]+)/i); ' +
          'if (rM) r = parseInt(rM[1].replace(/\\D/g, "")); ' +
          'return { stars: s, reviews: r }; ' +
          '}').catch(() => ({ stars: 0, reviews: 0 }));

        const { stars, reviews } = stats;
        console.log(`🔍 [DEBUG] ${name}: ${stars}★, ${reviews} reviews`);

        if (stars < 4.0 || reviews < 200) continue;

        await item.click({ force: true });
        await new Promise(r => setTimeout(r, 4000));

        const phone = await page.evaluate('(() => { ' +
          'const p = document.querySelector(\'button[data-item-id^="phone:tel:"]\'); ' +
          'if (p) return p.getAttribute("data-item-id").replace("phone:tel:", ""); ' +
          'const m = document.querySelector(\'div[role="main"], [role="region"], .bJpY7e\'); ' +
          'if (!m) return ""; ' +
          'const match = m.innerText.match(/(\\+?\\d{1,4}[-.\\s]?)?(\\(?\\d{3}\\)?[-.\\s]?)?\\d{3}[-.\\s]?\\d{4,6}/); ' +
          'return match ? match[0] : ""; ' +
          '})()');

        businesses.push({ name, phone, reviews, stars, website: null });
        sendProgress({ type: 'INFO', message: `✅ Qualified: ${name} (${reviews} reviews)` });
      } catch (e) {
        continue;
      }
    }

    return businesses;
  } catch (err: any) {
    console.error("❌ Discovery Failed:", err);
    return [];
  } finally {
    await page.close();
  }
}
