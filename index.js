import express from 'express';
import bodyParser from 'body-parser';
import { launch } from 'chrome-launcher';
import lighthouse from 'lighthouse';
import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

// Determine the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;
const REPORT_DIR = path.join(__dirname, 'public');
const REPORT_FILE = 'report.html';
const REPORT_PATH = path.join(REPORT_DIR, REPORT_FILE);

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(REPORT_DIR));

app.get('/', (req, res) => {
  res.sendFile(path.join(REPORT_DIR, 'index.html'));
});

app.post('/run-lighthouse', async (req, res) => {
  const url = req.body.url;

  if (!url) {
    return res.status(400).send('URL is required');
  }

  try {
    const chrome = await launch({ chromeFlags: ['--headless'] });
    const options = { logLevel: 'info', output: 'html', port: chrome.port };
    const runnerResult = await lighthouse(url, options);

    const reportHtml = runnerResult.report;
    fs.writeFileSync(REPORT_PATH, reportHtml);

    console.log('Report is done for', runnerResult.lhr.finalUrl);
    console.log('Performance score was', runnerResult.lhr.categories.performance.score * 100);

    await chrome.kill();

    // Send a URL to the generated report
    res.json({ reportUrl: `/report.html` });
  } catch (error) {
    console.error('Error running Lighthouse:', error);
    res.status(500).send('An error occurred while running Lighthouse');
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
