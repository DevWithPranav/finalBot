import mongoose from "mongoose";

// Schema for storing user quiz data
const userQuizSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
  },
  username: {
    type: String,
    required: true,
  },
  quizChannelId: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ["started", "pending", "certificate_generated"],
    default: "pending",
  },
  certificateGeneratedAt: {
    type: Date, // Store the timestamp of certificate generation
    default: null, // Default value is null when the certificate hasn't been generated
  },
  questions: [
    {
      questionText: String,
      selectedAnswer: String,
      isCorrect: Boolean,
    },
  ],
});

const UserQuiz = mongoose.model("UserQuiz", userQuizSchema);

export default UserQuiz;
