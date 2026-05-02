import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

async function test() {
    try {
        console.log("Testing API Key...");
        const result = await model.generateContent("Hello, are you active?");
        console.log("API Response Success:", result.response.text());
    } catch (error) {
        console.error("API Response ERROR:", error.message);
    }
}

test();
