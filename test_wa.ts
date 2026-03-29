import * as dotenv from 'dotenv';
import { initWhatsApp, sendPersonalWhatsApp, getWhatsAppStatus } from './skills/whatsapp_personal.js';
import * as path from 'path';
import * as fs from 'fs';

dotenv.config();

async function test() {
    console.log('--- WhatsApp Isolation Test ---');

    // 1. Initialize
    await initWhatsApp();

    // Wait for connection
    console.log('Checking connection status...');
    let status = getWhatsAppStatus();
    while (!status.isReady) {
        if (status.qrCodeData) {
            console.log('QR Code available! Please scan via the dashboard.');
        } else {
            console.log('Initializing/Synchronizing...');
        }
        await new Promise(r => setTimeout(r, 5000));
        status = getWhatsAppStatus();
    }

    console.log('✅ WhatsApp Ready!');

    const testPhone = "919013220721"; // User's number or a test number
    const testMessage = "Isolation Test: This is a test message from the Growth Agent.";

    // Create a dummy file if needed
    const testVideo = path.join(process.cwd(), 'test_dummy.txt');
    fs.writeFileSync(testVideo, 'This is a test file to verify media sending.');

    try {
        console.log(`Sending test message to ${testPhone}...`);
        await sendPersonalWhatsApp(testPhone, testMessage, testVideo);
        console.log('✅ TEST SUCCESSFUL!');
    } catch (e: any) {
        console.error('❌ TEST FAILED!');
        console.error(e.message);
    }

    process.exit(0);
}

test();
