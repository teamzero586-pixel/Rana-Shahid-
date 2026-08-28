const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

const app = express();
app.use(cors());

const PORT = process.env.PORT || 5000;

app.get('/api/download', (req, res) => {
    const query = req.query.q;
    const format = req.query.format || 'video';
    const limit = req.query.limit || 1;

    if (!query) {
        return res.status(400).send('Query ya URL zaroori hai');
    }

    const timestamp = Date.now();
    const downloadDir = path.join(__dirname, `downloads_${timestamp}`);
    if (!fs.existsSync(downloadDir)) fs.mkdirSync(downloadDir);

    let ytDlpTarget = query;
    if (!query.startsWith('http')) {
        ytDlpTarget = `ytsearch${limit}:${query}`;
    }

    // 403 Error se bachne ke liye `--user-agent` aur `--geo-bypass` add kiya hai
    let ytDlpCommand = '';
    if (format === 'audio') {
        ytDlpCommand = `yt-dlp --geo-bypass --user-agent "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" -f bestaudio -x --audio-format mp3 -o "${downloadDir}/%(title)s.%(ext)s" "${ytDlpTarget}"`;
    } else {
        ytDlpCommand = `yt-dlp --geo-bypass --user-agent "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" -f "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best" -o "${downloadDir}/%(title)s.%(ext)s" "${ytDlpTarget}"`;
    }

    console.log("Running Command:", ytDlpCommand);

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="Rana_Shahid_Downloads_${timestamp}.zip"`);

    const archive = archiver('zip', { zlib: { level: 9 } });
    archive.pipe(res);

    exec(ytDlpCommand, (error, stdout, stderr) => {
        if (error) {
            console.error("Download Error:", error);
            archive.abort();
            return;
        }
        
        archive.directory(downloadDir, false);
        archive.finalize();

        archive.on('end', () => {
            fs.rmSync(downloadDir, { recursive: true, force: true });
        });
    });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
