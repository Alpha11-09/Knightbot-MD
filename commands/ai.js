 const axios = require('axios');

module.exports = {
    name: "gpt",
    description: "Chat with AI",

    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;

        if (!args.length) {
            return sock.sendMessage(chatId, {
                text: "Example:\n.gpt Tell me a joke"
            }, { quoted: msg });
        }

        const query = args.join(" ");

        try {
            // React while processing
            await sock.sendMessage(chatId, {
                react: { text: "🤖", key: msg.key }
            });

            const res = await axios.get(
                `https://api.popcat.xyz/chatbot?msg=${encodeURIComponent(query)}&owner=Alpha&botname=AlphaBot`
            );

            const reply = res.data.response;

            await sock.sendMessage(chatId, {
                text: reply
            }, { quoted: msg });

        } catch (err) {
            console.log("AI Error:", err);

            await sock.sendMessage(chatId, {
                text: "❌ AI failed. Try again later."
            }, { quoted: msg });
        }
    }
};