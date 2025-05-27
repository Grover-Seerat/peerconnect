const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
const handlebars = require('handlebars');

const app = express();
const PORT = 3000;

// Middleware to parse JSON bodies and serve static files
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Resume PDF generation route
app.post('/generate', async (req, res) => {
  try {
    const data = req.body;
    const templateName = data.template; // Should be 'clean-minimal' or 'creative-designer'
    const templatePath = path.join(__dirname, 'templates', `${templateName}.html`);

    if (!fs.existsSync(templatePath)) {
      return res.status(400).send('Selected template does not exist.');
    }

    // Read and compile the template
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    const compiledTemplate = handlebars.compile(templateContent);
    const html = compiledTemplate(data);

    // Generate PDF using Puppeteer
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
    await browser.close();

    // Send the PDF back to the client
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename=resume.pdf',
      'Content-Length': pdfBuffer.length,
    });
    res.send(pdfBuffer);
  } catch (error) {
    console.error('PDF generation error:', error);
    res.status(500).send('Something went wrong while generating the resume.');
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});

