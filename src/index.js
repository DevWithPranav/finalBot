import { Client, Collection, GatewayIntentBits, Partials } from 'discord.js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { config } from 'dotenv';
import colors from 'colors';
import { connectToDb, closeDb } from './database/connect.js';
import logger from './logger.js';
// import preloadQuestions from './database/functions/preloadQestions.js'


config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const client = new Client({
    allowedMentions: {
        parse: ['users', 'roles'],
        repliedUser: true
    },
    shards: 'auto',
    partials: [
        Partials.Channel,
        Partials.GuildMember,
        Partials.Message,
        Partials.Reaction,
        Partials.User,
        Partials.GuildScheduledEvent
    ],
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildBans,
        GatewayIntentBits.GuildEmojisAndStickers,
        GatewayIntentBits.GuildIntegrations,
        GatewayIntentBits.GuildWebhooks,
        GatewayIntentBits.GuildInvites,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildMessageTyping,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.DirectMessageReactions,
        GatewayIntentBits.DirectMessageTyping,
        GatewayIntentBits.GuildScheduledEvents,
        GatewayIntentBits.MessageContent
    ],
    restTimeOffset: 0
});

client.commands = new Collection();
client.components = new Collection();

const loadCommands = async () => {
    console.log('System'.cyan, '>>'.blue, 'Loading Slash Commands...'.green);
    const foldersPath = path.join(__dirname, 'commands');
    const commandFolders = fs.readdirSync(foldersPath);

    for (const folder of commandFolders) {
        const commandsPath = path.join(foldersPath, folder);
        const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

        for (const file of commandFiles) {
            const filePath = path.join(commandsPath, file);
            try {
                const command = await import(pathToFileURL(filePath).href);

                if ('default' in command) {
                    const cmds = command.default;

                    if ('data' in cmds && 'execute' in cmds) {
                        client.commands.set(cmds.data.name, cmds);
                    } else {
                        console.log('System'.cyan, '>>'.blue, '⚠️ [WARNING]'.yellow, `Command file ${filePath} is missing "data" or "execute".`.yellow);
                    }
                }
            } catch (err) {
                logger.error(`Failed to load command at ${filePath}:`, err);
            }
        }
    }
    console.log('System'.cyan, '>>'.blue, 'Slash Commands Loaded'.green);
    console.log(`\u001b[0m`);
};

const loadEvents = async () => {
    console.log('System'.cyan, '>>'.blue, 'Loading Events...'.green);
    const foldersPath = path.join(__dirname, 'events');
    const eventFolders = fs.readdirSync(foldersPath);

    for (const folder of eventFolders) {
        const eventPath = path.join(foldersPath, folder);
        const eventFiles = fs.readdirSync(eventPath).filter(file => file.endsWith('.js'));

        for (const file of eventFiles) {
            const filePath = path.join(eventPath, file);
            try {
                const event = await import(pathToFileURL(filePath).href);

                if ('default' in event) {
                    const evt = event.default;
                    if (evt.once) {
                        console.log(`Registering event ${evt.name} to run once.`);
                        client.once(evt.name, (...args) => evt.execute(...args, client));
                    } else {
                        console.log(`Registering event ${evt.name} to run on every occurrence.`);
                        client.on(evt.name, (...args) => evt.execute(...args, client));
                    }
                } else {
                    console.log('System'.cyan, '>>'.blue, '⚠️ [WARNING]'.yellow, `Event file ${filePath} does not have a default export.`.yellow);
                }
            } catch (err) {
                logger.error(`Failed to load event at ${filePath}:`, err);
            }
        }
    }
    console.log('System'.cyan, '>>'.blue, 'Events Loaded'.green);
    console.log(`\u001b[0m`);
};

const loadComponents = async () => {
    console.log('System'.cyan, '>>'.blue, 'Loading Components...'.green);
    const foldersPath = path.join(__dirname, 'components');
    const componentFolders = fs.readdirSync(foldersPath);

    for (const folder of componentFolders) {
        const componentsPath = path.join(foldersPath, folder);
        const componentFiles = fs.readdirSync(componentsPath).filter(file => file.endsWith('.js'));

        for (const file of componentFiles) {
            const filePath = path.join(componentsPath, file);
            try {
                const component = await import(pathToFileURL(filePath).href);

                if ('default' in component) {
                    const cmp = component.default;

                    if ('customId' in cmp && 'execute' in cmp) {
                        client.components.set(cmp.customId, cmp);
                    } else {
                        console.log('System'.cyan, '>>'.blue, '⚠️ [WARNING]'.yellow, `Component file ${filePath} is missing "customId" or "execute".`.yellow);
                    }
                }
            } catch (err) {
                logger.error(`Failed to load component at ${filePath}:`, err);
            }
        }
    }
    console.log('System'.cyan, '>>'.blue, 'Components Loaded'.green);
    console.log(`\u001b[0m`);
};

const loadHandlers = async () => {
    console.log('System'.cyan, '>>'.blue, 'Loading Handlers...'.green);
    const foldersPath = path.join(__dirname, 'handlers');
    const handlersFolders = fs.readdirSync(foldersPath);

    for (const folder of handlersFolders) {
        const handlersPath = path.join(foldersPath, folder);
        const handlersFiles = fs.readdirSync(handlersPath).filter(file => file.endsWith('.js'));

        for (const file of handlersFiles) {
            const filePath = path.join(handlersPath, file);
            try {
                const fileURL = pathToFileURL(filePath).toString();
                await import(fileURL);
            } catch (err) {
                logger.error(`Failed to load handler at ${filePath}:`, err);
            }
        }
    }
    console.log('System'.cyan, '>>'.blue, 'Handlers Loaded'.green);
    console.log(`\u001b[0m`);
};

const startBot = async () => {
    try {
        console.log('System'.cyan, '>>'.blue, 'BOT Starting up.....'.green);
        console.log(`\u001b[0m`);
        console.log('© Echo PVT | 2024 - 2024'.red);
        console.log('All rights reserved'.red);
        console.log('System'.cyan, '>>'.blue, 'VERSION 1.00.00'.red, 'Loaded'.green);
        console.log(`\u001b[0m`);

        await loadCommands();
        await loadHandlers();
        await loadEvents();
        await loadComponents();
        await connectToDb();
        // await preloadQuestions()

        client.login(process.env.DISCORD_TOKEN).catch((error) => {
            logger.error('Error logging in:', error);
            process.exit(1);
        });

        process.on('SIGINT', async () => {
            console.log('System'.cyan, '>>'.blue, 'SIGINT signal received:'.red, 'shutting down.'.green);
            try {
                await closeDb();
                await client.destroy();
            } catch (error) {
                logger.error('Error during shutdown:', error);
            } finally {
                process.exit(0);
            }
        });

        process.on('SIGTERM', async () => {
            console.log('System'.cyan, '>>'.blue, 'SIGTERM signal received:'.red, 'shutting down.'.green);
            try {
                await closeDb();
                await client.destroy();
            } catch (error) {
                logger.error('Error during shutdown:', error);
            } finally {
                process.exit(0);
            }
        });

    } catch (error) {
        logger.error('Error starting bot:', error);
        process.exit(1);
    }
};

startBot();

process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection:', { promise, reason });
    if (reason instanceof Error) {
        logger.error('Stack Trace:', reason.stack);
    }
});

process.on('warning', (warn) => {
    logger.warn('Warning:', warn);
});

process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
    process.exit(1);
});
