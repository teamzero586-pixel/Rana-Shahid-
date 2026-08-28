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
    // Frontend se search query, format aur limit get karna
    const query = req.query.q;
    const format = req.query.format || 'video';
    const limit = req.query.limit || 1;

    if (!query) {
        return res.status(400).send('Query ya URL zaroori hai');
    }

    // Temporary folder banana jahan files save hongi
    const timestamp = Date.now();
    const downloadDir = path.join(__dirname, `downloads_${timestamp}`);
    if (!fs.existsSync(downloadDir)) fs.mkdirSync(downloadDir);

    // Agar link nahi hai (search name hai), toh ytsearch use karein
    let ytDlpTarget = query;
    if (!query.startsWith('http')) {
        ytDlpTarget = `ytsearch${limit}:${query}`;
    }

    // yt-dlp command (Audio ya Video ke hisab se)
    let ytDlpCommand = '';
    if (format === 'audio') {
        ytDlpCommand = `yt-dlp -f bestaudio -x --audio-format mp3 -o "${downloadDir}/%(title)s.%(ext)s" "${ytDlpTarget}"`;
    } else {
        ytDlpCommand = `yt-dlp -f "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best" -o "${downloadDir}/%(title)s.%(ext)s" "${ytDlpTarget}"`;
    }

    console.log("Running Command:", ytDlpCommand);

    // Browser ko batana ke ZIP file aa rahi hai
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="Rana_Shahid_Downloads_${timestamp}.zip"`);

    const archive = archiver('zip', { zlib: { level: 9 } });
    archive.pipe(res);

    // Command execute karna
    exec(ytDlpCommand, (error, stdout, stderr) => {
        if (error) {
            console.error("Download Error:", error);
            archive.abort();
            return;
        }
        
        // Download mukammal hone ke baad folder ko ZIP mein add karna
        archive.directory(downloadDir, false);
        archive.finalize();

        // ZIP complete hone ke baad server se files delete kar dena taake space bache
        archive.on('end', () => {
            fs.rmSync(downloadDir, { recursive: true, force: true });
        });
    });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
