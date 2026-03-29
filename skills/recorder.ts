import * as path from 'path';
import { getGlobalContext } from './whatsapp_fast.js';

/**
 * Records a demo video using a NEW TAB in the SHARED Global Browser.
 * This ensures only ONE window is ever open.
 */
export async function recordDemoVideo(url: string): Promise<string> {
    console.log(`📽️ [SHARED-TAB] Recording video for: ${url}`);

    const context = await getGlobalContext();
    const page = await context.newPage(); // Open a NEW TAB

    const videoPath = path.resolve(`./demo_${Date.now()}.png`); // Placeholder for video

    try {
        await page.goto(`file://${path.resolve(url)}`, { waitUntil: 'networkidle' });

        await page.evaluate(async () => {
            for (let i = 0; i < 500; i += 20) {
                window.scrollTo(0, i);
                await new Promise(r => setTimeout(r, 30));
            }
        });

        await page.screenshot({ path: videoPath });
        return videoPath;
    } catch (err) {
        console.error("Recorder Tab Error:", err);
        throw err;
    } finally {
        await page.close(); // CLOSE TAB, NOT BROWSER
    }
}
