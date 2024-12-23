import mongoose from "mongoose";

// Schema for storing guild setup information
const setupSchema = new mongoose.Schema({
  guildId: {
    type: String,
    required: true,
  },
  categoryId: {
    type: String,
    required: true,
  },
  logChannelId: {
    type: String,
    required: true,
  },
});

// Models
const Setup = mongoose.model("Setup", setupSchema);
export default Setup;
