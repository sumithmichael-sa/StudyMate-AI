
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const { GoogleGenAI } = require("@google/genai");

const app = express();

app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "public")));

function getAI() {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        return null;
    }

    return new GoogleGenAI({ apiKey });
}

app.post("/api/chat", async (req, res) => {
    try {const ai = getAI();

if (!ai) {
    return res.status(500).json({
        error: "Gemini API key is not configured."
    });
}
        const { message, subject, history = [] } = req.body;

        if (!message || typeof message !== "string" || !message.trim()) {
            return res.status(400).json({
                error: "Please enter a question."
            });
        }

        if (message.length > 10000) {
            return res.status(400).json({
                error: "Your question is too long."
            });
        }

        const safeHistory = Array.isArray(history)
            ? history.slice(-10).filter(item =>
                item &&
                ["user", "model"].includes(item.role) &&
                typeof item.text === "string"
            )
            : [];

        const contents = [
            ...safeHistory.map(item => ({
                role: item.role,
                parts: [{ text: item.text.slice(0, 10000) }]
            })),
            {
                role: "user",
                parts: [{
                    text: `Subject: ${subject || "General"}\nQuestion: ${message.trim()}`
                }]
            }
        ];

        const response = await ai.models.generateContent({
            model: "gemini-3.8-flash",
            contents,
            config: {
                systemInstruction:
                    "You are StudyMate AI, an academic learning assistant. " +
                    "Help students understand concepts, programming, mathematics " +
                    "and examination topics. Give clear, accurate, step-by-step " +
                    "explanations suitable for college students. Use examples " +
                    "where helpful. If a question is unclear, ask for clarification."
            }
        });

        res.json({
            reply: response.text || "I could not generate an answer. Please try again."
        });

    } catch (error) {
        console.error("Gemini API error:", error.message);

        res.status(500).json({
            error: "Unable to get an AI response. Please check the server and API configuration."
        });
    }
});

// AI QUIZ GENERATOR API
app.post("/api/quiz", async (req, res) => {
    try {
        const ai = getAI();

if (!ai) {
    return res.status(500).json({
        error: "Gemini API key is not configured."
    });
}
        const { subject, topic, count, difficulty } = req.body;

        // Validate input
        if (
            typeof topic !== "string" ||
            !topic.trim() ||
            topic.length > 200
        ) {
            return res.status(400).json({
                error: "Please enter a valid topic."
            });
        }

        const questionCount = Number(count);

        if (![5, 10, 15].includes(questionCount)) {
            return res.status(400).json({
                error: "Please select 5, 10 or 15 questions."
            });
        }

        if (!["Easy", "Medium", "Hard"].includes(difficulty)) {
            return res.status(400).json({
                error: "Please select a valid difficulty."
            });
        }

        const prompt = `
You are StudyMate AI, an academic quiz generator.

Generate exactly ${questionCount} multiple-choice questions.

Subject: ${String(subject || "General").slice(0, 100)}
Topic: ${topic.trim()}
Difficulty: ${difficulty}

Requirements:
1. Each question must have exactly four options.
2. Only one option must be correct.
3. Questions must be academically accurate.
4. Include a short explanation for each answer.
5. The answer field must be the zero-based index of the correct option.

Return ONLY valid JSON in this exact format.
Do not include Markdown or code fences.

{
  "questions": [
    {
      "question": "Question text",
      "options": [
        "Option A",
        "Option B",
        "Option C",
        "Option D"
      ],
      "answer": 0,
      "explanation": "Explanation of the correct answer."
    }
  ]
}
`;

        const response = await ai.models.generateContent({
            model: "gemini-3.8-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json"
            }
        });

        const rawText = response.text || "";

        const quizData = JSON.parse(rawText);

        if (
            !quizData ||
            !Array.isArray(quizData.questions) ||
            quizData.questions.length !== questionCount
        ) {
            throw new Error("Invalid quiz format received from AI.");
        }

        for (const q of quizData.questions) {
            if (
                typeof q.question !== "string" ||
                !Array.isArray(q.options) ||
                q.options.length !== 4 ||
                !Number.isInteger(q.answer) ||
                q.answer < 0 ||
                q.answer > 3
            ) {
                throw new Error("AI generated an invalid question.");
            }
        }

        res.json(quizData);

    } catch (error) {
        console.error("Quiz generation error:", error.message);

        res.status(500).json({
            error: "Unable to generate the quiz right now. Please try again."
        });
    }
});

// Export the Express app for Vercel
module.exports = app;

// Run locally when using: node server.js
if (require.main === module) {
    const PORT = process.env.PORT || 3000;

    app.listen(PORT, () => {
        console.log(`StudyMate AI backend running at http://localhost:${PORT}`);
    });
}
