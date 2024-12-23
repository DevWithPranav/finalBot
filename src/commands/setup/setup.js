import {
  SlashCommandBuilder,
  ChannelType,
  PermissionFlagsBits,
} from "discord.js";
import setup from "../../database/models/setupSchema.js";

export default {
  data: new SlashCommandBuilder()
    .setName("setup-quiz")
    .setDescription("Sets up the quiz category and log channel for the server.")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction) {
    try {
      const guildId = interaction.guild.id;
      const categoryName = "quiz";

      // Check if guild is already configured
      let guildData = await setup.findOne({ guildId });

      if (guildData) {
        let category = interaction.guild.channels.cache.get(guildData.categoryId);
        let logChannel = interaction.guild.channels.cache.get(guildData.logChannelId);

        // If the category is missing, recreate it
        if (!category) {
          category = await interaction.guild.channels.create({
            name: categoryName,
            type: ChannelType.GuildCategory,
          });

          guildData.categoryId = category.id; // Update database with the new category ID
        }

        // If the log channel is missing, recreate it
        if (!logChannel) {
          logChannel = await interaction.guild.channels.create({
            name: "quiz-log",
            type: ChannelType.GuildText,
            parent: category.id,
            permissionOverwrites: [
              {
                id: interaction.guild.roles.everyone.id,
                deny: [PermissionFlagsBits.SendMessages],
              },
            ],
          });

          guildData.logChannelId = logChannel.id; // Update database with the new log channel ID
        }

        // Save updated guild data
        await guildData.save();

        return interaction.reply({
          content: `Setup verified and updated if needed. Quiz category: **${category.name}**, Log channel: **${logChannel.name}**.`,
          ephemeral: true,
        });
      }

      // If not already configured, proceed with the full setup
      // Check if the category already exists
      let category = interaction.guild.channels.cache.find(
        (channel) =>
          channel.type === ChannelType.GuildCategory &&
          channel.name.toLowerCase() === categoryName.toLowerCase()
      );

      if (!category) {
        // Create the category if it doesn't exist
        category = await interaction.guild.channels.create({
          name: categoryName,
          type: ChannelType.GuildCategory,
        });
      }

      // Create the log channel
      const logChannel = await interaction.guild.channels.create({
        name: "quiz-log",
        type: ChannelType.GuildText,
        parent: category.id,
        permissionOverwrites: [
          {
            id: interaction.guild.roles.everyone.id,
            deny: [PermissionFlagsBits.SendMessages],
          },
        ],
      });

      // Save guild data to the database
      guildData = new setup({
        guildId,
        categoryId: category.id,
        logChannelId: logChannel.id,
      });

      await guildData.save();

      return interaction.reply({
        content: `Setup complete! Quiz category: **${category.name}**, Log channel: **${logChannel.name}**.`,
        ephemeral: true,
      });
    } catch (error) {
      console.error(error);
      return interaction.reply({
        content: "An error occurred while setting up the server.",
        ephemeral: true,
      });
    }
  },
};
