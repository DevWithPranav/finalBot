import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import generator from 'generate-password';

export default {
    name: "errorHandler",
    async execute(client, err, command, interaction) {
        console.error('Error occurred:', err);
        console.error('Stack trace:', err.stack);

        const password = generator.generate({
            length: 10,
            numbers: true,
        });

        const errorEmbed = new EmbedBuilder()
            .setTitle(`🚨・Error: ${password}`)
            .addFields(
                { name: "✅┇Guild", value: `${interaction.guild?.name || 'Unknown'} (${interaction.guild?.id || 'N/A'})` },
                { name: `💻┇Command`, value: `${command}` },
                { name: `💬┇Error`, value: `\`\`${err.message}\`\`` },
                { name: `📃┇Stack error`, value: `\`\`${err.stack?.substr(0, 1018) || 'No stack trace available'}\`\`` }
            )
            .setColor('Red')
            .setTimestamp();

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setLabel("Support server")
                    .setURL('https://discord.gg/wqAfJVN9hZ')
                    .setStyle(ButtonStyle.Link)
            );

        const userErrorEmbed = new EmbedBuilder()
            .setTitle(`Error`)
            .setDescription(`There was an error executing this command.`)
            .setColor('Red')
            .addFields(
                { name: `Error code`, value: `\`${password}\``, inline: true },
                { name: `What now?`, value: `You can contact the developers by joining the support server.`, inline: true }
            );

        try {
            await interaction.editReply({
                embeds: [userErrorEmbed],
                components: [row],
                ephemeral: true,
            });
        } catch (editError) {
            console.warn('Failed to edit reply:', editError.message);
            try {
                await interaction.followUp({
                    embeds: [userErrorEmbed],
                    components: [row],
                    ephemeral: true,
                });
            } catch (followUpError) {
                console.error('Failed to send follow-up message:', followUpError.message);
            }
        }

        // Optional: Log to a dedicated error logging channel
        const errorChannelId = client.config?.channels?.errorLogs;
        if (errorChannelId) {
            const errorChannel = client.channels.cache.get(errorChannelId);
            if (errorChannel?.isTextBased()) {
                try {
                    await errorChannel.send({ embeds: [errorEmbed] });
                } catch (channelError) {
                    console.error('Failed to send error log to the channel:', channelError.message);
                }
            } else {
                console.warn(`Error logging channel (${errorChannelId}) is not accessible or not a text channel.`);
            }
        }
    },
};
