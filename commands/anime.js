const axios = require('axios');

module.exports = {
    name: "anime",
    description: "Get random anime reactions",

    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;

        const type = args[0]?.toLowerCase();

        const types = [
            'hug', 'pat', 'kiss', 'wink', 'poke', 'cry', 'face-palm'
        ];

        if (!type) {
            return sock.sendMessage(chatId, {
                text: `Usage: .anime <type>\n\nTypes:\n${types.join(', ')}`
            }, { quoted: msg });
        }

        if (!types.includes(type)) {
            return sock.sendMessage(chatId, {
                text: `❌ Invalid type\nTry: ${types.join(', ')}`
            }, { quoted: msg });
        }

        try {
            await sock.sendMessage(chatId, {
                react: { text: "🎌", key: msg.key }
            });

            const res = await axios.get(`https://api.waifu.pics/sfw/${type}`);

            await sock.sendMessage(chatId, {
                image: { url: res.data.url },
                caption: `🎌 Anime ${type}`
            }, { quoted: msg });

        } catch (err) {
            console.log("Anime error:", err);

            await sock.sendMessage(chatId, {
                text: "❌ Failed to fetch anime"
            }, { quoted: msg });
        }
    }
};


