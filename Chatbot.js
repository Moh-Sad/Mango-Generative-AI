const dotenv = require("dotenv");
const {GoogleGenerativeAI} = require("@google/generative-ai");

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API);

async function getGeminiResponse(prompt){
    const model = genAI.getGenerativeModel({model: "gemini-pro"});
    const fullPrompt = "You are a general chatbot. responde to the following chat question: "+prompt

    const result = await model.generateContent(fullPrompt)

    const response = await result.response;
    const text = response.text();

    return text;
}

module.exports = { getGeminiResponse };