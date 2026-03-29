import pkg from 'whatsapp-web.js';
const { Client, LocalAuth, MessageMedia } = pkg;
import qrcode from 'qrcode';
import { sendProgress } from '../progress.js';

let client: any = null;
let qrCodeData: string | null = null;
let isReady = false;
let isAuthenticated = false;
let status = 'IDLE'; // IDLE, INITIALIZING, QR, AUTHENTICATED, READY, DISCONNECTED

export async function initWhatsApp() {
    if (client) return;

    status = 'INITIALIZING';
    sendProgress({ type: 'WA_STATUS', status: 'INITIALIZING', message: 'Starting secure browser...' });

    client = new Client({
        authStrategy: new LocalAuth(),
        authTimeoutMs: 60000,
        puppeteer: {
            headless: true,
            executablePath: 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--disable-gpu',
                '--hide-scrollbars',
                '--mute-audio',
                '--disable-session-crashed-bubble',
                '--disable-infobars',
                '--disable-extensions',
                '--disable-notifications',
                '--disable-dev-shm-usage',
                '--no-first-run',
                '--no-default-browser-check',
                '--password-store=basic'
            ],
        }
    });

    client.on('qr', async (qr: string) => {
        status = 'QR';
        qrCodeData = await qrcode.toDataURL(qr);
        sendProgress({ type: 'WA_QR', qr: qrCodeData });
        console.log('WhatsApp QR Code generated');
    });

    client.on('ready', () => {
        isReady = true;
        isAuthenticated = true;
        status = 'READY';
        qrCodeData = null;
        sendProgress({ type: 'WA_READY', message: 'WhatsApp is connected!' });
        console.log('WhatsApp client is ready!');
    });

    client.on('authenticated', () => {
        isAuthenticated = true;
        status = 'AUTHENTICATED';
        sendProgress({ type: 'WA_STATUS', status: 'AUTHENTICATED', message: 'Session found - Logging in...' });
        console.log('WhatsApp authenticated');
    });

    client.on('auth_failure', (msg: string) => {
        isAuthenticated = false;
        status = 'ERROR';
        console.error('WhatsApp auth failure', msg);
        sendProgress({ type: 'WA_ERROR', message: 'Auth failure: ' + msg });
    });

    client.on('disconnected', async (reason: string) => {
        console.log('WhatsApp disconnected:', reason);
        isReady = false;
        isAuthenticated = false;
        status = 'IDLE';
        qrCodeData = null;
        sendProgress({ type: 'WA_DISCONNECTED', message: 'WhatsApp disconnected' });
    });

    try {
        await client.initialize();
    } catch (e: any) {
        console.error('WhatsApp Initialization Failed:', e);
        status = 'ERROR';
        client = null;
    }
}

export async function logoutWhatsApp() {
    if (client) {
        try {
            await client.logout();
            await client.destroy();
            client = null;
            isReady = false;
            qrCodeData = null;
            status = 'DISCONNECTED';
            console.log('WhatsApp logged out and destroyed');
        } catch (e) {
            console.error('Logout error:', e);
            client = null;
        }
    }
}

export async function sendPersonalWhatsApp(to: string, message: string, videoPath?: string) {
    if (!isReady) {
        throw new Error('WhatsApp is not connected. Please scan the QR code on the dashboard.');
    }

    if (!to || to.length < 5) {
        throw new Error(`Invalid phone number: "${to}"`);
    }

    // Ensure 91 prefix if it looks like a 10-digit Indian number
    let cleanNumber = to.replace(/\D/g, '');
    if (cleanNumber.length === 10) {
        cleanNumber = '91' + cleanNumber;
    }

    const chatId = `${cleanNumber}@c.us`;

    console.log(`Attempting to send WhatsApp message to: ${chatId}`);

    if (!client || !client.info) {
        console.log('⚠️ Client not ready or info missing, re-initializing...');
        await initWhatsApp();
        // Wait up to 30s for ready
        let waitCount = 0;
        while (!isReady && waitCount < 6) {
            await new Promise(r => setTimeout(r, 5000));
            waitCount++;
        }
    }

    const sendWithRetry = async (retryCount = 0): Promise<void> => {
        try {
            if (videoPath) {
                console.log(`Sending media message with local path: ${videoPath}`);
                const media = MessageMedia.fromFilePath(videoPath);
                await client.sendMessage(chatId, media, { caption: message });
            } else {
                await client.sendMessage(chatId, message);
            }
        } catch (err: any) {
            const isFrameError = String(err).includes('detached Frame') || String(err).includes('Target closed');
            if (isFrameError && retryCount < 1) {
                console.warn('⚠️ Detached frame/Target closed detected. Re-initializing and retrying once...');
                await logoutWhatsApp();
                await initWhatsApp();
                // Wait for ready
                let waitCount = 0;
                while (!isReady && waitCount < 12) {
                    await new Promise(r => setTimeout(r, 5000));
                    waitCount++;
                }
                if (isReady) return sendWithRetry(retryCount + 1);
            }
            throw err; // Re-throw if not recoverable or retries exhausted
        }
    };

    try {
        await sendWithRetry();
        console.log(`Message successfully sent to ${chatId}`);
    } catch (err: any) {
        console.error(`WhatsApp Send Failure for ${chatId}:`, err);
        // Extreme stringification for the cryptic 't' error
        let errMsg = "Unknown Error";
        try {
            if (err instanceof Error) {
                errMsg = `${err.name}: ${err.message}\nStack: ${err.stack}`;
            } else if (typeof err === 'object') {
                errMsg = JSON.stringify(err, Object.getOwnPropertyNames(err));
            } else {
                errMsg = String(err);
            }
        } catch (stringErr) {
            errMsg = "Unstringifiable Error";
        }

        throw new Error(`WhatsApp API Error: ${errMsg}`);
    }
}

export function getWhatsAppStatus() {
    return { isReady, isAuthenticated, qrCodeData, status };
}
