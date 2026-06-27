import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

function envConfig(key: string): string | undefined {
  const v = process.env[key];
  return v && v.trim() ? v.trim() : undefined;
}

app.get("/api/config/firebase", (_req, res) => {
  res.json({
    apiKey: envConfig("VITE_FIREBASE_API_KEY") || envConfig("FIREBASE_API_KEY"),
    authDomain: envConfig("VITE_FIREBASE_AUTH_DOMAIN") || envConfig("FIREBASE_AUTH_DOMAIN"),
    projectId: envConfig("VITE_FIREBASE_PROJECT_ID") || envConfig("FIREBASE_PROJECT_ID"),
    storageBucket: envConfig("VITE_FIREBASE_STORAGE_BUCKET") || envConfig("FIREBASE_STORAGE_BUCKET"),
    messagingSenderId: envConfig("VITE_FIREBASE_MESSAGING_SENDER_ID") || envConfig("FIREBASE_MESSAGING_SENDER_ID"),
    appId: envConfig("VITE_FIREBASE_APP_ID") || envConfig("FIREBASE_APP_ID"),
    measurementId: envConfig("VITE_FIREBASE_MEASUREMENT_ID") || envConfig("FIREBASE_MEASUREMENT_ID"),
    firestoreDatabaseId: envConfig("VITE_FIREBASE_FIRESTORE_DATABASE_ID") || envConfig("FIREBASE_FIRESTORE_DATABASE_ID"),
  });
});

// Lazy initialize Gemini client to prevent startup crash if key missing
let aiClient: GoogleGenAI | null = null;
function getAI(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY environment variable is required");
    }
    aiClient = new GoogleGenAI({ apiKey: key });
  }
  return aiClient;
}

// Helper to clean JSON markdown wrappers
function cleanJSON(text: string): string {
  let cleaned = text.trim();
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.slice(7);
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.slice(3);
  }
  if (cleaned.endsWith("```")) {
    cleaned = cleaned.slice(0, -3);
  }
  return cleaned.trim();
}

// 1. Parse Messy Task Input
app.post("/api/ai/parse-task", async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    const ai = getAI();
    const nowStr = new Date().toLocaleString("en-US", { weekday: "long", month: "short", day: "numeric", hour: "numeric", minute: "numeric" });
    
    const systemPrompt = `You are the Deadline Rescue Intelligence AI. The user is dumping messy human thoughts about a task or deadline.
Current date/time context: ${nowStr}.

Convert the messy text into structured task JSON. Calculate a realistic riskScore (0 to 100) representing probability of missing the deadline if unorganized.
Also model the DOMINO CASCADE of consequences if the user does nothing — show how one missed deadline triggers others.
Output strictly valid JSON with this exact schema:
{
  "title": "Concise professional title",
  "deadline": "Readable string e.g. Tomorrow, 11:59 PM or Sunday 5:00 PM",
  "priority": "Urgent" | "High" | "Normal" | "Low",
  "riskScore": number (0-100),
  "subtasks": ["Subtask 1", "Subtask 2", "Subtask 3", "Subtask 4"],
  "estimatedHours": number (e.g. 4.5),
  "cascade": {
    "collisionSummary": "One vivid sentence e.g. 3 commitments will collide in the next 18 hours",
    "hoursUntilCollision": number,
    "dominoes": [
      { "step": 1, "trigger": "What user ignores first", "consequence": "What breaks next", "severity": "critical" | "high" | "medium" },
      { "step": 2, "trigger": "...", "consequence": "...", "severity": "..." },
      { "step": 3, "trigger": "...", "consequence": "...", "severity": "..." }
    ]
  }
}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        { role: "user", parts: [{ text: `${systemPrompt}\n\nUSER INPUT:\n"${prompt}"` }] }
      ]
    });

    const text = response.text || "{}";
    const parsed = JSON.parse(cleanJSON(text));
    res.json(parsed);
  } catch (err: any) {
    console.error("Parse task AI error:", err);
    // Fallback if API fails or quota exceeded
    res.json({
      title: req.body.prompt ? req.body.prompt.slice(0, 40) : "New Urgent Task",
      deadline: "Tomorrow, 11:59 PM",
      priority: "High",
      riskScore: 65,
      subtasks: ["Clarify requirements", "Draft initial implementation", "Review and finalize"],
      estimatedHours: 3,
      cascade: {
        collisionSummary: "Inaction will trigger a chain reaction across your commitments",
        hoursUntilCollision: 24,
        dominoes: [
          { step: 1, trigger: "Task remains unstarted", consequence: "Last-minute rush degrades quality", severity: "high" },
          { step: 2, trigger: "Sleep sacrificed", consequence: "Tomorrow's commitments suffer", severity: "high" },
          { step: 3, trigger: "Stress compounds", consequence: "Multiple deadlines missed at once", severity: "critical" }
        ]
      }
    });
  }
});

// 2. Emergency Rescue Mode
app.post("/api/ai/rescue-plan", async (req, res) => {
  try {
    const { panicText } = req.body;
    if (!panicText) {
      return res.status(400).json({ error: "Panic text is required" });
    }

    const ai = getAI();
    const systemPrompt = `You are an elite Emergency Productivity Commander. A user is experiencing severe deadline panic or procrastination paralysis.
Input panic: "${panicText}"

Generate a pragmatic survival strategy with agentic deliverables the user can copy and send immediately.
Output strictly valid JSON:
{
  "title": "Emergency Rescue Plan: [Topic]",
  "survivalStrategy": "2-3 sentences of direct tactical advice on what to prioritize and what to sacrifice to survive.",
  "riskReduction": "Reduces failure risk from 88% to 25%",
  "cascade": {
    "collisionSummary": "One vivid sentence describing the domino collision if user does nothing",
    "hoursUntilCollision": number,
    "dominoes": [
      { "step": 1, "trigger": "...", "consequence": "...", "severity": "critical" | "high" | "medium" },
      { "step": 2, "trigger": "...", "consequence": "...", "severity": "..." },
      { "step": 3, "trigger": "...", "consequence": "...", "severity": "..." }
    ]
  },
  "timeBreakdown": [
    { "time": "Block 1 (Next 2 hours)", "action": "High impact core action", "status": "pending" },
    { "time": "Block 2 (After 15m break)", "action": "Secondary must-have requirement", "status": "pending" },
    { "time": "Final Stretch (Before deadline)", "action": "Polish & submission check", "status": "pending" }
  ],
  "priorityActions": ["Tactical step 1", "Tactical step 2", "Tactical step 3"],
  "deliverables": [
    { "type": "extension_email", "label": "Extension Request Email", "content": "Full ready-to-send email body" },
    { "type": "outline", "label": "Minimum Viable Deliverable Outline", "content": "Structured outline or bullet plan" }
  ],
  "receiptPreview": {
    "headline": "Short triumphant headline e.g. Triple Deadline Collision Averted",
    "verdict": "2 sentences summarizing what was at stake and what rescue achieved",
    "proofPoints": ["Specific action 1 taken by AI", "Specific action 2", "Specific action 3"]
  },
  "instantTasks": [
    {
      "title": "Immediate Action Item",
      "deadline": "Today ASAP",
      "priority": "Urgent",
      "riskScore": 80,
      "estimatedHours": 2,
      "subtasks": ["Step A", "Step B"]
    }
  ]
}
Include 2-4 deliverables relevant to the panic (extension_email, reschedule_email, outline, apology_plan, or cram_sheet). Keep deliverable content concise but copy-paste ready.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: systemPrompt }] }]
    });

    const parsed = JSON.parse(cleanJSON(response.text || "{}"));
    res.json(parsed);
  } catch (err: any) {
    console.error("Rescue plan AI error:", err);
    res.json({
      title: "Emergency Action Protocol",
      survivalStrategy: "Take a deep breath. Stop trying to do everything. Focus solely on the minimum viable deliverable that satisfies the deadline.",
      riskReduction: "Reduces failure risk to 30%",
      cascade: {
        collisionSummary: "Multiple deadlines are on a collision course",
        hoursUntilCollision: 12,
        dominoes: [
          { step: 1, trigger: "Panic paralysis continues", consequence: "Zero progress in the next 2 hours", severity: "critical" },
          { step: 2, trigger: "Rushed execution", consequence: "Quality drops below acceptable threshold", severity: "high" },
          { step: 3, trigger: "Deadline missed", consequence: "Reputation and grade damage", severity: "critical" }
        ]
      },
      timeBreakdown: [
        { time: "Hour 1 - 2", action: "Execute core required deliverable", status: "pending" },
        { time: "Hour 3", action: "Review and fix critical bugs", status: "pending" },
        { time: "Hour 4", action: "Submit output immediately", status: "pending" }
      ],
      priorityActions: ["Eliminate all distractions", "Do the hardest item first", "Accept imperfect progress"],
      deliverables: [
        {
          type: "apology_plan",
          label: "Recovery Message Draft",
          content: "Hi,\n\nI wanted to reach out proactively about [deadline]. I encountered unexpected delays but have a concrete plan to deliver by [time]. Here is what I will complete in the next 2 hours:\n\n1. [Core deliverable]\n2. [Minimum viable version]\n\nThank you for your understanding."
        }
      ],
      receiptPreview: {
        headline: "Emergency Protocol Activated",
        verdict: "You were approaching a cascading deadline failure. A minimum viable survival plan has been generated.",
        proofPoints: ["Cascade failure mapped", "Survival schedule created", "Recovery draft prepared"]
      },
      instantTasks: []
    });
  }
});

// Mount Vite middleware in dev or static files in production
if (process.env.NODE_ENV !== "production") {
  const { createServer: createViteServer } = await import("vite");
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
  });
  app.use(vite.middlewares);
} else {
  const distPath = path.join(__dirname, "dist");
  app.use(express.static(distPath));
  app.get("*", (req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});
