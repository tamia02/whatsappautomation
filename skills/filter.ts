import { Business } from './scraper.js';

export function filterLeads(leads: Business[]): Business[] {
    return leads.filter(lead => {
        // Restored high-quality threshold
        const threshold = 200;
        if (lead.reviews < threshold) return false;

        // Website is missing
        if (!lead.website || lead.website.trim() === '') return true;

        // If website exists, we might want to check its "quality"
        // (e.g., if it's just a Facebook page, it counts as "missing")
        if (lead.website.includes('facebook.com') || lead.website.includes('instagram.com')) return true;

        return false;
    });
}
