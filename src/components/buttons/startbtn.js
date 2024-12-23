import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  StringSelectMenuBuilder,
} from "discord.js";
import UserQuiz from "../../database/models/userSchema.js";
import Question from "../../database/models/QestionsShema.js";

const component = {
  customId: "start-quiz-session",
  async execute(interaction) {
    if (!interaction.isButton()) return;

    const userId = interaction.user.id;
    const username = interaction.user.tag;
    const quizChannelId = interaction.channel.id;
    const channel = interaction.channel;
    const logChannel = interaction.guild.channels.cache.find(
      (ch) => ch.name === "quiz-log"
    );

    // Disable the start button
    const originalMessage = await interaction.message.fetch();
    const updatedActionRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("start-quiz-session")
        .setLabel("Start Quiz")
        .setStyle(ButtonStyle.Success)
        .setDisabled(true)
    );
    await originalMessage.edit({ components: [updatedActionRow] });

    // Get total questions from database
    const totalQuestions = await Question.countDocuments();
    
    if (totalQuestions === 0) {
      return interaction.reply({
        content: "No questions available in the database.",
        ephemeral: true,
      });
    }

    await interaction.reply({
      content: `The quiz is starting! You will have 15 minutes to answer ${totalQuestions} questions.`,
      ephemeral: true,
    });

    // Get random questions from database
    const questions = await Question.aggregate([
      { $sample: { size: totalQuestions } }
    ]);

    let score = 0;
    let questionIndex = 0;
    const userAnswers = [];

    const startTime = Date.now();
    const endTime = startTime + 15 * 60 * 1000;

    let userQuiz = await UserQuiz.findOne({ userId });

    if (userQuiz) {
      if (userQuiz.status === "certificate_generated") {
        return interaction.followUp({
          content: "You have already completed the quiz.",
          ephemeral: true,
        });
      }
      // Reset for a new session
      userQuiz.status = "started";
      userQuiz.questions = [];
      userQuiz.quizChannelId = quizChannelId;
      await userQuiz.save();
    } else {
      userQuiz = await UserQuiz.create({
        userId,
        username,
        quizChannelId,
        status: "started",
        questions: [],
      });
    }

    const askQuestion = async () => {
      // Check if quiz should end
      if (questionIndex >= questions.length || Date.now() >= endTime) {
        const status = score >= Math.ceil(totalQuestions * 0.75) ? "certificate_generated" : "pending";

        await UserQuiz.updateOne(
          { userId },
          {
            $set: { status, score },
            $push: { questions: { $each: userAnswers } },
          }
        );

        const resultEmbed = new EmbedBuilder()
          .setColor(status === "certificate_generated" ? 0x1d4ed8 : 0xff0000)
          .setTitle(`Quiz Results`)
          .addFields(
            { name: "Score", value: `${score}/${questions.length}` },
            { name: "Required to Pass", value: `${Math.ceil(totalQuestions * 0.75)}/${questions.length}` },
            ...userAnswers.map((ans, idx) => ({
              name: `Q${idx + 1}: ${ans.questionText}`,
              value: `Selected: ${ans.selectedAnswer}\nCorrect: ${
                ans.isCorrect ? "✅" : "❌"
              }`,
            }))
          )
          .setTimestamp();

        if (status === "certificate_generated") {
          const certButton = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId("generate-certificate")
              .setLabel("Generate Certificate")
              .setStyle(ButtonStyle.Primary)
          );
          await channel.send({
            content: `🎉 Congratulations! You scored ${score}/${totalQuestions}. You've passed the quiz!`,
            embeds: [resultEmbed],
            components: [certButton],
          });
          
          if (logChannel) {
            await logChannel.send({
              content: `Quiz passed by ${username}.`,
              embeds: [resultEmbed],
            });
          }
        } else {
          try {
            // Send DM to user with results
            await interaction.user.send({
              content: `Quiz failed. You scored ${score}/${totalQuestions}. You needed ${Math.ceil(totalQuestions * 0.75)} correct answers to pass. Better luck next time!`,
              embeds: [resultEmbed],
            });

            // Log the failed attempt if log channel exists
            if (logChannel) {
              await logChannel.send({
                content: `Quiz failed by ${username}. Channel will be deleted.`,
                embeds: [resultEmbed],
              });
            }

            // Send a message to the channel before deletion
            await channel.send({
              content: "Quiz failed. This channel will be deleted in 10 seconds. Results have been sent to your DMs.",
              ephemeral: false,
            });

            // Wait 10 seconds before deleting the channel
            setTimeout(async () => {
              try {
                await channel.delete();
              } catch (error) {
                console.error("Error deleting channel:", error);
                if (logChannel) {
                  await logChannel.send({
                    content: `Failed to delete channel for failed quiz by ${username}. Error: ${error.message}`,
                  });
                }
              }
            }, 10000);

          } catch (error) {
            console.error("Error handling failed quiz:", error);
            
            // If DM fails, send results to channel before deletion
            if (error.message.includes("Cannot send messages to this user")) {
              await channel.send({
                content: "Unable to send results via DM. Please enable DMs from server members to receive your results. Channel will be deleted in 30 seconds.",
                embeds: [resultEmbed],
              });
              
              // Wait longer before deleting the channel
              setTimeout(async () => {
                try {
                  await channel.delete();
                } catch (deleteError) {
                  console.error("Error deleting channel:", deleteError);
                }
              }, 30000);
            }
          }
        }
        return;
      }

      const currentQuestion = questions[questionIndex];
      const questionEmbed = new EmbedBuilder()
        .setColor(0x1d4ed8)
        .setTitle(`Question ${questionIndex + 1} of ${totalQuestions}`)
        .setDescription(currentQuestion.questionText)
        .setFooter({ 
          text: `Time remaining: ${Math.ceil((endTime - Date.now()) / 60000)} minutes` 
        });

      const selectMenu = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId(`quiz-question-${questionIndex}`)
          .setPlaceholder("Choose your answer")
          .addOptions(
            currentQuestion.options.map((option, index) => ({
              label: option,
              value: String(index),
            }))
          )
      );

      const questionMessage = await channel.send({
        embeds: [questionEmbed],
        components: [selectMenu],
      });

      try {
        const filter = (i) =>
          i.customId === `quiz-question-${questionIndex}` && i.user.id === userId;
        const collector = channel.createMessageComponentCollector({
          filter,
          componentType: ComponentType.StringSelect,
          time: Math.min(60000, endTime - Date.now()), // 1 minute per question or remaining time
          max: 1 // Only collect one answer
        });

        collector.on("collect", async (menuInteraction) => {
          const selectedAnswer = parseInt(menuInteraction.values[0], 10);
          const isCorrect = selectedAnswer === currentQuestion.correctAnswer;
          if (isCorrect) score++;

          userAnswers.push({
            questionText: currentQuestion.questionText,
            selectedAnswer: currentQuestion.options[selectedAnswer],
            isCorrect,
          });

          await menuInteraction.reply({
            content: isCorrect ? "✅ Correct answer!" : "❌ Incorrect answer.",
            ephemeral: true,
          });

          questionIndex++;
          await questionMessage.delete();
          askQuestion();
        });

        collector.on("end", async (collected, reason) => {
          if (reason === "time" && collected.size === 0) {
            userAnswers.push({
              questionText: currentQuestion.questionText,
              selectedAnswer: "No answer",
              isCorrect: false,
            });

            await channel.send({
              content: `⏰ Time's up for question ${questionIndex + 1}!`,
              ephemeral: true,
            });

            questionIndex++;
            await questionMessage.delete();
            askQuestion();
          }
        });
      } catch (error) {
        console.error("Error in question collector:", error);
        await channel.send("There was an error processing the question. Moving to the next one.");
        questionIndex++;
        askQuestion();
      }
    };

    askQuestion();
  },
};

export default component;