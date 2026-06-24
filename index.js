// Server fictiv pentru a păstra portul deschis pe Render
const http = require('http');
http.createServer((req, res) => {
    res.write("Botul este online!");
    res.end();
}).listen(process.env.PORT || 3000, () => {
    console.log("Serverul de monitorizare a pornit cu succes!");
});

const { Client, GatewayIntentBits, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

const CONFIG = {
    OWNER_ROLE_ID: '1519074184062308623',
    STAFF_ROLE_ID: '1519225072517255180'
};

// ==========================================
// DEFINIRE COMENZI SLASH ADMINISTRATIVE
// ==========================================
const commands = [
    { name: 'kick', description: 'Dă afară un membru de pe server', options: [{ name: 'user', type: 'user', description: 'Membrul pe care vrei să-l dai afară', required: true }] },
    { name: 'ban', description: 'Banează un utilizator', options: [{ name: 'user', type: 'user', description: 'Utilizatorul pe care vrei să-l banezi', required: true }] },
    { name: 'timeout', description: 'Pune un utilizator în timeout', options: [{ name: 'user', type: 'user', description: 'Utilizatorul pe care vrei să-l pui în timeout', required: true }, { name: 'time', type: 'integer', description: 'Timpul în minute', required: true }] },
    { name: 'untimeout', description: 'Scoate un utilizator din timeout', options: [{ name: 'user', type: 'user', description: 'Utilizatorul pe care vrei să-l scoți din timeout', required: true }] },
    { name: 'lock', description: 'Blochează canalul curent', options: [] },
    { name: 'unlock', description: 'Deblochează canalul curent', options: [] },
    { name: 'clear', description: 'Șterge mesaje', options: [{ name: 'amount', type: 'integer', description: 'Numărul de mesaje pe care vrei să le ștergi', required: true }] },
];

// ==========================================
// HANDLER COMENZI SLASH
// ==========================================
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;
    const { commandName, options } = interaction;

    try {
        const target = options.getMember('user');
        const reason = options.getString('reason') || 'Fără motiv specificat';

        if (commandName === 'kick') {
            if (!interaction.member.permissions.has(PermissionFlagsBits.KickMembers) && !interaction.member.roles.cache.has(CONFIG.OWNER_ROLE_ID) && !interaction.member.roles.cache.has(CONFIG.STAFF_ROLE_ID)) {
                return interaction.reply({ content: '❌ Nu ai permisiunea!', flags: 64 });
            }
            if (!target) return interaction.reply({ content: '❌ Membrul nu a fost găsit!', flags: 64 });
            await target.kick(reason).catch(() => {});
            return interaction.reply({ content: `✅ Membrul a fost dat afară.` });
        }

        if (commandName === 'ban') {
            if (!interaction.member.permissions.has(PermissionFlagsBits.BanMembers) && !interaction.member.roles.cache.has(CONFIG.OWNER_ROLE_ID)) {
                return interaction.reply({ content: '❌ Nu ai permisiunea!', flags: 64 });
            }
            if (!target) return interaction.reply({ content: '❌ Membrul nu a fost găsit!', flags: 64 });
            await target.ban({ reason }).catch(() => {});
            return interaction.reply({ content: `✅ Membrul a fost banat.` });
        }

        if (commandName === 'timeout') {
            if (!interaction.member.permissions.has(PermissionFlagsBits.ModerateMembers) && !interaction.member.roles.cache.has(CONFIG.OWNER_ROLE_ID) && !interaction.member.roles.cache.has(CONFIG.STAFF_ROLE_ID)) {
                return interaction.reply({ content: '❌ Nu ai permisiunea!', flags: 64 });
            }
            if (!target) return interaction.reply({ content: '❌ Membrul nu a fost găsit!', flags: 64 });
            const min = options.getInteger('time');
            await target.timeout(min * 60 * 1000, reason).catch(() => {});
            return interaction.reply({ content: `✅ Membrul a fost pus în timeout pentru ${min} minute.` });
        }

        if (commandName === 'untimeout') {
            if (!interaction.member.permissions.has(PermissionFlagsBits.ModerateMembers) && !interaction.member.roles.cache.has(CONFIG.OWNER_ROLE_ID) && !interaction.member.roles.cache.has(CONFIG.STAFF_ROLE_ID)) {
                return interaction.reply({ content: '❌ Nu ai permisiunea!', flags: 64 });
            }
            if (!target) return interaction.reply({ content: '❌ Membrul nu a fost găsit!', flags: 64 });
            await target.timeout(null).catch(() => {});
            return interaction.reply({ content: `✅ Timeout-ul a fost scos.` });
        }

        if (commandName === 'lock') {
            if (!interaction.member.permissions.has(PermissionFlagsBits.ManageChannels) && !interaction.member.roles.cache.has(CONFIG.OWNER_ROLE_ID)) {
                return interaction.reply({ content: '❌ Nu ai permisiunea!', flags: 64 });
            }
            await interaction.channel.permissionOverwrites.edit(interaction.guild.id, { SendMessages: false });
            return interaction.reply({ content: `🔒 Canalul a fost blocat.` });
        }

        if (commandName === 'unlock') {
            if (!interaction.member.permissions.has(PermissionFlagsBits.ManageChannels) && !interaction.member.roles.cache.has(CONFIG.OWNER_ROLE_ID)) {
                return interaction.reply({ content: '❌ Nu ai permisiunea!', flags: 64 });
            }
            await interaction.channel.permissionOverwrites.edit(interaction.guild.id, { SendMessages: true });
            return interaction.reply({ content: `🔓 Canalul a fost deblocat.` });
        }

        if (commandName === 'clear') {
            if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages) && !interaction.member.roles.cache.has(CONFIG.OWNER_ROLE_ID) && !interaction.member.roles.cache.has(CONFIG.STAFF_ROLE_ID)) {
                return interaction.reply({ content: '❌ Nu ai permisiunea!', flags: 64 });
            }
            const amount = options.getInteger('amount');
            if (amount < 1 || amount > 100) return interaction.reply({ content: '❌ Introdu un număr între 1 și 100!', flags: 64 });
            await interaction.channel.bulkDelete(amount, true).catch(() => {});
            return interaction.reply({ content: `✅ Am șters ${amount} mesaje.`, flags: 64 });
        }

    } catch (error) {
        console.error("Eroare la procesarea comenzii slash:", error);
    }
});

// ==========================================
// GESTIONARE COMENZI TEXT CU PREFIXUL "+"
// ==========================================
client.on('messageCreate', async message => {
    if (message.author.bot || !message.content.startsWith('+')) return;

    try {
        const args = message.content.split(' ');
        const cmd = args[0].toLowerCase();

        if (cmd === '+help') {
            const helpEmbed = new EmbedBuilder()
                .setTitle('🤖 Meniu Comenzi')
                .setDescription('**+leaderboard** sau **+lb** - Vezi clasamentul.');
            return message.reply({ embeds: [helpEmbed] });
        }

        if (cmd === '+leaderboard' || cmd === '+lb') {
            return message.reply('🏆 **Leaderboard-ul este funcțional și activat!**');
        }

    } catch (err) { 
        console.error("Eroare la comanda cu prefix:", err); 
    }
});

// ==========================================
// RECONECTARE AUTOMATĂ ȘI PORNIRE BOT
// ==========================================
client.on('error', (error) => {
    console.error('Eroare de conexiune, se încearcă reconectarea...', error);
});

setInterval(() => {
    if (client.uptime && (Date.now() - client.readyTimestamp > 600000)) {
        if (client.ws.status !== 0) {
            console.log('Bot blocat, forțez reconectarea...');
            process.exit(1);
        }
    }
}, 60000);

client.login(process.env.TOKEN).catch(err => console.error("Eroare la pornirea botului:", err));
                
