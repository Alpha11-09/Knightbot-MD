require('./settings')

const fs = require('fs')
const chalk = require('chalk')
const pino = require("pino")
const NodeCache = require("node-cache")
const readline = require("readline")

const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
    jidDecode,
    makeCacheableSignalKeyStore,
    delay
} = require("@whiskeysockets/baileys")

const store = require('./lib/lightweight_store')
const { handleMessages, handleGroupParticipantUpdate, handleStatus } = require('./main')

// Load store
store.readFromFile()
setInterval(() => store.writeToFile(), 10000)

// Bot identity
global.botname = "Alpha Bot"
global.owner = "Your Name"
global.prefix = "."

// Pairing settings
let phoneNumber = "263XXXXXXXXX" // <-- put your number here
const pairingCode = !!phoneNumber || process.argv.includes("--pairing-code")

// CLI input
const rl = process.stdin.isTTY ? readline.createInterface({ input: process.stdin, output: process.stdout }) : null
const question = (text) => rl ? new Promise((resolve) => rl.question(text, resolve)) : Promise.resolve(phoneNumber)

// Start bot
async function startAlphaBot() {
    try {
        let { version } = await fetchLatestBaileysVersion()
        const { state, saveCreds } = await useMultiFileAuthState(`./session`)
        const msgRetryCounterCache = new NodeCache()

        const sock = makeWASocket({
            version,
            logger: pino({ level: 'silent' }),
            printQRInTerminal: !pairingCode,
            browser: ["Alpha Bot", "Chrome", "1.0"],
            auth: {
                creds: state.creds,
                keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" })),
            },
            markOnlineOnConnect: true,
            generateHighQualityLinkPreview: true,
            msgRetryCounterCache
        })

        store.bind(sock.ev)

        sock.ev.on('creds.update', saveCreds)

        // 📩 Messages
        sock.ev.on('messages.upsert', async (chatUpdate) => {
            try {
                const mek = chatUpdate.messages[0]
                if (!mek.message) return

                mek.message = mek.message?.ephemeralMessage?.message || mek.message

                if (mek.key?.remoteJid === 'status@broadcast') {
                    return handleStatus(sock, chatUpdate)
                }

                await handleMessages(sock, chatUpdate)

            } catch (err) {
                console.log("Message Error:", err)
            }
        })

        // 👥 Group updates
        sock.ev.on('group-participants.update', async (update) => {
            await handleGroupParticipantUpdate(sock, update)
        })

        // 🔗 Pairing Code
        if (pairingCode && !sock.authState.creds.registered) {
            let number = await question(`Enter your WhatsApp number (e.g 2637XXXXXXXX):\n`)
            number = number.replace(/[^0-9]/g, '')

            setTimeout(async () => {
                let code = await sock.requestPairingCode(number)
                code = code?.match(/.{1,4}/g)?.join("-") || code

                console.log(chalk.green(`\nYour Pairing Code: ${code}\n`))
            }, 3000)
        }

        // 🔌 Connection
        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect } = update

            if (connection === 'open') {
                console.log(chalk.green(`✅ Alpha Bot Connected`))
            }

            if (connection === 'close') {
                let reason = lastDisconnect?.error?.output?.statusCode

                if (reason === DisconnectReason.loggedOut) {
                    console.log("Session expired, delete session folder.")
                } else {
                    console.log("Reconnecting...")
                    startAlphaBot()
                }
            }
        })

    } catch (err) {
        console.log("Startup Error:", err)
        setTimeout(startAlphaBot, 5000)
    }
}

// Start
startAlphaBot()