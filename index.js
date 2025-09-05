require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const Tesseract = require('tesseract.js'); 
const fetch = require('node-fetch'); 

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,              
        GatewayIntentBits.GuildMessages,       
        GatewayIntentBits.MessageContent,      
        GatewayIntentBits.GuildMembers,        
    ]
});

// Menunggu bot siap
client.once('ready', () => {
    console.log('✅ Bot is online!');
});

// Mengambil konfigurasi dari .env
const CHANNEL_ID = process.env.CHANNEL_ID; // Channel verifikasi
const VERIFIED_ROLE_ID = process.env.VERIFIED_ROLE_ID; // Role Verified
const YOUR_YOUTUBE_CHANNEL_URL = process.env.YOUR_YOUTUBE_CHANNEL_URL; // URL channel YouTube

// Fungsi untuk verifikasi gambar menggunakan OCR
async function verifyScreenshotWithOCR(imageBuffer) {
    try {
        const { data: { text } } = await Tesseract.recognize(imageBuffer, 'eng+ind', { logger: (m) => console.log(m) });
        console.log('Teks yang ditemukan: ', text);

        const cleanedText = text.replace(/[^\w\s]/gi, ' ').toLowerCase();
        console.log('Teks yang dibersihkan: ', cleanedText);

        const regex = /disubscribe|subscribed|melanggan/;
        return regex.test(cleanedText);
    } catch (err) {
        console.error('❌ Error verifying image with OCR:', err);
        return false;
    }
}

// Mendengarkan pesan di server
client.on('messageCreate', async (message) => {
    if (message.author.bot) return; // Abaikan pesan dari bot

    // Cek apakah pesan dikirim di channel verifikasi
    if (message.channel.id !== CHANNEL_ID) return; 

    console.log(`📩 Pesan diterima dari: ${message.author.tag} di channel ${message.channel.id}`);

    // Jika pengguna mengirim teks biasa di channel verifikasi
    if (message.attachments.size === 0) {
        message.reply(`**📌 Verify Dulu!**\n\nUntuk mendapatkan akses ke server, kamu harus subscribe ke channel YouTube kami!\n\n✅ **Cara Verifikasi:**\n1️⃣ Subscribe ke channel YouTube ini: 🔗 [${YOUR_YOUTUBE_CHANNEL_URL}]\n2️⃣ Ambil screenshot bukti sudah subscribe\n3️⃣ Kirim screenshot di sini\n4️⃣ Tunggu sebentar, bot akan memverifikasi secara otomatis. 🚀\n\n**english**\n\n**📌 Verify First!**\n\nTo get access to the server, you must subscribe to our YouTube channel!\n\n✅ **How ​​to Verify:**\n1️⃣ Subscribe to this YouTube channel: 🔗 [${YOUR_YOUTUBE_CHANNEL_URL}]\n2️⃣ Take a screenshot of your subscription\n3️⃣ Send the screenshot here\n4️⃣ Wait a moment, the bot will verify automatically. 🚀`);
        return;
    }

    // Jika pengguna mengirim gambar
    const attachment = message.attachments.first();
    if (attachment.contentType && attachment.contentType.startsWith('image')) {
        try {
            const response = await fetch(attachment.url);
            const imageBuffer = await response.buffer();
            console.log('📸 Gambar berhasil diunduh.');

            const isVerified = await verifyScreenshotWithOCR(imageBuffer);
            console.log('✅ Gambar verifikasi status:', isVerified);

            if (isVerified) {
                if (message.guild) {
                    const member = await message.guild.members.fetch(message.author.id);
                    const verifiedRole = message.guild.roles.cache.get(VERIFIED_ROLE_ID);

                    if (verifiedRole && !member.roles.cache.has(verifiedRole.id)) {
                        await member.roles.add(verifiedRole);
                        message.reply('✅ **Verifikasi berhasil!** Terima kasih telah subscribe ke channel YouTube kami!\n✅ **Verification successful!** Thank you for subscribing to our YouTube channel!');
                    } else {
                        message.reply('✅ Anda sudah terverifikasi sebelumnya!\n✅ You have been previously verified!');
                    }
                }
                message.delete();
            } else {
                message.reply('⚠️ **Gambar tidak valid!**\nPastikan screenshot menunjukkan bahwa kamu sudah subscribe ke channel YouTube kami.\n\n⚠️ **Invalid image!**\nMake sure the screenshot shows that you have subscribed to our YouTube channel.\nUse the English language setting in your YouTube app if it continues to fail');
            }
        } catch (err) {
            console.error('❌ Gagal mengunduh gambar:', err);
            message.reply('⚠️ Terjadi kesalahan saat memproses gambar.');
        }
    }
});

// Login bot menggunakan token dari .env
client.login(process.env.DISCORD_TOKEN);
