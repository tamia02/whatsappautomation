import { chromium, BrowserContext, Page } from 'playwright';
import * as path from 'path';
import * as fs from 'fs';
import { sendProgress } from '../progress.js';

// Centralized Interface for Leads
export interface Business {
    name: string;
    phone: string;
    reviews: number;
    stars: number;
    website: string | null;
}

let context: BrowserContext | null = null;
let page: Page | null = null;
let isInitializing = false;

const SESSION_DIR = path.resolve('./.playwright_session_pro');

export async function getGlobalContext(): Promise<BrowserContext> {
    if (!context) {
        await initWhatsAppFast();
    }
    if (!context) throw new Error("Could not initialize global browser context.");
    return context;
}

export async function initWhatsAppFast() {
    if (isInitializing) return;
    if (context) {
        try {
            context.pages();
            return;
        } catch (e) {
            context = null;
            page = null;
        }
    }

    isInitializing = true;
    if (!fs.existsSync(SESSION_DIR)) {
        fs.mkdirSync(SESSION_DIR, { recursive: true });
    }

    sendProgress({ type: 'WA_STATUS', status: 'INITIALIZING', message: 'Reclaiming Persistent Session...' });

    try {
        console.log('🚀 [SINGLE-WINDOW] Syncing Global Browser...');
        context = await chromium.launchPersistentContext(SESSION_DIR, {
            headless: false,
            executablePath: 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-extensions',
                '--disable-dev-shm-usage',
                '--start-maximized'
            ],
            viewport: null // Follow OS window size
        });

        context.on('close', () => {
            context = null;
            page = null;
        });

        const pages = context.pages();
        page = pages.length > 0 ? pages[0] : await context.newPage();

        console.log("🔗 Navigating to WhatsApp Web...");
        await page.goto("https://web.whatsapp.com", { waitUntil: 'domcontentloaded', timeout: 60000 });

        checkReadyState();

    } catch (err: any) {
        console.error('CRITICAL: Single-Window Launch Failed:', err);
        throw err;
    } finally {
        isInitializing = false;
    }
}

async function checkReadyState() {
    if (!page) return;
    try {
        await page.waitForSelector('div[contenteditable="true"]', { timeout: 30000 });
        sendProgress({ type: 'WA_READY', message: 'WhatsApp is READY.' });
        console.log("✅ [SINGLE-WINDOW] WhatsApp is READY.");
    } catch (e) {
        console.log("Waiting for QR/Auth...");
        sendProgress({ type: 'WA_STATUS', status: 'QR', message: 'Login required. Scan QR in the single open Chrome window.' });
    }
}

async function ensurePage(): Promise<Page> {
    const activeContext = await getGlobalContext();
    if (!page || page.isClosed()) {
        const pages = activeContext.pages();
        page = pages.length > 0 ? pages[0] : await activeContext.newPage();
    }
    return page;
}

export async function sendWhatsAppFast(phone: string, videoPath: string, message: string) {
    const activePage = await ensurePage();

    let cleanNumber = phone.replace(/\D/g, '');
    if (cleanNumber.startsWith('0')) {
        cleanNumber = '91' + cleanNumber.substring(1);
    } else if (cleanNumber.length === 10) {
        cleanNumber = '91' + cleanNumber;
    }

    console.log(`🚀 [SINGLE-WINDOW] Messaging ${cleanNumber}...`);

    try {
        await activePage.goto(`https://web.whatsapp.com/send?phone=${cleanNumber}`, { waitUntil: 'domcontentloaded', timeout: 60000 });

        let state = 'WAITING';
        const start = Date.now();
        const timeout = 60000;

        while (state === 'WAITING' && (Date.now() - start < timeout)) {
            const hasInput = await activePage.$("footer div[contenteditable='true']");
            if (hasInput) { state = 'READY'; break; }

            const invalid = await activePage.evaluate(() => {
                const text = document.body.innerText;
                return text.includes("invalid") || text.includes("shared via url");
            });
            if (invalid) { state = 'INVALID'; break; }

            await new Promise(r => setTimeout(r, 2000));
        }

        if (state === 'INVALID') throw new Error("Invalid WhatsApp number");
        if (state === 'WAITING') throw new Error("WhatsApp UI load timeout");

        if (videoPath) {
            const attachBtn = "span[data-icon='plus'], span[data-icon='clip'], div[role='button'][title='Attach']";
            await activePage.waitForSelector(attachBtn, { timeout: 15000 });
            await activePage.click(attachBtn);

            const fileInput = activePage.locator('input[type="file"]');
            await fileInput.setInputFiles(path.resolve(videoPath));

            await activePage.waitForSelector("div[role='button'] span[data-icon='send']", { timeout: 120000 });
            await activePage.locator("footer div[contenteditable='true'], div[role='textbox']").first().fill(message);
            await activePage.click("div[role='button']:has(span[data-icon='send'])");
        } else {
            await activePage.locator("footer div[contenteditable='true']").last().fill(message);
            await activePage.keyboard.press('Enter');
        }

        await new Promise(r => setTimeout(r, 8000));
        console.log(`✅ [SINGLE-WINDOW] Outreach Success: ${cleanNumber}`);
        return true;
    } catch (err: any) {
        console.error(`❌ [SINGLE-WINDOW] Outreach Error:`, err);
        throw err;
    }
}

export function getWhatsAppStatusFast() {
    return { isReady: !!page && !page.isClosed(), status: (page && !page.isClosed()) ? 'READY' : 'INITIALIZING' };
}
