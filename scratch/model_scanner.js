import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

async function findCompatibleModel() {
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GOOGLE_API_KEY}`);
        const data = await response.json();
        
        // Find models that support generateContent
        const compatible = data.models
            .filter(m => m.supportedGenerationMethods.includes('generateContent'))
            .map(m => m.name.replace('models/', ''));
            
        console.log("COMPATIBLE_MODELS:", JSON.stringify(compatible));
    } catch (e) {
        console.error("Scanner Error:", e.message);
    }
}
findCompatibleModel();
