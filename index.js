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

// ID-urile tale
const CONFIG = {
    SERVER_ID: '1519071231951896667', 
    OWNER_ROLE_ID: '1519074184062308623',
    STAFF_ROLE_ID: '1519225072517255180'
};

// ==========================================
// DEFINIRE COMENZI SLASH
// ==========================================
const commands = [
    { name: 'kick', description: 'Dă afară un membru de pe server', options: [{ name: 'user', type: 6, description: 'Membru', required: true }] },
    { name: 'ban', description: 'Banează un utilizator', options: [{ name: 'user', type: 6, description: 'Utilizator', required: true }] },
    { name: 'timeout', description: 'Pune un utilizator în timeout', options: [{ name: 'user', type: 6, description: 'Utilizator', required: true }, { name: 'time', type: 4, description: 'Minute', required: true }] },
    { name: 'untimeout', description: 'Scoate un utilizator din timeout', options: [{ name: 'user', type: 6, description: 'Utilizator', required: true }] },
    { name: 'lock', description: 'Blochează canalul curent', options: [] },
    { name: 'unlock', description: 'Deblochează canalul curent', options: [] },
    { name: 'clear', description: 'Șterge mesaje', options: [{ name: 'amount', type: 4, description: 'Număr mesaje', required: true }] },
    { name: 'ticket', description: 'Trimite panoul pentru crearea tichetelor', options: [] }
];

client.once('ready', async () => {
    console.log(`\n✅ SUCCES: Conectat ca ${client.user.tag}\n`);
    try {
        const guild = await client.guilds.fetch(CONFIG.SERVER_ID);
        if (guild) {
            await guild.commands.set(commands);
            console.log('🎯 [SERVER] Comenzi slash reîncărcate!');
        }
    } catch (error) {
        console.error('❌ Eroare comenzi:', error);
    }
});

// ==========================================
// HANDLER INTERACȚIUNI (COMENZI ȘI BUTOANE)
// ==========================================
client.on('interactionCreate', async interaction => {
    if (interaction.isChatInputCommand()) {
        const { commandName, options } = interaction;

        try {
            // 1. TICKET
            if (commandName === 'ticket') {
                if (!interaction.member.roles.cache.has(CONFIG.OWNER_ROLE_ID) && !interaction.member.roles.cache.has(CONFIG.STAFF_ROLE_ID)) {
                    return interaction.reply({ content: '❌ Nu ai permisiunea!', flags: 64 });
                }
                const panelEmbed = new EmbedBuilder()
                    .setTitle('🎫 Centru de Suport')
                    .setDescription('Ai nevoie de ajutor?\nApasă butonul pentru a deschide un tichet.')
                    .setColor(0x0099FF);
                const row = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId('create_ticket').setLabel('Deschide Tichet').setStyle(ButtonStyle.Primary).setEmoji('🎫')
                );
                return interaction.reply({ embeds: [panelEmbed], components: [row] });
            }

            // 2. LOCK & UNLOCK
            if (commandName === 'lock') {
                if (!interaction.member.permissions.has(PermissionFlagsBits.ManageChannels) && !interaction.member.roles.cache.has(CONFIG.OWNER_ROLE_ID)) {
                    return interaction.reply({ content: '❌ Nu ai permisiunea!', flags: 64 });
                }
                await interaction.channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: false });
                return interaction.reply({ content: `🔒 Canalul a fost blocat.` });
            }

            if (commandName === 'unlock') {
                if (!interaction.member.permissions.has(PermissionFlagsBits.ManageChannels) && !interaction.member.roles.cache.has(CONFIG.OWNER_ROLE_ID)) {
                    return interaction.reply({ content: '❌ Nu ai permisiunea!', flags: 64 });
                }
                await interaction.channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: null });
                return interaction.reply({ content: `🔓 Canalul a fost deblocat.` });
            }

            // 3. CLEAR
            if (commandName === 'clear') {
                if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages) && !interaction.member.roles.cache.has(CONFIG.OWNER_ROLE_ID) && !interaction.member.roles.cache.has(CONFIG.STAFF_ROLE_ID)) {
                    return interaction.reply({ content: '❌ Nu ai permisiunea!', flags: 64 });
                }
                const amount = options.getInteger('amount');
                if (amount < 1 || amount > 100) return interaction.reply({ content: '❌ Introdu un număr între 1 și 100!', flags: 64 });
                await interaction.channel.bulkDelete(amount, true);
                return interaction.reply({ content: `✅ Am șters ${amount} mesaje.`, flags: 64 });
            }

            // 4. COMENZI CU TARGET (KICK / BAN / TIMEOUT)
            const target = options.getMember('user');
            const reason = 'Fără motiv specificat';

            if (commandName === 'kick') {
                if (!interaction.member.permissions.has(PermissionFlagsBits.KickMembers) && !interaction.member.roles.cache.has(CONFIG.OWNER_ROLE_ID) && !interaction.member.roles.cache.has(CONFIG.STAFF_ROLE_ID)) return interaction.reply({ content: '❌ Nu ai permisiunea!', flags: 64 });
                if (!target) return interaction.reply({ content: '❌ Membrul nu a fost găsit!', flags: 64 });
                await target.kick(reason);
                return interaction.reply({ content: `✅ ${target.user.username} a fost dat afară.` });
            }

            if (commandName === 'ban') {
                if (!interaction.member.permissions.has(PermissionFlagsBits.BanMembers) && !interaction.member.roles.cache.has(CONFIG.OWNER_ROLE_ID)) return interaction.reply({ content: '❌ Nu ai permisiunea!', flags: 64 });
                if (!target) return interaction.reply({ content: '❌ Membrul nu a fost găsit!', flags: 64 });
                await target.ban({ reason });
                return interaction.reply({ content: `✅ ${target.user.username} a fost banat.` });
            }

            if (commandName === 'timeout') {
                if (!interaction.member.permissions.has(PermissionFlagsBits.ModerateMembers) && !interaction.member.roles.cache.has(CONFIG.OWNER_ROLE_ID) && !interaction.member.roles.cache.has(CONFIG.STAFF_ROLE_ID)) return interaction.reply({ content: '❌ Nu ai permisiunea!', flags: 64 });
                if (!target) return interaction.reply({ content: '❌ Membrul nu a fost găsit!', flags: 64 });
                const min = options.getInteger('time');
                await target.timeout(min * 60 * 1000, reason);
                return interaction.reply({ content: `✅ ${target.user.username} este în timeout.` });
            }

            if (commandName === 'untimeout') {
                if (!interaction.member.permissions.has(PermissionFlagsBits.ModerateMembers) && !interaction.member.roles.cache.has(CONFIG.OWNER_ROLE_ID) && !interaction.member.roles.cache.has(CONFIG.STAFF_ROLE_ID)) return interaction.reply({ content: '❌ Nu ai permisiunea!', flags: 64 });
                if (!target) return interaction.reply({ content: '❌ Membrul nu a fost găsit!', flags: 64 });
                await target.timeout(null);
                return interaction.reply({ content: `✅ Timeout scos pentru ${target.user.username}.` });
            }

        } catch (error) {
            console.error(`Eroare la comanda ${commandName}:`, error);
            const replyData = { content: '❌ Eroare! Verifică dacă botul are permisiunea de Administrator și dacă rolul lui este pus CEL MAI SUS în ierarhie!', flags: 64 };
            if (interaction.replied || interaction.deferred) await interaction.followUp(replyData).catch(() => {});
            else await interaction.reply(replyData).catch(() => {});
        }
    }

    // GESTIONARE BUTOANE (TICKETE)
    if (interaction.isButton()) {
        try {
            if (interaction.customId === 'create_ticket') {
                await interaction.deferReply({ flags: 64 });
                const ticketChannel = await interaction.guild.channels.create({
                    name: `ticket-${interaction.user.username}`,
                    type: 0, 
                    permissionOverwrites: [
                        { id: interaction.guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
                        { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
                        { id: CONFIG.OWNER_ROLE_ID, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
                        { id: CONFIG.STAFF_ROLE_ID, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] }
                    ],
                });
                const welcomeEmbed = new EmbedBuilder().setTitle('🎫 Tichet Suport').setDescription(`Salut ${interaction.user}!\nDetaliază problema aici.`).setColor(0x00FF00);
                const closeRow = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('close_ticket').setLabel('Închide Tichet').setStyle(ButtonStyle.Danger).setEmoji('🔒'));
                await ticketChannel.send({ content: `${interaction.user} | Staff notificat.`, embeds: [welcomeEmbed], components: [closeRow] });
                return interaction.editReply({ content: `✅ Tichetul tău este aici: ${ticketChannel}` });
            }

            if (interaction.customId === 'close_ticket') {
                await interaction.reply({ content: '🔒 Acest tichet va fi șters în 5 secunde...' });
                setTimeout(() => interaction.channel.delete().catch(() => {}), 5000);
            }
        } catch (err) { console.error("Eroare la butoane:", err); }
    }
});

client.on('messageCreate', async message => {
    if (message.author.bot || !message.content.startsWith('+')) return;
    const cmd = message.content.split(' ')[0].toLowerCase();
    if (cmd === '+help') return message.reply({ embeds: [new EmbedBuilder().setTitle('🤖 Meniu').setDescription('**+lb** - Clasament.\n**/ticket** - Panou de suport (Staff).')] });
    if (cmd === '+leaderboard' || cmd === '+lb') return message.reply('🏆 **Leaderboard activat!**');
});

if (!process.env.TOKEN) {
    console.error("❌ TOKEN LIPSĂ!");
} else {
    client.login(process.env.TOKEN.replace(/['"]+/g, '').trim()).catch(err => console.error("❌ EROARE CONEXIUNE:", err));
                    }
