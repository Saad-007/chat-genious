require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { OpenAI } = require('openai');

const app = express();

// 🔴 1. CORS aur Body Parser Setup
app.use(cors()); 
app.use(express.json({ limit: '50mb' })); 
app.use(express.urlencoded({ limit: '50mb', extended: true })); 

// 🔴 2. OpenAI Setup 
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// 🔴 3. Health Check Route
app.get('/', (req, res) => {
    res.status(200).send("Social Genius AI Backend is Live on Render! 🚀");
});

// 🔴 Main AI Analysis Route
app.post('/api/analyze-chat', async (req, res) => {
    try {
        const { imageBase64, userMessage, context, tag } = req.body;

        // 🔴 FIX 1: Screenshot ki requirement hata di hai. Ab sirf message lazmi hai.
        if (!userMessage) {
            return res.status(400).json({ success: false, error: "Drafted message is required to evaluate" });
        }

        console.log("Evaluating drafted message based on SocialGenius core rules:", userMessage);

const systemPrompt = `You are SocialGenius, a highly intelligent, brutally honest, and observant Gen Z social strategist. You analyze text messages and the social power dynamics behind them.

CRITICAL RULES FOR TONE & LENGTH: 
1. DO NOT hallucinate desperation! Not every text is desperate. Read the ACTUAL vibe.
2. LENGTH CONTROL: Never give 1-2 word answers for your analysis. Your explanations must be 2-3 insightful sentences. However, the suggested text replies should feel like natural human text messages (1-2 lines maximum).
3. YOUR TONE: Gen Z slang, edgy, sharp, and highly observant. NEVER use corporate AI language or sound like a polite assistant.

FIRST, mentally classify the user's drafted message into one of 4 categories, then react:
1. DOWN BAD / NEEDY -> ACTION: Brutally roast them for losing their dignity.
2. REACTIVE / EMOTIONAL -> ACTION: Call them out for losing their cool.
3. CHILL / NEUTRAL -> ACTION: Validate them. Normal logistics/check-ins are fine. NO roasting here.
4. HIGH-VALUE / POWER MOVE -> ACTION: Hype them up massively!

Respond in this EXACT JSON format (pure JSON, no markdown):
{
  "extracted_message": "[User's drafted message]",
  "situation_read": "[Provide a solid 2 to 3 sentence accurate Vibe Check based ONLY on what is actually written. Who holds the power here?]",
  "analysis_reason": "[Provide a detailed 2 to 3 sentence psychological breakdown of exactly WHY it's desperate, normal, or a power move. Do not give one-word answers.]",
  "verdict": {
    "main": "[Short punchy Gen Z slang based on the vibe: e.g., Cooked. / Chill. / Absolute W. / Mid.]",
    "sub": "[e.g., Aura -500 / Safe play / Aura +1000]",
    "description": "[Exactly 1 precise sentence explaining how the other person will perceive this text]",
    "fix": "[1 clear actionable Gen Z advice: e.g., Touch grass and wait 2 hours. / Send it exactly as is.]"
  },
  "aura_score": "[number 0-100, dynamically set based on the 4 categories above]",
  "social_impact": {
    "risk": { "value": "[X%]", "status": "[LOW/MEDIUM/HIGH]", "isDanger": true/false },
    "neediness": { "value": "[X%]", "status": "[LOW/MEDIUM/HIGH]", "isDanger": true/false },
    "emotional_control": { "value": "[X%]", "status": "[LOW/MEDIUM/HIGH]", "isDanger": true/false },
    "confidence": { "value": "[X%]", "status": "[LOW/MEDIUM/HIGH]", "isDanger": true/false },
    "perception": { "value": "[↑ or ↓]", "status": "[POSITIVE/NEGATIVE/NEUTRAL]", "isDanger": true/false }
  },
  "breakdown": {
    "emotional_energy": { "title": "[e.g., Major Desperation, Cool & Collected]", "summary": "[1 descriptive sentence of their projected state]" },
    "signaling": { "title": "[e.g., Low Value, Secure]", "summary": "[1 descriptive sentence of what this screams to the receiver]" },
    "how_they_feel": { "title": "[e.g., Suffocated, Comfortable]", "summary": "[1 descriptive sentence of the realistic reaction of the receiver]" },
    "likely_outcome": { "title": "[e.g., Left on Read, Normal Chat]", "summary": "[1 descriptive sentence about what happens next if they send this]" }
  },
  "brutal_truth": [
    "[1 clear sentence about their social positioning in this text]",
    "[1 clear sentence about their emotional control]",
    "[1 clear sentence about the harsh reality of this situation]"
  ],
  "CRITICAL_INSTRUCTION_FOR_REPLIES": "Generate EXACTLY 1 highly effective variation for EACH of the 5 tones. The generated messages must be natural, realistic text messages (1-2 sentences max). Do not make them sound like formal essays.",
  "replies": [
    { "tone": "Calm", "message": "[1-2 natural sentences. Unreactive and chill.]", "explanation": "[1 sentence explaining why this works]" },
    { "tone": "High-Value", "message": "[1-2 natural sentences. Boundary-setting or unbothered.]", "explanation": "[1 sentence explaining why this works]" },
    { "tone": "Charismatic", "message": "[1-2 natural sentences. Witty and charming.]", "explanation": "[1 sentence explaining why this works]" },
    { "tone": "Playful", "message": "[1-2 natural sentences. Fun and teasing.]", "explanation": "[1 sentence explaining why this works]" },
    { "tone": "Respected", "message": "[1-2 natural sentences. Mature and firm.]", "explanation": "[1 sentence explaining why this works]" }
  ]
}`;

        // 🔴 FIX 2: Dynamic User Content Array. Agar image hai toh daalo, warna sirf text.
        let userContent = [
            { 
                type: "text", 
                text: imageBase64 
                  ? `Here is the chat history screenshot to read the room. Context: ${context || 'None'}. Tag: ${tag || 'None'}. Based ONLY on the vibe and power dynamic in this screenshot, EVALUATE this drafted text I am thinking of sending: "${userMessage}". Provide better alternatives as requested.`
                  : `I don't have a screenshot to show you, but here is the situation. Context: ${context || 'None'}. Tag: ${tag || 'None'}. EVALUATE this drafted text I am thinking of sending: "${userMessage}". Provide better alternatives as requested.`
            }
        ];

        // Agar user ne screenshot diya hai, toh hi OpenAI ki array mein image push hogi
        if (imageBase64) {
            userContent.push({
                type: "image_url",
                image_url: { url: `data:image/jpeg;base64,${imageBase64}` }
            });
        }

        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            response_format: { type: "json_object" },
            temperature: 0.95, 
            max_tokens: 3000, 
            messages: [
                { role: "system", content: systemPrompt },
                {
                    role: "user",
                    content: userContent // 🔴 Dynamic array pass ki hai
                }
            ],
        });

        const aiResult = JSON.parse(response.choices[0].message.content);
        console.log("✅ Analysis Complete! Handled by SocialGenius strict personality.");
        res.json({ success: true, data: aiResult });

    } catch (error) {
        console.error("AI Analysis Error:", error);
        res.status(500).json({ success: false, error: "Failed to analyze message. Please check the server logs." });
    }
});

// 🔴 4. Global Error Handler
app.use((err, req, res, next) => {
    console.error("Global Error Caught:", err.stack);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
});

// 🔴 5. Dynamic Port Binding for Render
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Server is successfully running on port ${PORT}`);
});