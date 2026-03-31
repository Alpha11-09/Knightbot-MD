const settings = require('../settings');

module.exports = {
    name: "alive",
    description: "Check bot status",

    async execute(sock, msg) {
        const chatId = msg.key.remoteJid;

        const text = `
🤖 *${settings.botName} is Alive!*

📌 Version: ${settings.version}
⚡ Status: Online
🌐 Mode: ${settings.commandMode}

✨ Features:
• Group Management
• AI Commands
• Fun Commands
• More coming soon...

📖 Type ${settings.prefix}menu to see commands
        `;

        await sock.sendMessage(chatId, {
            text
        }, { quoted: msg });
    }
};;