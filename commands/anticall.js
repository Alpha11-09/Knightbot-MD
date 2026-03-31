const fs = require('fs');

const ANTICALL_PATH = './data/anticall.json';

function readState() {
    try {
        if (!fs.existsSync(ANTICALL_PATH)) return { enabled: false };
        const data = JSON.parse(fs.readFileSync(ANTICALL_PATH));
        return { enabled: !!data.enabled };
    } catch {
        return { enabled: false };
    }
}

function writeState(enabled) {
    try {
        if (!fs.existsSync('./data')) {
            fs.mkdirSync('./data', { recursive: true });
        }
        fs.writeFileSync(ANTICALL_PATH, JSON.stringify({ enabled }, null, 2));
    } catch {}
}

module.exports = {
    name: "anticall",
    description: "Auto-block users who call the bot",

    async execute(sock, msg, args, isOwner) {
        const chatId = msg.key.remoteJid;

        // 🔒 OWNER ONLY (IMPORTANT)
        if (!isOwner) {
            return sock.sendMessage(chatId, {
                text: "❌ Owner only command"
            }, { quoted: msg });
        }

        const sub = args[0]?.toLowerCase();

        if (!sub || !['on', 'off', 'status'].includes(sub)) {
            return sock.sendMessage(chatId, {
                text: `*ANTICALL*

.anticall on  - Enable auto block
.anticall off - Disable
.anticall status - Check status`
            }, { quoted: msg });
        }

        if (sub === 'status') {
            const state = readState();
            return sock.sendMessage(chatId, {
                text: `📵 Anticall is *${state.enabled ? 'ON' : 'OFF'}*`
            }, { quoted: msg });
        }

        const enable = sub === 'on';
        writeState(enable);

        await sock.sendMessage(chatId, {
            text: `✅ Anticall *${enable ? 'ENABLED' : 'DISABLED'}*`
        }, { quoted: msg });
    }
};

// export for handler use
module.exports.readState = readState;


