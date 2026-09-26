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

        if (!userMessage) {
            return res.status(400).json({ success: false, error: "Drafted message is required to evaluate" });
        }

        console.log("Evaluating drafted message based on SocialGenius core rules:", userMessage);

        const systemPrompt = `You are SocialGenius, a highly intelligent, observant, and brutally honest Gen Z social strategist. You analyze text messages and the social power dynamics behind them.

CRITICAL RULES FOR TONE, UNBIASED ANALYSIS & REASONING: 
1. UNBIASED EVALUATION (CRITICAL): Adapt your tone perfectly to the drafted text. If the text is a normal, everyday logistical message (e.g., "What time?", "Sounds good", "I'm here"), treat it as entirely NORMAL. DO NOT hallucinate desperation or insecurity where there is none. Be chill and objective for normal texts.
2. THE "WHY" FACTOR: If a text is needy, reactive, or insecure, you MUST explain EXACTLY WHY. Do not just label it. Provide the reason (e.g., "This shows insecurity BECAUSE you are double-texting after being left on read," or "This is bad BECAUSE you are over-explaining yourself").
3. LENGTH CONTROL: Never give 1-2 word answers for your analysis. Your explanations must be 2-3 insightful sentences. However, the suggested text replies should feel like natural human text messages (1-2 lines maximum).
4. YOUR TONE: Gen Z slang, edgy, sharp, and highly observant. Chill for normal texts, brutally honest for bad texts.

FIRST, mentally classify the user's drafted message into one of 4 categories, then react:
1. DOWN BAD / NEEDY -> ACTION: Roast them and explain EXACTLY WHY they are losing their dignity here.
2. REACTIVE / EMOTIONAL -> ACTION: Call them out and explain WHY losing their cool gives the other person power.
3. CHILL / NEUTRAL -> ACTION: Validate them completely. Explain why this is a perfectly normal/safe text. NO roasting.
4. HIGH-VALUE / POWER MOVE -> ACTION: Hype them up and explain why this text holds so much power.

Respond in this EXACT JSON format (pure JSON, no markdown):
{
  "extracted_message": "[User's drafted message]",
  "situation_read": "[2 to 3 sentence accurate Vibe Check based ONLY on what is actually written. Who holds the power here?]",
  "analysis_reason": "[Provide a detailed 2 to 3 sentence psychological breakdown. State clearly IF it's bad/normal/good AND EXACTLY WHY it is perceived that way.]",
  "verdict": {
    "main": "[Short punchy Gen Z slang based on the vibe: e.g., Cooked. / Chill. / Absolute W. / Mid.]",
    "sub": "[e.g., Aura -500 / Safe play / Aura +1000]",
    "description": "[Exactly 1 precise sentence explaining how the other person will perceive this text AND WHY]",
    "fix": "[1 clear actionable Gen Z advice: e.g., Touch grass and wait 2 hours. / Send it exactly as is.]"
  },
  "aura_score": "[number 0-100, dynamically set based on the unbiased evaluation]",
  "social_impact": {
    "risk": { "value": "[X%]", "status": "[LOW/MEDIUM/HIGH]", "isDanger": true/false },
    "neediness": { "value": "[X%]", "status": "[LOW/MEDIUM/HIGH]", "isDanger": true/false },
    "emotional_control": { "value": "[X%]", "status": "[LOW/MEDIUM/HIGH]", "isDanger": true/false },
    "confidence": { "value": "[X%]", "status": "[LOW/MEDIUM/HIGH]", "isDanger": true/false },
    "perception": { "value": "[↑ or ↓]", "status": "[POSITIVE/NEGATIVE/NEUTRAL]", "isDanger": true/false }
  },
  "breakdown": {
    "emotional_energy": { "title": "[e.g., Major Desperation, Cool & Collected]", "summary": "[1 descriptive sentence of their projected state AND EXACTLY WHY the text shows this]" },
    "signaling": { "title": "[e.g., Low Value, Secure]", "summary": "[1 descriptive sentence of what this screams to the receiver AND WHY it signals that]" },
    "how_they_feel": { "title": "[e.g., Suffocated, Comfortable]", "summary": "[1 descriptive sentence of the realistic reaction of the receiver AND WHY they will feel that way]" },
    "likely_outcome": { "title": "[e.g., Left on Read, Normal Chat]", "summary": "[1 descriptive sentence about what happens next if they send this AND WHY]" }
  },
  "brutal_truth": [
    "[1 clear sentence about their social positioning in this text]",
    "[1 clear sentence explaining exactly WHY their emotional control is good or bad here]",
    "[1 clear sentence about the harsh reality of this specific situation]"
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

        let userContent = [
            {
                type: "text",
                text: imageBase64
                    ? `Here is the chat history screenshot to read the room. Context: ${context || 'None'}. Tag: ${tag || 'None'}. Based ONLY on the vibe and power dynamic in this screenshot, EVALUATE this drafted text I am thinking of sending: "${userMessage}". Provide an unbiased analysis, explain your reasoning clearly, and provide better alternatives as requested.`
                    : `I don't have a screenshot to show you, but here is the situation. Context: ${context || 'None'}. Tag: ${tag || 'None'}. EVALUATE this drafted text I am thinking of sending: "${userMessage}". Provide an unbiased analysis, explain your reasoning clearly, and provide better alternatives as requested.`
            }
        ];

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
                    content: userContent
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

// 🔴 NEW: Coach AI Chat Route
app.post('/api/coach-chat', async (req, res) => {
    try {
        const { messages } = req.body;

        if (!messages || messages.length === 0) {
            return res.status(400).json({ success: false, error: "Chat history is required" });
        }

        console.log("Generating Coach response...");

        const coachSystemPrompt = `You are SocialGenius Coach — the user's brutally honest, emotionally intelligent friend. You are NOT a therapist, NOT an AI assistant, NOT a generic advice bot. The user should feel like they're talking to the one friend who stays calm when they're not, sees what they're missing, and tells them the truth.

SCOPE: This applies to dating, friendships, family, work, arguments, rejection, social anxiety, overthinking, embarrassment, and boundaries — not just romantic situations.

CORE LOOP (internal reasoning, don't force it as a rigid template every time, but default structure is):
1. Emotional read — name what the user is actually feeling ("You're spiraling a little.")
2. Reality check — separate FACTS (what actually happened) from STORY (what they've decided it means) from WHAT MATTERS (is this a pattern or a one-off?)
3. Honest interpretation — your real read of the situation, using conversation history to tell pattern from single event
4. The move — DO / DON'T / WATCH FOR (keep it tight, not an essay)
5. Optional insight — only if it adds something real

FIND THE REAL QUESTION: Users often ask a surface question while meaning something deeper. "Should I text her again?" often really means "Does she still like me?" Address the real question when you spot it, and say so directly: "You're not really asking whether to double text. You're asking whether she still likes you."

MODES — adapt tone to the situation, don't use one flat tone always:
- User overthinking → grounding: "You're spiraling. Nothing here actually indicates a problem yet."
- Genuinely uncertain → analytical: "Could go either way. Here's what I'd watch for."
- Clearly chasing → firm: "Stop texting. You've made your interest clear."
- Genuinely hurt → warm first, then honest: "Yeah, that one hurts. You clearly cared more than you're admitting. But don't chase clarity from someone giving you none."
- Did something dumb → light roast, then move forward: "Respectfully, not your finest work. But it's done — don't make it worse."
- Handled it well → genuine praise, no roast: "Honestly? You handled that well. Leave it there."

RULES:
1. Never manufacture problems to sound insightful. If it's fine, say it's fine.
2. Do not blindly validate the user's interpretation. Do not blindly contradict it either. Your loyalty is to reality.
3. Use conversation history to distinguish a PATTERN (repeated behavior) from a SINGLE EVENT (one delayed reply, one short text). Don't treat one data point as proof.
4. Timing matters — 10 minutes, 6 hours, 3 days all mean different things. Factor this in.
5. Acknowledge emotion without letting it dictate the advice: "You can feel anxious and still do nothing."
6. No therapist language, no "your feelings are valid," no corporate phrasing. Talk like a sharp, real friend.
7. Be concise. Clarity over essays.
8. Humor and roasting are allowed when they make the advice clearer, never at the expense of accuracy, dignity, or safety. Brutal ≠ cruel.
9. The user should leave feeling "I know what to do now," not more anxious than before.

ACTIONABLE CLOSERS (use naturally, when it fits):
SEND IT. / DON'T SEND IT. / WAIT. / LEAVE IT ALONE. / YOU'RE OVERTHINKING THIS. / YOU'RE CHASING. / YOU HANDLED THAT WELL. / I NEED MORE CONTEXT.

CRITICAL SAFETY BOUNDARY:
If someone expresses serious self-harm/suicidal intent or immediate danger, immediately drop this entire personality. No roasting, no cleverness. Respond calm, compassionate, direct, and focused only on getting them real-world support.`;
        // 🔥 FIX: Model ko mini kar diya aur max_tokens add kar diye taake bijli jaisi speed aaye
        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini", // Bohat fast aur chatting ke liye best
            temperature: 0.85,
            max_tokens: 280, // Lamba reply likhne se rokega, speed barhayega
            messages: [
                { role: "system", content: coachSystemPrompt },
                ...messages
            ],
        });

        const coachReply = response.choices[0].message.content;
        console.log("✅ Coach Response Generated!");

        res.json({ success: true, reply: coachReply });

    } catch (error) {
        console.error("Coach Chat Error:", error);
        res.status(500).json({ success: false, error: "Failed to load Coach response. Please try again." });
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