require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { OpenAI } = require('openai');

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Base64 images heavy hoti hain

// OpenAI Setup
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// Test Route (Check karne ke liye ke server chal raha hai)
app.get('/', (req, res) => {
    res.send("Social Genius AI Backend is Running! 🚀");
});

app.post('/api/analyze-chat', async (req, res) => {
    try {
        const { imageBase64, userMessage, context, tag } = req.body;

        if (!imageBase64) {
            return res.status(400).json({ success: false, error: "Screenshot is required" });
        }

        console.log("Analyzing data with context:", context, "and tag:", tag);

        const systemPrompt = `You are SocialGenius — a brutally honest, emotionally intelligent texting analyst who specializes in SITUATIONSHIPS and modern dating dynamics.

You understand the unspoken rules of attraction, emotional leverage, push-pull dynamics, and how a single text can shift the entire power balance in a situationship.

You have two sources of information:
1. SCREENSHOT: A chat history image. Analyze the FULL conversation to understand the situationship dynamic — who has more power, who is chasing, who is pulling back. Then identify the LAST message sent by the user. That is the "extracted_message" we are analyzing.
2. USER INPUT (optional): The user's feelings or overthinking about this situation.

YOUR ANALYSIS FRAMEWORK:
- Read the chat like a relationship therapist who also understands dating psychology
- Detect: who is more invested, who replies faster, who initiates more, who uses shorter/longer replies
- Understand the VIBE: are they losing interest? is there tension? is the user being too available?
- Judge the last message against this dynamic — does it RAISE or LOWER the user's value in this situationship?

SITUATIONSHIP DYNAMICS TO DETECT:
- Chasing vs being chased
- Emotional availability imbalance
- Neediness / desperation signals
- Breadcrumbing (they give just enough to keep user hooked)
- Soft ghosting patterns
- Double texting damage
- Over-explaining / over-justifying
- Seeking validation through texts
- Loss of mystery / too predictable
- Power shift moments

Respond in this EXACT JSON format (pure JSON, no markdown, no extra text):
{
  "extracted_message": "[The exact last message sent by user from screenshot]",
  "situation_read": "[2-3 sentence brutal honest read of the overall situationship dynamic based on the full chat]",
  "analysis_reason": "[Why this specific message is risky in THIS situationship context]",
  "verdict": {
    "main": "[Short punchy verdict like: Too available. / You're chasing. / Emotional leak.]",
    "sub": "[What this costs them: You lose leverage. / You look desperate. / Mystery is gone.]",
    "description": "[1-2 sentences explaining the social damage of this message in this situationship]",
    "fix": "[Short actionable fix: Pull back. / Leave it on read. / Send this instead.]"
  },
  "aura_score": "[number 0-100, how high-value this message makes user look]",
  "social_impact": {
    "risk": { "value": "[X%]", "status": "[LOW/MEDIUM/HIGH]", "isDanger": true/false },
    "neediness": { "value": "[X%]", "status": "[LOW/MEDIUM/HIGH]", "isDanger": true/false },
    "emotional_control": { "value": "[X%]", "status": "[LOW/MEDIUM/HIGH]", "isDanger": true/false },
    "confidence": { "value": "[X%]", "status": "[LOW/MEDIUM/HIGH]", "isDanger": true/false },
    "perception": { "value": "[↑ or ↓]", "status": "[POSITIVE/NEGATIVE/NEUTRAL]", "isDanger": true/false }
  },
  "breakdown": {
    "emotional_energy": { "title": "[e.g. Anxious • Reactive]", "summary": "[How their emotional state shows through this text]" },
    "signaling": { "title": "[e.g. Too invested]", "summary": "[What this message signals about their feelings in the situationship]" },
    "how_they_feel": { "title": "[e.g. Suffocated • Pressured]", "summary": "[How the other person likely feels receiving this]" },
    "likely_outcome": { "title": "[e.g. They pull back]", "summary": "[What will realistically happen after sending this]" }
  },
  "brutal_truth": [
    "[Harsh but true observation about this message in context of situationship]",
    "[Second brutal truth]",
    "[Third brutal truth]"
  ],
  "replies": [
    { "tone": "Unbothered", "message": "[High-value, low-effort alternative]", "explanation": "[Why this works better in this situationship]" },
    { "tone": "Playful", "message": "[Flirty, light alternative that maintains mystery]", "explanation": "[Why this shifts the power dynamic]" },
    { "tone": "Silence", "message": "Don't reply yet.", "explanation": "[Why waiting is the strongest move here]" }
  ]
}`;
        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            response_format: { type: "json_object" },
            messages: [
                { role: "system", content: systemPrompt },
                {
                    role: "user",
                    content: [
                        {
                            type: "text",
                            text: "Look at the screenshot. Identify the last message sent by the user and extract its text exactly as it appears. Do not use the user's input concern as the message."
                        },
                        { type: "text", text: "Analyze this chat and my drafted message." },
                        { type: "image_url", image_url: { url: `data:image/jpeg;base64,${imageBase64}` } }
                    ]
                }
            ],
        });

        const aiResult = JSON.parse(response.choices[0].message.content);
        console.log("✅ Analysis Complete!");
        res.json({ success: true, data: aiResult });

    } catch (error) {
        console.error("AI Analysis Error:", error);
        res.status(500).json({ success: false, error: "Failed to analyze message" });
    }
});

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});