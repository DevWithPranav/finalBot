import Question from "../models/QestionsShema.js";

// Function to preload questions into the database
const preloadQuestions = async () => {
  const questions = [
    {
      questionText:
        "What is one of the defining characteristics of entrepreneurs?",
      options: [
        "Avoiding challenges",
        "Unwavering resilience and determination",
        "Preferring stability over risks",
        "Delegating responsibilities",
      ],
      correctAnswer: 1,
    },
    {
      questionText:
        "In the Business Inspiration Speech by Mathew Joseph - Fresh to Home, Mathew Joseph estimated market of seafood business in 2012 as",
      options: [
        "10 billion dollars",
        "25 billion dollars",
        "50 billion dollars",
        "75 billion dollars",
      ],
      correctAnswer: 2,
    },
    {
      questionText:
        "According to the Module, what is crucial for students to effectively learn an entrepreneurial mindset?",
      options: [
        "Reading business books",
        "Experiential learning",
        "Learning from businesses failures",
        "Following a traditional career path",
        "option A,B,C",
      ],
      correctAnswer: 4,
    },
    {
      questionText:
        "Entrepreneurship helps individuals develop which of the following skills?",
      options: [
        "Narrow thinking",
        "Creativity and problem-solving",
        "Avoidance of risk",
        "Specialisation in one area only",
      ],
      correctAnswer: 1,
    },
    {
      questionText:
        "Which professional could apply an entrepreneurial mindset by finding creative ways to deliver schemes to people?",
      options: [
        "Engineers",
        "Artists",
        "Administrative officers",
        "Entrepreneurs",
        "All of the above"
      ],
      correctAnswer: 4,
    },
    {
      questionText:
        "What is defined as the ability to keep trying again and again with patience, determination, courage, and positivity?",
      options: ["Communication", "Grit", "Collaboration", "Critical Thinking"],
      correctAnswer: 1,
    },
    {
      questionText:
        "Which skill focuses on expressing one’s views verbally and non-verbally, and listening to others?",
      options: [
        "Creative Thinking",
        "Collaboration",
        "Communication",
        "Self-Awareness",
      ],
      correctAnswer: 2,
    },
    {
      questionText:
        "Which skill is necessary for active participation in group activities?",
      options: [
        "Communication",
        "Collaboration",
        "Grit",
        "Independent Thinking",
        "option A & B"
      ],
      correctAnswer: 4, // Correct answers are both Communication and Collaboration
    },
    {
      questionText: "What is critical thinking defined as?",
      options: [
        "Willingness to try unfamiliar processes",
        "Analyzing both positive and negative aspects of work",
        "Developing creative solutions",
        "Working independently without relying on others",
      ],
      correctAnswer: 1,
    },
    {
      questionText:
        "What does independent thinking encourage individuals to do?",
      options: [
        "Take others' ideas as they are",
        "Work collaboratively in groups",
        "Create their own thinking instead of adopting others' ideas",
        "Avoid taking risks",
      ],
      correctAnswer: 2,
    },
    {
      questionText: "Trying new things involves:",
      options: [
        "Expressing one’s views verbally and non-verbally",
        "Accepting change and unfamiliar processes",
        "Objectively analysing work",
        "Reflecting on past experiences",
      ],
      correctAnswer: 1,
    },
    {
      questionText:
        "Which step involves identifying business ideas that align with one's skills and desires?",
      options: [
        "Preparing the Business Plan",
        "Finding Desirable Ideas",
        "Finalizing the Idea",
        "Securing Funding",
      ],
      correctAnswer: 1,
    },
    {
      questionText:
        "What is the purpose of subjecting ideas to study and evaluation?",
      options: [
        "To create a business plan",
        "To check market feasibility and success possibilities",
        "To secure funding",
        "To finalize the business name",
      ],
      correctAnswer: 1,
    },
    {
      questionText:
        "What are the key factors used to select the best business ideas?",
      options: [
        "Desirability, Feasibility, Viability",
        "Profitability, Growth Rate, Popularity",
        "Business Name, Logo, Marketing Strategy",
        "Capital Structure, Registration, Permits",
      ],
      correctAnswer: 0,
    },
    {
      questionText: "When should an entrepreneur finalize their business idea?",
      options: [
        "After creating the business plan",
        "After market evaluation and gathering information",
        "After securing financial assistance",
        "After getting expert advice",
      ],
      correctAnswer: 1,
    },
    {
      questionText: "What is the main purpose of creating a business plan?",
      options: [
        "To decide the business name",
        "To outline business goals, market evaluation, and financial models",
        "To understand market demand",
        "To register the business",
      ],
      correctAnswer: 1,
    },
    {
      questionText:
        "Which step involves securing loans, subsidies, and other financial assistance for the business?",
      options: [
        "Creating a Business Plan",
        "Securing Funding",
        "Selecting the Business Name",
        "Registering the Business",
      ],
      correctAnswer: 1,
    },
    {
      questionText:
        "What is the first step in Sixteen Steps to Entrepreneurship?",
      options: [
        "Selecting the business name",
        "Identify Your Passions and Suitable Ideas",
        "Preparing the Business Plan",
        "Finalizing the Idea",
      ],
      correctAnswer: 1,
    },
  ];

  try {
    await Question.insertMany(questions);
    console.log("Questions preloaded successfully.");
  } catch (error) {
    console.error("Error preloading questions:", error);
  }
};

export default preloadQuestions;
