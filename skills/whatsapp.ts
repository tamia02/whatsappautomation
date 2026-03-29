import axios from 'axios';
import * as dotenv from 'dotenv';

dotenv.config();

export async function sendWhatsApp(phone: string, message: string, mediaUrl?: string) {
    const accessToken = process.env.META_ACCESS_TOKEN;
    const phoneNumberId = process.env.META_PHONE_NUMBER_ID;

    // Clean phone number (remove non-digits, ensure international format)
    const cleanPhone = phone.replace(/\D/g, '');

    const url = `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`;

    const data: any = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: cleanPhone,
        type: "text",
        text: { body: message }
    };

    if (mediaUrl) {
        // Meta Cloud API supports sending media as well, but it might need to be a template message
        // For simplicity, let's just include the link in the message if it's not a template
        data.text.body = `${message}\n\nDemo: ${mediaUrl}`;
    }

    try {
        const response = await axios.post(url, data, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });
        return response.data;
    } catch (e: any) {
        console.error("WhatsApp message failed", e.response?.data || e.message);
        return null;
    }
}
