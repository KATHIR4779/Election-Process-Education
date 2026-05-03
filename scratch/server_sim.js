import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

const systemPrompt = "You are an AI assistant.";
const message = "What is EVM?";

async function simulateServer() {
    console.log("SIMULATION_STARTING...");
    try {
        console.log("KEY_PREFIX:", process.env.GOOGLE_API_KEY ? process.env.GOOGLE_API_KEY.substring(0, 5) : "MISSING");
        
        const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
        // Using the EXACT same model line from server.js
        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
        
        const chat = model.startChat({ history: [] });
        const result = await chat.sendMessage(systemPrompt + "\nUser Query: " + message);
        console.log("SUCCESS_RESPONSE:", result.response.text().substring(0, 50));
    } catch (error) {
        console.error("SIMULATION_ERROR:", error.message);
        if (error.status) console.error("STATUS:", error.status);
    }
}
simulateServer();
