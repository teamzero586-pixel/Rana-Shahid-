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
        return res.status(400).json({ error: 'Query ya URL zaroori hai' });
    }

    const timestamp = Date.now();
    const downloadDir = path.join(__dirname, `downloads_${timestamp}`);
    if (!fs.existsSync(downloadDir)) fs.mkdirSync(downloadDir);

    let ytDlpTarget = query;
    if (!query.startsWith('http')) {
        ytDlpTarget = `ytsearch${limit}:${query}`;
    }

    let ytDlpCommand = '';
    if (format === 'audio') {
        ytDlpCommand = `yt-dlp --geo-bypass --user-agent "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" -f bestaudio -x --audio-format mp3 -o "${downloadDir}/%(title)s.%(ext)s" "${ytDlpTarget}"`;
    } else {
        ytDlpCommand = `yt-dlp --geo-bypass --user-agent "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" -f "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best" -o "${downloadDir}/%(title)s.%(ext)s" "${ytDlpTarget}"`;
    }

    console.log("Running Command:", ytDlpCommand);

    exec(ytDlpCommand, (error, stdout, stderr) => {
        if (error) {
            console.error("Download Error:", error);
            if (fs.existsSync(downloadDir)) fs.rmSync(downloadDir, { recursive: true, force: true });
            return;
        }

        // ZIP Archive create karna
        const zipPath = path.join(__dirname, `Rana_Shahid_${timestamp}.zip`);
        const output = fs.createWriteStream(zipPath);
        const archive = archiver('zip', { zlib: { level: 9 } });

        output.on('close', () => {
            // File banne ke baad client ko send kar dena
            res.download(zipPath, () => {
                // Cleanup files after sending
                if (fs.existsSync(downloadDir)) fs.rmSync(downloadDir, { recursive: true, force: true });
                if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);
            });
        });

        archive.on('error', (err) => {
            throw err;
        });

        archive.pipe(output);
        archive.directory(downloadDir, false);
        archive.finalize();
    });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
