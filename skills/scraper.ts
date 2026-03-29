import { sendProgress } from '../progress.js';
import { getGlobalContext, Business } from './whatsapp_fast.js';

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
      await page.evaluate(() => {
        const feed = document.querySelector('div[role="feed"]');
        if (feed) {
          feed.scrollTop = feed.scrollHeight;
          feed.scrollBy(0, 2000);
        } else {
          window.scrollBy(0, 1500);
        }
      });
      await new Promise(r => setTimeout(r, 2000));
    }

    const businesses: Business[] = [];
    const items = await page.$$('div[role="article"], a[href*="/maps/place/"], .Nv261d, .hfpxzc');
    console.log(`🕵️ Extraction phase for ${items.length} items.`);

    for (const item of items) {
      if (businesses.length >= 10) break;

      try {
        const name = await item.evaluate((el) => {
          const headline = el.querySelector('.fontHeadlineSmall, .qBF1Pd, .fontTitleLarge');
          return headline ? (headline as HTMLElement).innerText : el.getAttribute('aria-label') || '';
        }).catch(() => '');

        if (!name || name.length < 3) continue;

        const { stars, reviews } = await item.evaluate((el) => {
          const aria = (el.getAttribute('aria-label') || '').toLowerCase();
          const inner = (el as HTMLElement).innerText || '';
          const combined = (aria + " " + inner).toLowerCase();

          let s = 0;
          let r = 0;

          const starMatch = combined.match(/([\d.]+)\s*stars?/i) || combined.match(/rated\s*([\d.]+)/i) || combined.match(/^([\d.]+)/);
          if (starMatch) s = parseFloat(starMatch[1]);

          const revMatch = combined.match(/([\d,]+)\s*reviews/i) || combined.match(/\(([\d,]+)\)/) || combined.match(/by\s*([\d,]+)/i);
          if (revMatch) r = parseInt(revMatch[1].replace(/\D/g, ''));

          if (s === 0 || r === 0) {
            const stats = el.querySelector('.AJ7rdc, .MW4etd, .fontBodyMedium span[aria-label]');
            if (stats) {
              const txt = (stats as HTMLElement).innerText || stats.getAttribute('aria-label') || '';
              const parts = txt.split('(');
              if (s === 0) s = parseFloat(parts[0]) || 0;
              if (r === 0 && parts[1]) r = parseInt(parts[1].replace(/\D/g, '')) || 0;
            }
          }
          return { stars: s, reviews: r };
        }).catch(() => ({ stars: 0, reviews: 0 }));

        console.log(`🔍 [DEBUG] ${name}: ${stars}★, ${reviews} reviews`);

        if (stars < 4.0 || reviews < 200) {
          continue;
        }

        await item.click({ force: true });
        await new Promise(r => setTimeout(r, 4000));

        let phone = await page.evaluate(() => {
          const pBtn = document.querySelector('button[data-item-id^="phone:tel:"]');
          if (pBtn) return pBtn.getAttribute('data-item-id')?.replace('phone:tel:', '') || '';
          const main = document.querySelector('div[role="main"], [role="region"], .bJpY7e');
          if (!main) return '';
          const match = (main as HTMLElement).innerText.match(/(\+?\d{1,4}[-.\s]?)?(\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4,6}/);
          return match ? match[0] : '';
        });

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
