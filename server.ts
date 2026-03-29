import express from 'express';
import { runGrowthAgent } from './agents/main_agent.js';
import * as dotenv from 'dotenv';
import cors from 'cors';
import { addClient, removeClient, sendProgress } from './progress.js';
import { initWhatsAppFast, getWhatsAppStatusFast } from './skills/whatsapp_fast.js';

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

// Initialize WhatsApp on startup
try {
    initWhatsAppFast().catch(e => console.error('Startup WA Init Background Error:', e));
} catch (e) {
    console.error('Immediate WA Init Error:', e);
}

app.get('/api/events', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const clientId = addClient(res);

    req.on('close', () => {
        removeClient(clientId);
    });
});

app.get('/api/whatsapp-status', (req, res) => {
    res.json(getWhatsAppStatusFast());
});

app.post('/api/whatsapp-logout', async (req, res) => {
    res.json({ message: 'Logout handled by restarting server in Fast mode.' });
});

app.post('/api/start-growth', async (req, res) => {
    const { niche, location } = req.body;
    if (!niche || !location) {
        return res.status(400).json({ error: 'Niche and location are required' });
    }

    res.json({ message: 'Growth agent started' });

    try {
        await runGrowthAgent(niche, location);
        sendProgress({ type: 'DONE', message: 'Growth Cycle Completed' });
    } catch (e: any) {
        sendProgress({ type: 'ERROR', message: e.message });
    }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
});
