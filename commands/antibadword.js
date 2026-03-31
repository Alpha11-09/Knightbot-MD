const { handleAntiBadwordCommand } = require('../lib/antibadword');
const isAdmin = require('../lib/isAdmin');

module.exports = {
    name: "antibadword",
    description: "Enable or configure anti bad words",

    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;
        const senderId = msg.key.participant || msg.key.remoteJid;

        // Only allow in groups
        if (!chatId.endsWith('@g.us')) {
            return sock.sendMessage(chatId, {
                text: "❌ This command works in groups only"
            }, { quoted: msg });
        }

        // Check admin status
        const adminStatus = await isAdmin(sock, chatId, senderId);

        if (!adminStatus.isSenderAdmin) {
            return sock.sendMessage(chatId, {
                text: "❌ Admins only!"
            }, { quoted: msg });
        }

        // Get arguments
        const match = args.join(" ");

        // Call main logic
        await handleAntiBadwordCommand(sock, chatId, msg, match);
    }
}; 