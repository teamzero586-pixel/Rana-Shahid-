const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

app.post('/api/download', (req, res) => {
    const { url, format } = req.body; // format: 'audio' ya 'video'

    if (!url) {
        return res.status(400).json({ error: 'URL ya search query zaroori hai!' });
    }

    // Format selection logic
    let ytDlpCommand = '';
    if (format === 'audio') {
        // Audio (MP3) extraction command
        ytDlpCommand = `yt-dlp -f bestaudio -x --audio-format mp3 -o "%(title)s.%(ext)s" "${url}"`;
    } else {
        // Video (MP4) extraction command
        ytDlpCommand = `yt-dlp -f "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best" -o "%(title)s.%(ext)s" "${url}"`;
    }

    console.log(`Executing: ${ytDlpCommand}`);

    exec(ytDlpCommand, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error: ${error.message}`);
            return res.status(500).json({ error: 'Download failed!' });
        }
        res.json({ message: 'Processing complete!', stdout });
    });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
