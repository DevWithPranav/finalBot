import { Events, PermissionsBitField } from 'discord.js';
import errorHandler from './errCreate.js';

export default {
    name: Events.InteractionCreate,
    async execute(interaction, client) {
        try {
            if (interaction.isChatInputCommand()) {
                await handleCommand(interaction, client);
            } else if (interaction.isButton()) {
                await handleButton(interaction, client);
            } else if (interaction.isAnySelectMenu()) {
                await handleSelectMenu(interaction, client);
            } else if (interaction.isModalSubmit()) {
                await handleModalSubmit(interaction, client);
            }
        } catch (error) {
            console.error('Error handling interaction:', error);
            await errorHandler.execute(client, error, interaction.commandName || interaction.customId, interaction);
        }
    }
};

async function handleCommand(interaction, client) {
    const command = client.commands.get(interaction.commandName);
    if (!command) {
        console.error(`No command matching ${interaction.commandName} was found.`);
        return;
    }

    const missingPermissions = checkPermissions(interaction, command.requiredPermissions || []);
    if (missingPermissions.length > 0) {
        await sendErrorReply(interaction, `I am missing the following permissions to execute this command: ${missingPermissions.join(', ')}`);
        return;
    }

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(`Error executing command "${interaction.commandName}":`, error);
        await sendErrorReply(interaction, 'There was an error while executing this command.');
    }
}

async function handleButton(interaction, client) {
    const button = client.components.get(interaction.customId);
    if (!button) {
        console.error(`No button component matching ${interaction.customId} was found.`);
        return;
    }
    try {
        await button.execute(interaction);
    } catch (error) {
        console.error(`Error executing button "${interaction.customId}":`, error);
        await sendErrorReply(interaction, 'There was an error while processing your request.');
    }
}

async function handleSelectMenu(interaction, client) {
    const selectMenu = client.components.get(interaction.customId);
    if (!selectMenu) {
        console.error(`No select menu component matching ${interaction.customId} was found.`);
        return;
    }
    try {
        await selectMenu.execute(interaction);
    } catch (error) {
        console.error(`Error executing select menu "${interaction.customId}":`, error);
        await sendErrorReply(interaction, 'There was an error while processing your request.');
    }
}

async function handleModalSubmit(interaction, client) {
    const modal = client.components.get(interaction.customId);
    if (!modal) {
        console.error(`No modal component matching ${interaction.customId} was found.`);
        return;
    }
    try {
        await modal.execute(interaction);
    } catch (error) {
        console.error(`Error executing modal "${interaction.customId}":`, error);
        await sendErrorReply(interaction, 'There was an error while processing your request.');
    }
}

function checkPermissions(interaction, requiredPermissions) {
    const botMember = interaction.guild?.members?.me;
    if (!botMember) {
        console.error('Bot member object is not available in the guild.');
        return [];
    }

    return requiredPermissions.filter(
        perm => !botMember.permissions.has(PermissionsBitField.Flags[perm])
    );
}

async function sendErrorReply(interaction, message) {
    try {
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ content: message, ephemeral: true });
        } else {
            await interaction.reply({ content: message, ephemeral: true });
        }
    } catch (error) {
        console.error('Failed to send an error reply:', error);
    }
}
