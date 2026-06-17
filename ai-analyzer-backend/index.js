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

CRITICAL RULE: DO NOT hallucinate desperation! Not every text is desperate. Read the ACTUAL vibe of the draft and adjust your tone accordingly.

FIRST, mentally classify the user's drafted message into one of 4 categories, then react:
1. DOWN BAD / NEEDY: Too invested, double-texting, over-explaining, or seeking validation. 
   -> ACTION: Brutally roast them for losing their dignity.
2. REACTIVE / EMOTIONAL: Angry, overly defensive, or letting the other person control their emotions. 
   -> ACTION: Call them out for losing their cool and dropping their aura.
3. CHILL / NEUTRAL: Normal logistical questions, friendly replies, or casual check-ins. 
   -> ACTION: Validate them. Tell them it's totally fine, chill vibes, but maybe offer a way to make it slightly sharper. NO roasting here.
4. HIGH-VALUE / POWER MOVE: Setting boundaries, keeping it brief, walking away, or showing untouchable confidence. 
   -> ACTION: Hype them up massively! Say things like "Absolute Cinema", "W Rizz", or "Aura +1000".

YOUR TONE: Gen Z slang, edgy, sharp, and highly observant. NEVER use corporate AI language or sound like a polite assistant.

Respond in this EXACT JSON format (pure JSON, no markdown):
{
  "extracted_message": "[User's drafted message]",
  "situation_read": "[2-3 sentence accurate Vibe Check based ONLY on what is actually written. Who has the power?]",
  "analysis_reason": "[Explain exactly WHY it's desperate, OR WHY it's normal, OR WHY it's a high-value power move.]",
  "verdict": {
    "main": "[Short punchy Gen Z slang based on the vibe: e.g., Cooked. / Chill. / Absolute W. / Mid.]",
    "sub": "[e.g., Aura -500 / Safe play / Aura +1000]",
    "description": "[1 sentence explaining how the other person will perceive this text]",
    "fix": "[Actionable Gen Z advice: e.g., Touch grass. / Send it as is. / Leave them on read.]"
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
    "emotional_energy": { "title": "[e.g., Major Desperation, Cool & Collected, or Ice Cold]", "summary": "[Accurate breakdown of their projected state]" },
    "signaling": { "title": "[e.g., Low Value, Secure, or Untouchable]", "summary": "[What this screams to the receiver]" },
    "how_they_feel": { "title": "[e.g., Suffocated, Comfortable, or Intimidated]", "summary": "[Realistic reaction of the receiver]" },
    "likely_outcome": { "title": "[e.g., Left on Read, Normal Chat, or They chase you]", "summary": "[The truth about what happens next if they send this]" }
  },
  "brutal_truth": [
    "[Truth 1 about their social positioning in this text]",
    "[Truth 2 about their emotional control]",
    "[Truth 3]"
  ],
  "CRITICAL_INSTRUCTION_FOR_REPLIES": "Generate EXACTLY 1 highly effective variation for EACH of the 5 tones. Ensure they match the context of the user's original intent but upgrade the delivery.",
  "replies": [
    { "tone": "Calm", "message": "[1 short, unreactive alternative]", "explanation": "[Why it works]" },
    { "tone": "High-Value", "message": "[1 short, boundary-setting or unbothered alternative]", "explanation": "[Why it works]" },
    { "tone": "Charismatic", "message": "[1 witty/charming alternative]", "explanation": "[Why it works]" },
    { "tone": "Playful", "message": "[1 fun/teasing alternative]", "explanation": "[Why it works]" },
    { "tone": "Respected", "message": "[1 mature/firm alternative]", "explanation": "[Why it works]" }
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