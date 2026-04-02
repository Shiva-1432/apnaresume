const { GoogleGenerativeAI } = require('@google/generative-ai');

// Use a singleton pattern to ensure we only have one instance of the AI provider
let genAI;

function getGenAI() {
  if (!genAI) {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not defined in environment variables');
    }
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
  return genAI;
}

function getGeminiModel(modelName = 'gemini-pro') {
  const provider = getGenAI();
  return provider.getGenerativeModel({ model: modelName });
}

module.exports = {
  getGenAI,
  getGeminiModel
};