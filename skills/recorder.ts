import * as path from 'path';
import { getGlobalContext } from './whatsapp_fast.js';

export async function recordDemoVideo(url: string): Promise<string> {
    console.log(`📽️ [SHARED-TAB] Recording video: ${url}`);
    const context = await getGlobalContext();
    const page = await context.newPage();
    const videoPath = path.resolve(`./demo_${Date.now()}.png`);

    try {
        await page.goto(`file://${path.resolve(url)}`, { waitUntil: 'domcontentloaded' });

        // Using STRING to bypass transpiler __name injection
        await page.evaluate(`(async () => {
            const delay = (ms) => new Promise(r => setTimeout(r, ms));
            for (let i = 0; i < 500; i += 20) {
                window.scrollTo(0, i);
                await delay(30);
            }
        })()`);

        await page.screenshot({ path: videoPath });
        return videoPath;
    } catch (err) {
        console.error("Recorder Tab Error:", err);
        throw err;
    } finally {
        await page.close();
    }
}
