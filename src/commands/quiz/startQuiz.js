import {
  SlashCommandBuilder,
  ChannelType,
  PermissionFlagsBits,
  ButtonBuilder,
  ActionRowBuilder,
  ButtonStyle,
  EmbedBuilder,
} from "discord.js";
import UserQuiz from "../../database/models/userSchema.js";
import Setup from "../../database/models/setupSchema.js";

export default {
  data: new SlashCommandBuilder()
    .setName("start-quiz")
    .setDescription("Starts a quiz session for the user.")
    .addStringOption((option) =>
      option
        .setName("name")
        .setDescription("Enter your full name")
        .setRequired(true)
    ),
  async execute(interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });
      const guildId = interaction.guild.id;
      const userId = interaction.user.id;
      const username = interaction.options.getString("name");

      // Check if the server is set up
      let guildSetup = await Setup.findOne({ guildId });
      if (!guildSetup) {
        return interaction.editReply({
          content:
            "The server is not set up. Please run the `/setup-quiz` command first.",
          ephemeral: true,
        });
      }

      const { categoryId, logChannelId } = guildSetup;

      // Check if category and log channel exist
      let category = interaction.guild.channels.cache.get(categoryId);
      let logChannel = interaction.guild.channels.cache.get(logChannelId);

      if (!category) {
        category = await interaction.guild.channels.create({
          name: "quiz",
          type: ChannelType.GuildCategory,
        });
        guildSetup.categoryId = category.id;
      }

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
        guildSetup.logChannelId = logChannel.id;
      }

      // Update the database with new category and log channel IDs if needed
      await guildSetup.save();

      // Check user's quiz status in the database
      let userQuiz = await UserQuiz.findOne({ userId });

      if (userQuiz) {
        if (userQuiz.status === "started") {
          // Check if the quiz channel exists in the server
          let quizChannel = interaction.guild.channels.cache.get(
            userQuiz.quizChannelId
          );

          if (!quizChannel) {
            // Recreate the quiz channel if it was deleted
            quizChannel = await interaction.guild.channels.create({
              name: `quiz-${username}`,
              type: ChannelType.GuildText,
              parent: category.id,
              permissionOverwrites: [
                {
                  id: interaction.guild.roles.everyone.id,
                  deny: [PermissionFlagsBits.ViewChannel],
                },
                {
                  id: userId,
                  allow: [
                    PermissionFlagsBits.ViewChannel,
                    PermissionFlagsBits.SendMessages,
                  ],
                },
              ],
            });

            userQuiz.quizChannelId = quizChannel.id;
            await userQuiz.save();

            const embed = new EmbedBuilder()
              .setTitle("Quiz Channel Restored")
              .setDescription(
                `Your quiz channel was missing and has been recreated: ${quizChannel}`
              )
              .setColor("Yellow");

            await logChannel.send({
              embeds: [embed],
            });

            const startButton = new ButtonBuilder()
              .setCustomId("start-quiz-session")
              .setLabel("Start Quiz")
              .setStyle(ButtonStyle.Primary);

            const cancelButton = new ButtonBuilder()
              .setCustomId("cancel-quiz-session")
              .setLabel("Cancel")
              .setStyle(ButtonStyle.Danger);

            const actionRow = new ActionRowBuilder().addComponents(
              startButton,
              cancelButton
            );

            // Notify the user in the restored channel
            await quizChannel.send({
              content:
                "Your quiz channel has been restored! Please read the guidelines and continue your quiz session.",
              components: [actionRow],
            });

            return interaction.editReply({
              content: `Your quiz session channel was missing and has been recreated! Check out ${quizChannel} to continue.`,
              ephemeral: true,
            });
          }

          return interaction.editReply({
            content: `You already have a quiz session started in ${quizChannel}.`,
            ephemeral: true,
          });
        } else if (userQuiz.status === "certificate_generated") {
          try {
            const btn = new ButtonBuilder()
              .setCustomId("generate-certificate")
              .setLabel("generate again")
              .setStyle(ButtonStyle.Success);

            const row = new ActionRowBuilder().addComponents(btn)
            await interaction.user.send({
              content:
                "Your quiz task has been completed, and a certificate has been generated. Congratulations!",
                components: [row],
            });
          } catch (error) {
            console.error("Could not send DM to the user:", error);
          }

          return interaction.editReply({
            content: "Your quiz task is already completed. Congratulations!",
            ephemeral: true,
          });
        }
      }

      // Create a new quiz channel and update the database
      const quizChannel = await interaction.guild.channels.create({
        name: `quiz-${username}`,
        type: ChannelType.GuildText,
        parent: category.id,
        permissionOverwrites: [
          {
            id: interaction.guild.roles.everyone.id,
            deny: [PermissionFlagsBits.ViewChannel],
          },
          {
            id: userId,
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.SendMessages,
            ],
          },
        ],
      });

      userQuiz = new UserQuiz({
        userId,
        username,
        quizChannelId: quizChannel.id,
        status: "started",
      });
      await userQuiz.save();

      // Send quiz guidelines with buttons
      const startButton = new ButtonBuilder()
        .setCustomId("start-quiz-session")
        .setLabel("Start Quiz")
        .setStyle(ButtonStyle.Primary);

      const cancelButton = new ButtonBuilder()
        .setCustomId("cancel-quiz-session")
        .setLabel("Cancel")
        .setStyle(ButtonStyle.Danger);

      const actionRow = new ActionRowBuilder().addComponents(
        startButton,
        cancelButton
      );

      await quizChannel.send({
        content:
          "Welcome to your quiz session! Please read the guidelines below and click 'Start Quiz' to begin or 'Cancel' to exit.",
        components: [actionRow],
      });

      // Log the quiz session creation
      const embed = new EmbedBuilder()
        .setTitle("New Quiz Session Created")
        .setDescription(`A quiz session has been created by **${username}**.`)
        .setColor("Green")
        .setTimestamp();

      await logChannel.send({
        embeds: [embed],
      });

      return interaction.editReply({
        content: `Your quiz session has been created! Check out ${quizChannel} to get started.`,
        ephemeral: true,
      });
    } catch (error) {
      console.error(error);
      return interaction.editReply({
        content: "An error occurred while starting the quiz session.",
        ephemeral: true,
      });
    }
  },
};
