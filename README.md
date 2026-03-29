# Autonomous Growth Agent

Automated system to find local business leads, generate demo websites and videos, and send personalized WhatsApp outreach.

## 🚀 Getting Started

1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables in `.env` (use `.env.example` as a template).
4. Run the agent:
   ```bash
   npx ts-node index.ts "Niche" "Location"
   ```

## 🛠️ Architecture

- `/agents`: Main orchestrator logic.
- `/skills`: Individual tools for scraping, AI analysis, site building, etc.
- `/templates`: HTML templates for demo websites.
- `/config`: Environment configuration.

## ⚙️ Tech Stack

- **Runtime**: Node.js
- **Automation**: Playwright
- **AI**: Gemini API
- **Media**: Cloudinary
- **Messaging**: Meta WhatsApp Cloud API
