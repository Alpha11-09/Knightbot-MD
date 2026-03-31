const fs = require('fs');
const path = require('path');
const settings = require('./settings');

// Load commands
const commands = new Map();

const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    commands.set(command.name, command);
}

// Handle messages
async function handleMessages(sock, chatUpdate) {
    const msg = chatUpdate.messages[0];
    if (!msg.message) return;

    const chatId = msg.key.remoteJid;

    const text =
        msg.message.conversation ||
        msg.message.extendedTextMessage?.text ||
        msg.message.imageMessage?.caption ||
        msg.message.videoMessage?.caption ||
        "";

    if (!text) return;

    // Prefix check
    if (!text.startsWith(settings.prefix)) return;

    const args = text.slice(settings.prefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();

    const command = commands.get(commandName);

    if (!command) {
        return await sock.sendMessage(chatId, {
            text: `❌ Command "${commandName}" not found`
        }, { quoted: msg });
    }

    try {
        await command.execute(sock, msg, args);
    } catch (err) {
        console.log(err);
        await sock.sendMessage(chatId, {
            text: "⚠️ Error executing command"
        }, { quoted: msg });
    }
}

// Group updates (we’ll expand later)
async function handleGroupParticipantUpdate(sock, update) {
    // placeholder for welcome/bye
}

// Status handler (optional)
async function handleStatus(sock, update) {
    // placeholder
}

module.exports = {
    handleMessages,
    handleGroupParticipantUpdate,
    handleStatus
};