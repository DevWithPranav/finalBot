import { REST, Routes } from 'discord.js';
import dotenv from 'dotenv';
dotenv.config();
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const commands = [];
const foldersPath = path.resolve(__dirname, '..', '..', 'commands'); // Adjust the path to be absolute

const loadCommands = async () => {
    try {
        if (!fs.existsSync(foldersPath)) {
            throw new Error(`The commands folder does not exist at path: ${foldersPath}`);
        }

        const commandFolders = fs.readdirSync(foldersPath);

        for (const folder of commandFolders) {
            const commandsPath = path.join(foldersPath, folder);
            if (!fs.lstatSync(commandsPath).isDirectory()) {
                console.warn(`[WARNING] Skipping ${commandsPath} as it is not a directory.`);
                continue;
            }

            const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

            for (const file of commandFiles) {
                const filePath = path.join(commandsPath, file);
                try {
                    const command = await import(pathToFileURL(filePath).href);
                    if ('default' in command) {
                        const cmds = command.default;
                        if ('data' in cmds && 'execute' in cmds) {
                            commands.push(cmds.data.toJSON());
                        } else {
                            console.warn(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
                        }
                    } else {
                        console.warn(`[WARNING] The command at ${filePath} does not have a default export.`);
                    }
                } catch (importError) {
                    console.error(`[ERROR] Failed to import command at ${filePath}: ${importError.message}`);
                }
            }
        }
    } catch (error) {
        console.error(`[ERROR] Failed to load commands: ${error.message}`);
        process.exit(1); // Exit the process if a critical error occurs
    }
};

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

const refreshCommands = async () => {
    await loadCommands();
    try {
        console.log('System'.cyan, '>>'.blue, `Started refreshing ${commands.length} application (/) commands.`.green);

        await rest.put(
            Routes.applicationCommands(process.env.DISCORD_ID),
            { body: commands }
        );
        console.log('System'.cyan, '>>'.blue, `Successfully reloaded ${commands.length} application (/) commands.`.green);
    } catch (error) {
        console.error(`[ERROR] Failed to refresh application commands: ${error.message}`);
    }
};

await refreshCommands();
