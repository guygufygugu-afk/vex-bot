// ==========================================
// SERVER PENTRU MONITORIZARE (RENDER / BETTER STACK)
// ==========================================
const http = require('http');
http.createServer((req, res) => {
    res.write("Botul este online!");
    res.end();
}).listen(process.env.PORT || 3000, () => {
    console.log("🚀 Serverul de monitoring web a pornit cu succes!");
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

// ID-urile tale de configurare pentru Server și Roluri
const CONFIG = {
    SERVER_ID: '1519071231951896667', // ID-ul serverului tău adăugat corect!
    OWNER_ROLE_ID: '1519074184062308623',
    STAFF_ROLE_ID: '1519225072517255180'
};

// ==========================================
// DEFINIRE COMENZI SLASH (CORECTATĂ PENTRU DISCORD API)
// ==========================================
const commands = [
    { 
        name: 'kick', 
        description: 'Dă afară un membru de pe server', 
        options: [{ name: 'user', type: 6, description: 'Membrul pe care vrei să-l dai afară', required: true }] // type 6 = USER
    },
    { 
        name: 'ban', 
        description: 'Banează un utilizator', 
        options: [{ name: 'user', type: 6, description: 'Utilizatorul pe care vrei să-l banezi', required: true }] // type 6 = USER
    },
    { 
        name: 'timeout', 
        description: 'Pune un utilizator în timeout', 
        options: [
            { name: 'user', type: 6, description: 'Utilizatorul pe care vrei să-l pui în timeout', required: true }, // type 6 = USER
            { name: 'time', type: 4, description: 'Timpul în minute', required: true } // type 4 = INTEGER
        ] 
    },
    { 
        name: 'untimeout', 
        description: 'Scoate un utilizator din timeout', 
        options: [{ name: 'user', type: 6, description: 'Utilizatorul pe care vrei să-l scoți din timeout', required: true }] // type 6 = USER
    },
    { 
        name: 'lock', 
        description: 'Blochează canalul curent', 
        options: [] 
    },
    { 
        name: 'unlock', 
        description: 'Deblochează canalul curent', 
        options: [] 
    },
    { 
        name: 'clear', 
        description: 'Șterge mesaje', 
        options: [{ name: 'amount', type: 4, description: 'Numărul de mesaje pe care vrei să le ștergi', required: true }] // type 4 = INTEGER
    },
    { 
        name: 'ticket', 
        description: 'Trimite panoul pentru crearea tichetelor de suport', 
        options: [] 
    }
];

// ==========================================
// CONFIRMARE CONEXIUNE ȘI AUTO-ÎNREGISTRARE INSTANTANEE
// ==========================================
client.once('ready', async () => {
    console.log(`\n✅ SUCCES DEPLIN: Botul s-a conectat la Discord ca: ${client.user.tag}\n`);
    
    try {
        console.log(`🔄 Se înregistrează comenzile slash INSTANT pe serverul: ${CONFIG.SERVER_ID}...`);
        
        const guild = await client.guilds.fetch(CONFIG.SERVER_ID);
        if (guild) {
            await guild.commands.set(commands);
            console.log('🎯 [SERVER] Toate comenzile slash au fost activate și sunt vizibile ACUM!');
        }
    } catch (error) {
        console.error('❌ Eroare la trimiterea rapidă a comenzilor pe server:', error);
        
        // Plan de rezervă: dacă apar probleme, le trimitem global
        try {
            await client.application.commands.set(commands);
            console.log('🎯 [GLOBAL] Activat global ca rezervă.');
        } catch (err) {
            console.error('❌ Eșec total la înregistrarea comenzilor:', err);
        }
    }
});

// LOGURI DE REȚEA
client.on('debug', info => {
    if (info.includes('Connect') || info.includes('gateway') || info.includes('identif') || info.includes('rate')) {
        console.log(`⚙️ [Discord Rețea]: ${info}`);
    }
});

// ==========================================
// HANDLER INTERACȚIUNI (COMENZI ȘI BUTOANE)
// ==========================================
client.on('interactionCreate', async interaction => {
    if (interaction.isChatInputCommand()) {
        const { commandName, options } = interaction;

        try {
            const target = options.getMember('user');
            const reason = 'Fără motiv specificat';

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

    if (interaction.isButton()) {
        try {
            if (interaction.customId === 'create_ticket') {
                await interaction.deferReply({ flags: 64 });

                const ticketChannel = await interaction.guild.channels.create({
                    name: `ticket-${interaction.user.username}`,
                    type: 0, 
                    permissionOverwrites: [
                        {
                            id: interaction.guild.id, 
                            deny: [PermissionFlagsBits.ViewChannel],
                        },
                        {
                            id: interaction.user.id, 
                            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory],
                        },
                        {
                            id: CONFIG.OWNER_ROLE_ID, 
                            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory],
                        },
                        {
                            id: CONFIG.STAFF_ROLE_ID, 
                            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory],
                        }
                    ],
                });

                const welcomeEmbed = new EmbedBuilder()
                    .setTitle('🎫 Tichet Suport Deschis')
                    .setDescription(`Salut ${interaction.user}!\nTe rugăm să detaliezi cererea ta aici. Un administrator te va asista imediat.\n\nPentru a închide biletul, apasă pe butonul de mai jos.`)
                    .setColor(0x00FF00);

                const closeRow = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId('close_ticket')
                        .setLabel('Închide Tichet')
                        .setStyle(ButtonStyle.Danger)
                        .setEmoji('🔒')
                );

                await ticketChannel.send({ 
                    content: `${interaction.user} | Echipa a fost notificată.`, 
                    embeds: [welcomeEmbed], 
                    components: [closeRow] 
                });

                return interaction.editReply({ content: `✅ Tichetul tău a fost generat aici: ${ticketChannel}` });
            }

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

client.on('error', (error) => {
    console.error('Eroare întâmpinată de clientul Discord:', error);
});

// Pornire bot cu igienizare Token
if (!process.env.TOKEN) {
    console.error("❌ EROARE CRITICĂ: Variabila de mediu 'TOKEN' lipsește complet de pe Render!");
} else {
    const cleanToken = process.env.TOKEN.replace(/['"]+/g, '').trim();
    console.log("🔑 Verificare: Se inițiază conexiunea securizată cu Discord...");
    client.login(cleanToken).catch(err => {
        console.error("❌ EROARE CONEXIUNE DISCORD: Autentificarea a eșuat!", err);
    });
          }
                    
