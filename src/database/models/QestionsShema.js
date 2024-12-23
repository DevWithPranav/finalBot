import mongoose from "mongoose";

// Schema for storing questions
const questionSchema = new mongoose.Schema({
  questionText: {
    type: String,
    required: true,
  },
  options: {
    type: [String], // Array of strings for options
    validate: [
      (options) => options.length === 5,
      "Options array must contain exactly 4 items.",
    ],
    required: true,
  },
  correctAnswer: {
    type: Number, // Index of the correct answer (0-3)
    required: true,
    min: 0,
    max: 4,
  },
});

const Question = mongoose.model("Question", questionSchema);
export default Question;
