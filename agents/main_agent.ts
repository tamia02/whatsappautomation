import { scrapeGoogleMaps, Business } from '../skills/scraper.js';
import { filterLeads } from '../skills/filter.js';
import { analyzeReviews, generateWebsiteContent } from '../skills/gpt.js';
import { buildMultiPageWebsite } from '../skills/site_builder_v2.js';
import { recordDemoVideo } from '../skills/recorder.js';
import { uploadVideo } from '../skills/uploader.js';
import { sendWhatsAppFast } from '../skills/whatsapp_fast.js';
import { sendProgress } from '../progress.js';

export async function runGrowthAgent(niche: string, location: string) {
    sendProgress({ type: 'INFO', message: `🚀 Starting Growth Agent for ${niche} in ${location}...` });

    // 1. Discovery
    const rawLeads = await scrapeGoogleMaps(`${niche} in ${location}`);
    sendProgress({ type: 'INFO', message: `🔍 Found ${rawLeads.length} initial leads.`, rawLeads });
    console.log('Raw Leads:', JSON.stringify(rawLeads, null, 2));

    // 2. Qualification
    const qualifiedLeads = filterLeads(rawLeads);
    sendProgress({ type: 'INFO', message: `✅ ${qualifiedLeads.length} leads qualified.`, qualifiedLeads });

    console.log(`--- STARTING OUTREACH LOOP (${qualifiedLeads.length} leads) ---`);
    for (const lead of qualifiedLeads) {
        sendProgress({ type: 'INFO', message: `🔍 Processing ${lead.name}...` });
        console.log(`📍 Now processing: ${lead.name} (Phone: ${lead.phone || 'N/A'})`);

        if (!lead.phone && !process.env.DRY_RUN) {
            console.log(`⚠️ Skipping ${lead.name} - No phone number found.`);
            sendProgress({ type: 'INFO', message: `⚠️ Skipping ${lead.name} (No phone number)` });
            continue;
        }

        try {
            console.log(`🛠️ Processing: ${lead.name}`);

            // 3. Data Enrichment (Mocking reviews)
            const reviews: string[] = ["Great service", "Lovely staff", "Very professional"];
            let insights;
            if (process.env.GEMINI_API_KEY) {
                insights = await analyzeReviews(lead.name, reviews);
            } else {
                console.log(`[MOCK] Analyzing reviews for ${lead.name}`);
                insights = { services: ["Dental Cleaning", "Root Canal"], usps: ["Highly rated", "Family owned"], tone: "friendly" };
            }

            // 4. Website Generation
            let content;
            if (process.env.GEMINI_API_KEY) {
                content = await generateWebsiteContent(lead.name, niche, insights, lead.reviews);
            } else {
                sendProgress({ type: 'INFO', message: `[MOCK] Generating premium website content for ${lead.name}` });
                content = {
                    hero: { title: lead.name, subtitle: `The most trusted ${niche} experts in ${location}.` },
                    services: [
                        { title: 'Premium Consultation', description: 'Expert analysis and personalized care plans tailored for you.', image: '' },
                        { title: 'Advanced Treatment', description: 'State-of-the-art facilities and experienced professionals.', image: '' },
                        { title: 'Emergency Care', description: 'Available when you need us most with 24/7 support.', image: '' }
                    ],
                    about: {
                        title: `About ${lead.name}`,
                        text: `${lead.name} has been a cornerstone of the ${location} community, providing world-class ${niche} services with a commitment to excellence and a track record of ${lead.reviews} satisfied customers.`
                    },
                    testimonials: [{ name: "Reviewer", quote: "Highly recommended for their professional approach!" }],
                    cta: { text: "Schedule Your Visit" }
                };
            }

            // 5. Build Website (Premium Multi-page)
            console.log(`🛠️ Building Site for ${lead.name}...`);
            const safeName = lead.name.replace(/[^a-zA-Z0-9]/g, "_");
            const htmlPath = buildMultiPageWebsite(safeName, content);
            console.log(`✅ Site built for ${lead.name}`);
            sendProgress({ type: 'INFO', message: `🌍 Premium Multi-page site built for ${lead.name}`, lead: { ...lead, status: 'Built' } });

            // 6. Record Demo
            console.log(`📹 Starting video capture for ${lead.name}...`);
            const videoPath = await recordDemoVideo(htmlPath);
            console.log(`✅ Video captured for ${lead.name}`);
            await new Promise(r => setTimeout(r, 2000)); // Let the file settle
            sendProgress({ type: 'INFO', message: `📽️ Video recorded for ${lead.name}`, lead: { ...lead, status: 'Recorded' } });

            // 7. Upload (Optional, for demo link)
            let videoUrl = "";
            if (process.env.CLOUDINARY_API_KEY) {
                console.log(`☁️ Uploading to Cloudinary...`);
                videoUrl = await uploadVideo(videoPath);
                console.log(`✅ Uploaded: ${videoUrl}`);
            }

            // 8. Outreach
            const message = `Hi ${lead.name}! I made a demo for you. I saw your website and I saw you don't have a website, so I made something like that. Check the video walkthrough here:`;

            if (process.env.USE_PERSONAL_WA === 'true' || true) {
                console.log(`⏳ [SINGLE-WINDOW] Preparing WhatsApp for ${lead.name}...`);
                await new Promise(r => setTimeout(r, 3000));
                await sendWhatsAppFast(lead.phone || "0000000000", videoPath, message);
                console.log(`✅ Message Sent to ${lead.name}`);
                sendProgress({ type: 'SUCCESS', message: `🚀 Pitch Sent: ${lead.name}`, lead: { ...lead, status: 'Sent', videoUrl } });
            }

        } catch (e: any) {
            console.error(`Error processing lead ${lead.name}:`, e);
            sendProgress({ type: 'ERROR', message: `❌ Failed: ${lead.name} (${e.message})`, error: e.message, lead: { ...lead, status: 'Error' } });
        }
    }
}
