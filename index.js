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

const { Client, GatewayIntentBits, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ApplicationCommandOptionType } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

// ID-urile tale de configurare
const CONFIG = {
    SERVER_ID: '1519071231951896667', 
    OWNER_ROLE_ID: '1519074184062308623',
    STAFF_ROLE_ID: '1519225072517255180'
};

// ==========================================
// DEFINIRE COMENZI SLASH (CORECTATE PENTRU V14)
// ==========================================
const commands = [
    { 
        name: 'kick', 
        description: 'Dă afară un membru de pe server', 
        options: [{ name: 'user', type: ApplicationCommandOptionType.User, description: 'Membru', required: true }] 
    },
    { 
        name: 'ban', 
        description: 'Banează un utilizator', 
        options: [{ name: 'user', type: ApplicationCommandOptionType.User, description: 'Utilizator', required: true }] 
    },
    { 
        name: 'timeout', 
        description: 'Pune un utilizator în timeout', 
        options: [
            { name: 'user', type: ApplicationCommandOptionType.User, description: 'Utilizator', required: true }, 
            { name: 'time', type: ApplicationCommandOptionType.Integer, description: 'Minute', required: true }
        ] 
    },
    { 
        name: 'untimeout', 
        description: 'Scoate un utilizator din timeout', 
        options: [{ name: 'user', type: ApplicationCommandOptionType.User, description: 'Utilizator', required: true }] 
    },
    { name: 'lock', description: 'Blochează canalul curent', options: [] },
    { name: 'unlock', description: 'Deblochează canalul curent', options: [] },
    { name: 'clear', description: 'Șterge mesaje', options: [{ name: 'amount', type: ApplicationCommandOptionType.Integer, description: 'Număr mesaje', required: true }] },
    { name: 'ticket', description: 'Trimite panoul pentru crearea tichetelor', options: [] }
];

client.once('ready', async () => {
    console.log(`\n✅ SUCCES: Conectat ca ${client.user.tag}\n`);
    try {
        const guild = await client.guilds.fetch(CONFIG.SERVER_ID);
        if (guild) {
            await guild.commands.set(commands);
            console.log('🎯 [SERVER] Comenzi slash reîncărcate cu succes!');
        }
    } catch (error) {
        console.error('❌ Eroare la reîncărcarea comenzilor:', error);
    }
});

// ==========================================
// HANDLER INTERACȚIUNI (COMENZI ȘI BUTOANE)
// ==========================================
client.on('interactionCreate', async interaction => {
    if (interaction.isChatInputCommand()) {
        const { commandName, options } = interaction;

        try {
            // 1. PANOU TICHETE ELEGANT
            if (commandName === 'ticket') {
                if (!interaction.member.roles.cache.has(CONFIG.OWNER_ROLE_ID) && !interaction.member.roles.cache.has(CONFIG.STAFF_ROLE_ID)) {
                    return interaction.reply({ content: '❌ Nu ai permisiunea!', ephemeral: true });
                }
                
                const panelEmbed = new EmbedBuilder()
                    .setTitle('🌟 Centru de Asistență VEX')
                    .setDescription('Bine ai venit la sistemul oficial de suport!\n\nSelectează categoria potraită nevoilor tale apăsând pe unul dintre butoanele de mai jos:\n\n🎁 **Claim Reward** - Pentru revendicarea premiilor.\n🛠️ **Suport** - Pentru întrebări, probleme sau raportări.\n🛒 **Purchase** - Pentru achiziții, donații și tranzacții.')
                    .setColor(0x2B2D31) 
                    .setImage('https://i.imgur.com/K1HMTf7.png') 
                    .setFooter({ text: 'Sistem Securizat de Tichete', iconURL: client.user.displayAvatarURL() });

                const row = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId('ticket_reward').setLabel('Claim Reward').setStyle(ButtonStyle.Success).setEmoji('🎁'),
                    new ButtonBuilder().setCustomId('ticket_support').setLabel('Suport').setStyle(ButtonStyle.Primary).setEmoji('🛠️'),
                    new ButtonBuilder().setCustomId('ticket_purchase').setLabel('Purchase').setStyle(ButtonStyle.Secondary).setEmoji('🛒')
                );

                return interaction.reply({ embeds: [panelEmbed], components: [row] });
            }

            // 2. LOCK & UNLOCK
            if (commandName === 'lock') {
                if (!interaction.member.permissions.has(PermissionFlagsBits.ManageChannels) && !interaction.member.roles.cache.has(CONFIG.OWNER_ROLE_ID)) return interaction.reply({ content: '❌ Nu ai permisiunea!', ephemeral: true });
                await interaction.channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: false });
                return interaction.reply({ content: `🔒 Canalul a fost blocat.` });
            }

            if (commandName === 'unlock') {
                if (!interaction.member.permissions.has(PermissionFlagsBits.ManageChannels) && !interaction.member.roles.cache.has(CONFIG.OWNER_ROLE_ID)) return interaction.reply({ content: '❌ Nu ai permisiunea!', ephemeral: true });
                await interaction.channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: null });
                return interaction.reply({ content: `🔓 Canalul a fost deblocat.` });
            }

            // 3. CLEAR
            if (commandName === 'clear') {
                if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages) && !interaction.member.roles.cache.has(CONFIG.OWNER_ROLE_ID) && !interaction.member.roles.cache.has(CONFIG.STAFF_ROLE_ID)) return interaction.reply({ content: '❌ Nu ai permisiunea!', ephemeral: true });
                const amount = options.getInteger('amount');
                if (amount < 1 || amount > 100) return interaction.reply({ content: '❌ Introdu un număr între 1 și 100!', ephemeral: true });
                
                await interaction.channel.bulkDelete(amount, true);
                return interaction.reply({ content: `✅ Am șters ${amount} mesaje.`, ephemeral: true });
            }

            // 4. MODERARE (KICK / BAN / TIMEOUT)
            const target = options.getMember('user');
            const reason = 'Fără motiv specificat';

            if (commandName === 'kick') {
                if (!interaction.member.permissions.has(PermissionFlagsBits.KickMembers) && !interaction.member.roles.cache.has(CONFIG.OWNER_ROLE_ID) && !interaction.member.roles.cache.has(CONFIG.STAFF_ROLE_ID)) return interaction.reply({ content: '❌ Nu ai permisiunea!', ephemeral: true });
                if (!target) return interaction.reply({ content: '❌ Membrul nu a fost găsit!', ephemeral: true });
                await target.kick(reason);
                return interaction.reply({ content: `✅ ${target.user.username} a fost dat afară.` });
            }

            if (commandName === 'ban') {
                if (!interaction.member.permissions.has(PermissionFlagsBits.BanMembers) && !interaction.member.roles.cache.has(CONFIG.OWNER_ROLE_ID)) return interaction.reply({ content: '❌ Nu ai permisiunea!', ephemeral: true });
                if (!target) return interaction.reply({ content: '❌ Membrul nu a fost găsit!', ephemeral: true });
                await target.ban({ reason });
                return interaction.reply({ content: `✅ ${target.user.username} a fost banat.` });
            }

            if (commandName === 'timeout') {
                if (!interaction.member.permissions.has(PermissionFlagsBits.ModerateMembers) && !interaction.member.roles.cache.has(CONFIG.OWNER_ROLE_ID) && !interaction.member.roles.cache.has(CONFIG.STAFF_ROLE_ID)) return interaction.reply({ content: '❌ Nu ai permisiunea!', ephemeral: true });
                if (!target) return interaction.reply({ content: '❌ Membrul nu a fost găsit!', ephemeral: true });
                const min = options.getInteger('time');
                await target.timeout(min * 60 * 1000, reason);
                return interaction.reply({ content: `✅ ${target.user.username} este în timeout.` });
            }

            if (commandName === 'untimeout') {
                if (!interaction.member.permissions.has(PermissionFlagsBits.ModerateMembers) && !interaction.member.roles.cache.has(CONFIG.OWNER_ROLE_ID) && !interaction.member.roles.cache.has(CONFIG.STAFF_ROLE_ID)) return interaction.reply({ content: '❌ Nu ai permisiunea!', ephemeral: true });
                if (!target) return interaction.reply({ content: '❌ Membrul nu a fost găsit!', ephemeral: true });
                await target.timeout(null);
                return interaction.reply({ content: `✅ Timeout scos pentru ${target.user.username}.` });
            }

        } catch (error) {
            console.error(`Eroare la comanda ${commandName}:`, error);
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({ content: '❌ A apărut o eroare la executarea acestei comenzi!', ephemeral: true }).catch(() => {});
            }
        }
    }

    // ==========================================
    // GESTIONARE OPERAȚIUNI BUTOANE (TICHETE)
    // ==========================================
    if (interaction.isButton()) {
        try {
            const { customId } = interaction;

            if (['ticket_reward', 'ticket_support', 'ticket_purchase'].includes(customId)) {
                await interaction.deferReply({ ephemeral: true });
                
                let categoryName = '';
                let welcomeMessage = '';

                if (customId === 'ticket_reward') {
                    categoryName = 'reward';
                    welcomeMessage = 'Ai deschis un tichet pentru **revendicarea unui premiu**! Te rugăm să trimiți dovezile necesare (screenshot/detalii) în acest chat.';
                } else if (customId === 'ticket_support') {
                    categoryName = 'suport';
                    welcomeMessage = 'Cum te putem ajuta? Te rugăm să descrii detaliat problema sau întrebarea ta, iar echipa îți va răspunde imediat.';
                } else if (customId === 'ticket_purchase') {
                    categoryName = 'purchase';
                    welcomeMessage = 'Dorești să faci o **achiziție** sau o donație? Lasă-ne scris ce anume te interesează și metoda de plată dorită.';
                }

                // Generare canal dedicat
                const ticketChannel = await interaction.guild.channels.create({
                    name: `🎫・${categoryName}-${interaction.user.username}`,
                    type: 0, 
                    permissionOverwrites: [
                        { id: interaction.guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
                        { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.AttachFiles, PermissionFlagsBits.EmbedLinks] },
                        { id: CONFIG.OWNER_ROLE_ID, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.AttachFiles] },
                        { id: CONFIG.STAFF_ROLE_ID, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.AttachFiles] }
                    ],
                });

                const welcomeEmbed = new EmbedBuilder()
                    .setTitle(`🎫 Tichet Nou | ${categoryName.toUpperCase()}`)
                    .setDescription(`Salutare ${interaction.user}!\n\n${welcomeMessage}\n\n*Pentru a închide această sesiune, folosește butonul de mai jos.*`)
                    .setColor(0x00FF00)
                    .setTimestamp();

                const closeRow = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId('close_ticket').setLabel('Închide Tichet').setStyle(ButtonStyle.Danger).setEmoji('🔒')
                );

                // Notificare prin ping direct către rolurile tale de Staff și Owner
                await ticketChannel.send({ 
                    content: `🔔 **Tichet deschis!** Mențiune Departament: <@&${CONFIG.STAFF_ROLE_ID}> <@&${CONFIG.OWNER_ROLE_ID}> (Utilizator: ${interaction.user})`, 
                    embeds: [welcomeEmbed], 
                    components: [closeRow] 
                });
                
                return interaction.editReply({ content: `✅ Tichetul tău a fost generat cu succes! Click aici: ${ticketChannel}` });
            }

            if (customId === 'close_ticket') {
                await interaction.reply({ content: '🔒 Acest tichet va fi șters definitiv în 5 secunde...' });
                setTimeout(() => interaction.channel.delete().catch(() => {}), 5000);
            }
        } catch (err) { console.error("Eroare la butoane:", err); }
    }
});

// Comanda help simplificată
client.on('messageCreate', async message => {
    if (message.author.bot || !message.content.startsWith('+')) return;
    const cmd = message.content.split(' ')[0].toLowerCase();
    
    if (cmd === '+help') {
        const helpEmbed = new EmbedBuilder()
            .setTitle('🤖 Sistem de Comenzi VEX')
            .setDescription('Toate funcțiile principale au fost mutate complet pe comenzi rapide tip **Slash (`/`)**:\n\n**/ticket** - Generează panoul avansat de asistență.\n**/lock & /unlock** - Securizează rapid canalul de chat curent.\n**/clear** - Curăță instant mesajele nedorite.');
        return message.reply({ embeds: [helpEmbed] });
    }
});

if (!process.env.TOKEN) {
    console.error("❌ Variabila de mediu 'TOKEN' lipsește!");
} else {
    client.login(process.env.TOKEN.replace(/['"]+/g, '').trim()).catch(err => console.error("❌ Eroare autentificare Discord:", err));
                }
            
