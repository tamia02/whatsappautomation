import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function analyzeReviews(businessName: string, reviews: string[]): Promise<any> {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const prompt = `Analyze these reviews for ${businessName} and extract:
  1. Key services offered
  2. Unique selling points (USPs)
  3. Tone (e.g., premium, affordable, family-friendly)

  Reviews:
  ${reviews.join('\n\n')}

  Return the result as a JSON object with keys: services (array), usps (array), tone (string).`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    try {
        return JSON.parse(text.replace(/```json|```/g, ''));
    } catch (e) {
        console.error('Failed to parse Gemini response:', text);
        return { services: [], usps: [], tone: 'professional' };
    }
}

import * as fs from 'fs';
import * as path from 'path';

export async function generateWebsiteContent(businessName: string, niche: string, insights: any, reviewsCount: number): Promise<any> {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const promptPath = path.join(process.cwd(), 'prompts', 'website_content.prompt');
    let promptTemplate = fs.readFileSync(promptPath, 'utf-8');

    const prompt = promptTemplate
        .replace(/{{NICHE}}/g, niche)
        .replace(/{{BUSINESS_NAME}}/g, businessName)
        .replace(/{{REVIEWS}}/g, reviewsCount.toString())
        .replace(/{{INSIGHTS}}/g, JSON.stringify(insights, null, 2));

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    try {
        return JSON.parse(text.replace(/```json|```/g, ''));
    } catch (e) {
        console.error('Failed to parse Gemini response for website content:', text);
        return {
            hero: { title: businessName, subtitle: `Premium ${niche} services` },
            services: insights.services.map((s: string) => ({ title: s, description: '', image: '' })),
            about: { title: 'Our Story', text: `Providing top-tier ${niche} services to our community.` },
            testimonials: [],
            cta: { text: 'Contact Us' }
        };
    }
}
