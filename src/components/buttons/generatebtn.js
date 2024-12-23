import PDFDocument from "pdfkit";
import QRCode from "qrcode";
import UserQuiz from "../../database/models/userSchema.js"; // Adjust the path as needed
import { PassThrough } from "stream";
import fs from "fs";
import path from "path";

const component = {
  customId: "generate-certificate",
  async execute(interaction) {
    const userId = interaction.user.id;
    const channel = interaction.channel;

    try {
      // Defer the reply to prevent interaction expiration
      await interaction.deferReply({ ephemeral: true });

      // Fetch user data from the database
      const userQuiz = await UserQuiz.findOne({ userId });

      if (!userQuiz || userQuiz.status !== "certificate_generated") {
        return interaction.editReply({
          content: "You are not eligible to generate a certificate.",
        });
      }

      // Use the username from the database
      const username = userQuiz.username;

      // Create a QR code for the URL
      const qrCodeUrl = `https://webapp-three-wine.vercel.app/user/${userId}`;
      const qrCodeImage = await QRCode.toDataURL(qrCodeUrl);

      // Path to the certificate template image
      const templatePath = path.resolve("./assets/certificate.png");
      if (!fs.existsSync(templatePath)) {
        throw new Error(
          `Certificate template not found at path: ${templatePath}`
        );
      }

      // Load the certificate template image
      const templateImage = fs.readFileSync(templatePath);

      // Create a PDF document with custom page size matching the template
      const doc = new PDFDocument({
        size: [1440, 1024], // Custom dimensions in points
        margin: 0,
      });
      const pdfStream = new PassThrough();
      doc.pipe(pdfStream);

      // Draw the certificate template
      doc.image(templateImage, 0, 0, { width: 1440, height: 1024 });

      // Set the custom font (Cormorant) for the name
      const cormorantFontPath = path.resolve(
        "./assets/fonts/Cormorant-Regular.ttf"
      );
      if (fs.existsSync(cormorantFontPath)) {
        doc.registerFont("Cormorant", cormorantFontPath);
      } else {
        console.warn("Cormorant font not found. Using default font.");
      }
      doc.font("Cormorant").fontSize(48).fillColor("#000000");

      // Add the user's name at the specified position
      const newUserName = username.toUpperCase()
      doc.text(newUserName, 119, 427, {
        width: 1040,
        height: 91,
      });

      // Add the QR code at the specified position
      const qrCodeBuffer = Buffer.from(
        qrCodeImage.replace(/^data:image\/png;base64,/, ""),
        "base64"
      );
      doc.image(qrCodeBuffer, 1030.42, 692.38, { width: 150 });

      // Finalize the PDF document
      doc.end();

      // Convert the PDF stream to a buffer
      const buffers = [];
      pdfStream.on("data", (chunk) => buffers.push(chunk));
      pdfStream.on("end", async () => {
        const pdfBuffer = Buffer.concat(buffers);

        try {
          // Send the certificate to the user's DM
          const dmChannel = await interaction.user.createDM();
          await dmChannel.send({
            content: "Here is your certificate! 🎉",
            files: [{ attachment: pdfBuffer, name: "certificate.pdf" }],
          });

          userQuiz.certificateGeneratedAt = Date.now();
          await userQuiz.save();

          await interaction.editReply({
            content: "Your certificate has been sent to your DMs! 📩",
          });

          // Schedule channel deletion
          setTimeout(async () => {
            if (channel.deletable) {
              await channel.delete("Certificate generation complete.");
            }
          }, 60000); // 1 minute delay
        } catch (dmError) {
          console.error("Error sending certificate via DM:", dmError);
          await interaction.editReply({
            content:
              "Could not send the certificate to your DMs. Please check your DM settings.",
          });
        }
      });

      pdfStream.on("error", async (streamError) => {
        console.error("Error with PDF stream:", streamError);
        await interaction.editReply({
          content:
            "An error occurred while generating your certificate. Please try again later.",
        });
      });
    } catch (error) {
      console.error("Error generating certificate:", error);
      await interaction.editReply({
        content:
          "An error occurred while generating your certificate. Please try again later.",
      });
    }
  },
};

export default component;
