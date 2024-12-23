import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  StringSelectMenuBuilder,
} from "discord.js";
import UserQuiz from "../../database/models/userSchema.js";

const cancelComponent = {
  customId: "cancel-quiz-session",
  async execute(interaction) {
    if (!interaction.isButton()) return;

    const userId = interaction.user.id;
    const username = interaction.user.tag;
    const channel = interaction.channel;
    const logChannel = interaction.guild.channels.cache.find(
      (ch) => ch.name === "quiz-log"
    );

    try {
      // Update user quiz status to "pending"
      let userQuiz = await UserQuiz.findOne({ userId });

      if (userQuiz) {
        userQuiz.status = "pending";
        await userQuiz.save();
      } else {
        return interaction.reply({
          content: "No active quiz session found to cancel.",
          ephemeral: true,
        });
      }

      // Send DM to the user
      try {
        await interaction.user.send({
          content:
            "Your quiz session has been canceled. You can restart the quiz anytime.",
        });
      } catch (error) {
        console.error("Failed to send DM to the user:", error.message);
      }

      // Send log message to log channel
      if (logChannel) {
        await logChannel.send({
          content: `Quiz session canceled by ${username}.`,
        });
      }

      // Inform the user in the quiz channel
      await interaction.reply({
        content:
          "Your quiz session has been canceled. You can close this channel.",
        ephemeral: true,
      });

      // Optionally, delete the quiz channel after a delay
      setTimeout(async () => {
        try {
          await channel.delete();
        } catch (error) {
          console.error("Error deleting channel:", error.message);
          if (logChannel) {
            await logChannel.send({
              content: `Failed to delete quiz channel for ${username}. Error: ${error.message}`,
            });
          }
        }
      }, 10000); // Wait 10 seconds before deleting the channel
    } catch (error) {
      console.error("Error handling cancel button:", error.message);
      await interaction.reply({
        content:
          "An error occurred while canceling the quiz session. Please try again later.",
        ephemeral: true,
      });
    }
  },
};

export default cancelComponent;
