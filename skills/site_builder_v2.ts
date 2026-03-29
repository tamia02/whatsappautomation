import * as fs from 'fs';
import * as path from 'path';

export interface SiteContent {
    hero: { title: string; subtitle: string };
    services: Array<{ title: string; description: string; image: string }>;
    about: { title: string; text: string };
    testimonials: Array<{ name: string; quote: string }>;
    cta: { text: string };
}

export function buildMultiPageWebsite(businessName: string, content: SiteContent): string {
    const safeName = businessName.replace(/[^a-zA-Z0-9]/g, "_");
    const baseDir = path.join(process.cwd(), 'dist', safeName);
    if (!fs.existsSync(baseDir)) {
        fs.mkdirSync(baseDir, { recursive: true });
    }

    const css = `
        :root {
            --primary: #2563eb;
            --secondary: #64748b;
            --accent: #f59e0b;
            --bg: #ffffff;
            --text: #1e293b;
            --card-bg: rgba(255, 255, 255, 0.8);
        }

        body {
            font-family: 'Inter', sans-serif;
            margin: 0;
            color: var(--text);
            line-height: 1.6;
        }

        nav {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 20px 5%;
            background: rgba(255, 255, 255, 0.9);
            backdrop-filter: blur(10px);
            position: sticky;
            top: 0;
            z-index: 1000;
            box-shadow: 0 2px 10px rgba(0,0,0,0.05);
        }

        nav .logo { font-size: 1.5rem; font-weight: 800; color: var(--primary); }
        nav ul { display: flex; list-style: none; gap: 30px; margin: 0; }
        nav a { text-decoration: none; color: var(--text); font-weight: 500; transition: color 0.3s; }
        nav a:hover { color: var(--primary); }

        .hero {
            padding: 100px 5%;
            background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
            text-align: center;
        }

        .hero h1 { font-size: 3.5rem; margin-bottom: 20px; color: #1e3a8a; }
        .hero p { font-size: 1.25rem; color: var(--secondary); max-width: 700px; margin: 0 auto 30px; }

        section { padding: 80px 5%; }
        h2 { font-size: 2.5rem; text-align: center; margin-bottom: 50px; }

        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 30px; }
        .card {
            background: var(--card-bg);
            padding: 30px;
            border-radius: 20px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.05);
            transition: transform 0.3s;
            border: 1px solid rgba(0,0,0,0.05);
        }
        .card:hover { transform: translateY(-10px); }

        footer { background: #1e293b; color: #fff; padding: 50px 5%; text-align: center; }
        
        .btn {
            display: inline-block;
            padding: 12px 30px;
            background: var(--primary);
            color: #fff;
            text-decoration: none;
            border-radius: 50px;
            font-weight: 600;
            transition: background 0.3s;
        }
        .btn:hover { background: #1d4ed8; }
    `;

    const pages = [
        { name: 'index.html', title: 'Home' },
        { name: 'services.html', title: 'Services' },
        { name: 'about.html', title: 'About Us' },
        { name: 'contact.html', title: 'Contact' }
    ];

    const generateLayout = (title: string, body: string) => `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${businessName} - ${title}</title>
            <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap">
            <style>${css}</style>
        </head>
        <body>
            <nav>
                <div class="logo">${businessName}</div>
                <ul>
                    ${pages.map(p => `<li><a href="${p.name}">${p.title}</a></li>`).join('')}
                </ul>
            </nav>
            ${body}
            <footer>
                <p>&copy; 2024 ${businessName}. All rights reserved.</p>
            </footer>
        </body>
        </html>
    `;

    // 1. Home Page
    const homeHtml = generateLayout('Home', `
        <div class="hero">
            <h1>${content.hero.title}</h1>
            <p>${content.hero.subtitle}</p>
            <a href="services.html" class="btn">${content.cta.text}</a>
        </div>
        <section>
            <h2>Why Choose Us</h2>
            <div class="grid">
                <div class="card">
                    <h3>High Reputation</h3>
                    <p>Over 200 positive reviews on Google Maps with a 4.4+ star rating.</p>
                </div>
                <div class="card">
                    <h3>Proven Expertize</h3>
                    <p>Dedicated to providing the best ${content.hero.subtitle} in the area.</p>
                </div>
                <div class="card">
                    <h3>Customer First</h3>
                    <p>We prioritize your health and satisfaction above all else.</p>
                </div>
            </div>
        </section>
    `);

    // 2. Services Page
    const servicesHtml = generateLayout('Services', `
        <section>
            <h2>Our Specialized Services</h2>
            <div class="grid">
                ${content.services.map(s => `
                    <div class="card">
                        <h3>${s.title}</h3>
                        <p>${s.description}</p>
                    </div>
                `).join('')}
            </div>
        </section>
    `);

    // 3. About Page
    const aboutHtml = generateLayout('About', `
        <section style="max-width: 800px; margin: 0 auto; text-align: center;">
            <h2>${content.about.title}</h2>
            <p>${content.about.text}</p>
        </section>
    `);

    // 4. Contact Page
    const contactHtml = generateLayout('Contact', `
        <section style="max-width: 600px; margin: 0 auto;">
            <h2>Get in Touch</h2>
            <div class="card">
                <p><strong>Phone:</strong> +91 99999 99999</p>
                <p><strong>Location:</strong> Noida, Sector 62</p>
                <p>Ready to experience premium care? Visit us today.</p>
            </div>
        </section>
    `);

    fs.writeFileSync(path.join(baseDir, 'index.html'), homeHtml);
    fs.writeFileSync(path.join(baseDir, 'services.html'), servicesHtml);
    fs.writeFileSync(path.join(baseDir, 'about.html'), aboutHtml);
    fs.writeFileSync(path.join(baseDir, 'contact.html'), contactHtml);

    return path.join(baseDir, 'index.html');
}
