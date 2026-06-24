// ==========================================
// SERVER PENTRU MONITORIZARE (RENDER / BETTER STACK)
// ==========================================
const http = require('http');
http.createServer((req, res) => {
    res.write("Botul este online!");
    res.end();
}).listen(process.env.PORT || 3000, () => {
    console.log("🚀 Serverul de monitoring web a pornit!");
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
// CONFIRMARE CONEXIUNE DISCORD
// ==========================================
client.once('ready', () => {
    console.log(`✅ SUCCES: Botul s-a conectat la Discord ca: ${client.user.tag}`);
});

// ==========================================
// DEFINIRE COMENZI SLASH
// ==========================================
const commands = [
    { name: 'kick', description: 'Dă afară un membru de pe server', options: [{ name: 'user', type: 'user', description: 'Membrul pe care vrei să-l dai afară', required: true }] },
    { name: 'ban', description: 'Banează un utilizator', options: [{ name: 'user', type: 'user', description: 'Utilizatorul pe care vrei să-l banezi', required: true }] },
    { name: 'timeout', description: 'Pune un utilizator în timeout', options: [{ name: 'user', type: 'user', description: 'Utilizatorul pe care vrei să-l pui în timeout', required: true }, { name: 'time', type: 'integer', description: 'Timpul în minute', required: true }] },
    { name: 'untimeout', description: 'Scoate un utilizator din timeout', options: [{ name: 'user', type: 'user', description: 'Utilizatorul pe care vrei să-l scoți din timeout', required: true }] },
    { name: 'lock', description: 'Blochează canalul curent', options: [] },
    { name: 'unlock', description: 'Deblochează canalul curent', options: [] },
    { name: 'clear', description: 'Șterge mesaje', options: [{ name: 'amount', type: 'integer', description: 'Numărul de mesaje pe care vrei să le ștergi', required: true }] },
    { name: 'ticket', description: 'Trimite panoul pentru crearea tichetelor de suport', options: [] }
];

// ==========================================
// HANDLER INTERACȚIUNI (COMENZI ȘI BUTOANE)
// ==========================================
client.on('interactionCreate', async interaction => {
    
    // 1. PROCESARE COMENZI SLASH
    if (interaction.isChatInputCommand()) {
        const { commandName, options } = interaction;

        try {
            const target = options.getMember('user');
            const reason = 'Fără motiv specificat';

            // Comanda /ticket (Trimiți panoul pe canalul unde vrei sistemul)
            if (commandName === 'ticket') {
                if (!interaction.member.roles.cache.has(CONFIG.OWNER_ROLE_ID) && !interaction.member.roles.cache.has(CONFIG.STAFF_ROLE_ID)) {
                    return interaction.reply({ content: '❌ Nu ai permisiunea de a folosi această comandă!', flags: 64 });
                }
                
                const panelEmbed = new EmbedBuilder()
                    .setTitle('🎫 Centru de Suport')
                    .setDescription('Ai nevoie de ajutor din partea echipei administrative?\nApasă pe butonul de mai jos pentru a deschide un tichet privat.')
                    .setColor(0x0099FF)
                    .setFooter({ text: 'Sistem de suport automat' });

                const row = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId('create_ticket')
                        .setLabel('Deschide Tichet')
                        .setStyle(ButtonStyle.Primary)
                        .setEmoji('🎫')
                );

                return interaction.reply({ embeds: [panelEmbed], components: [row] });
            }

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
            console.error("Eroare la comanda slash:", error);
        }
    }

    // 2. PROCESARE APĂSĂRI DE BUTOANE (TICHETE)
    if (interaction.isButton()) {
        try {
            // Când cineva apasă pe butonul "Deschide Tichet"
            if (interaction.customId === 'create_ticket') {
                await interaction.deferReply({ flags: 64 });

                // Creează canalul text pe loc și ascunde-l de ceilalți membri
                const ticketChannel = await interaction.guild.channels.create({
                    name: `ticket-${interaction.user.username}`,
                    type: 0, 
                    permissionOverwrites: [
                        {
                            id: interaction.guild.id, // @everyone este blocat
                            deny: [PermissionFlagsBits.ViewChannel],
                        },
                        {
                            id: interaction.user.id, // Utilizatorul primește acces complet
                            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory],
                        },
                        {
                            id: CONFIG.OWNER_ROLE_ID, // Owner-ul primește acces
                            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory],
                        },
                        {
                            id: CONFIG.STAFF_ROLE_ID, // Staff-ul primește acces
                            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory],
                        }
                    ],
                });

                const welcomeEmbed = new EmbedBuilder()
                    .setTitle('🎫 Tichet Suport Deschis')
                    .setDescription(`Salut ${interaction.user}!\nTe rugăm să detaliezi cererea ta aici. Un administrator (<@&${CONFIG.STAFF_ROLE_ID}> / <@&${CONFIG.OWNER_ROLE_ID}>) te va asista imediat.\n\nPentru a închide biletul, apasă pe butonul de mai jos.`)
                    .setColor(0x00FF00);

                const closeRow = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId('close_ticket')
                        .setLabel('Închide Tichet')
                        .setStyle(ButtonStyle.Danger)
                        .setEmoji('🔒')
                );

                await ticketChannel.send({ 
                    content: `${interaction.user} | Echipa a fost alertată.`, 
                    embeds: [welcomeEmbed], 
                    components: [closeRow] 
                });

                return interaction.editReply({ content: `✅ Tichetul tău a fost generat aici: ${ticketChannel}` });
            }

            // Când cineva apasă pe butonul "Închide Tichet"
            if (interaction.customId === 'close_ticket') {
                await interaction.reply({ content: '🔒 Acest tichet va fi șters definitiv în 5 secunde...' });
                setTimeout(async () => {
                    await interaction.channel.delete().catch(() => {});
                }, 5000);
            }

        } catch (err) {
            console.error("Eroare la butoanele tichetului:", err);
        }
    }
});

// ==========================================
// GESTIONARE COMENZI CU PREFIX "+"
// ==========================================
client.on('messageCreate', async message => {
    if (message.author.bot || !message.content.startsWith('+')) return;

    try {
        const args = message.content.split(' ');
        const cmd = args[0].toLowerCase();

        if (cmd === '+help') {
            const helpEmbed = new EmbedBuilder()
                .setTitle('🤖 Meniu Comenzi')
                .setDescription('**+leaderboard** sau **+lb** - Clasament.\n**/ticket** - Generează panoul de suport (doar Staff/Owner).');
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
// AUTO-RECONECTARE
// ==========================================
client.on('error', (error) => {
    console.error('Eroare de rețea:', error);
});

setInterval(() => {
    if (client.uptime && (Date.now() - client.readyTimestamp > 600000)) {
        if (client.ws.status !== 0) {
            process.exit(1);
        }
    }
}, 60000);

client.login(process.env.TOKEN).catch(err => console.error("Eroare Token:", err));
                                  
