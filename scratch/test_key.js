import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

async function test() {
    try {
        const result = await model.generateContent("Say 'API Key Working' if you can read this.");
        console.log(result.response.text());
    } catch (e) {
        console.error("API Key Error:", e.message);
    }
}
test();
