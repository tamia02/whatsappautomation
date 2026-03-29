import * as fs from 'fs';
import * as path from 'path';

export function buildWebsite(businessName: string, content: any): string {
    const templatePath = path.join(process.cwd(), 'templates', 'index.html');
    const outputPath = path.join(process.cwd(), 'dist', businessName.replace(/\s+/g, '_'), 'index.html');

    if (!fs.existsSync(path.dirname(outputPath))) {
        fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    }

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${businessName} - Demo</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background: #f4f7f6; color: #333; }
        header { background: #2c3e50; color: #fff; padding: 60px 20px; text-align: center; }
        header h1 { margin: 0; font-size: 3rem; }
        header p { font-size: 1.2rem; margin-top: 10px; }
        section { padding: 40px 20px; max-width: 1000px; margin: auto; }
        h2 { border-bottom: 2px solid #2c3e50; padding-bottom: 10px; margin-bottom: 20px; }
        .services { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; }
        .service-card { background: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .service-card h3 { margin-top: 0; color: #2980b9; }
        .testimonials { background: #ecf0f1; padding: 40px 20px; text-align: center; }
        .testimonial-card { font-style: italic; margin-bottom: 20px; }
        .cta { text-align: center; background: #2c3e50; color: #fff; padding: 40px 20px; }
        .cta button { background: #e74c3c; color: #fff; border: none; padding: 15px 30px; font-size: 1.2rem; border-radius: 5px; cursor: pointer; }
    </style>
</head>
<body>
    <header>
        <h1>${content.hero.title}</h1>
        <p>${content.hero.subtitle}</p>
    </header>

    <section>
        <h2>Our Services</h2>
        <div class="services">
            ${content.services.map((s: any) => `
                <div class="service-card">
                    <h3>${s.title}</h3>
                    <p>${s.description}</p>
                </div>
            `).join('')}
        </div>
    </section>

    <div class="testimonials">
        <h2>What Our Clients Say</h2>
        ${content.testimonials.map((t: any) => `
            <div class="testimonial-card">
                <p>"${t.quote}"</p>
                <strong>- ${t.name}</strong>
            </div>
        `).join('')}
    </div>

    <div class="cta">
        <button>${content.cta.text}</button>
    </div>
</body>
</html>
  `;

    fs.writeFileSync(outputPath, html);
    return outputPath;
}
