import Anthropic from "@anthropic-ai/sdk";
import express from "express";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const client = new Anthropic();

app.use(express.json());
app.use(express.static(join(__dirname, "public")));

const JOKE_TYPE_DESCRIPTIONS = {
  pun: "a clever wordplay pun",
  "knock-knock": "a knock-knock joke",
  "one-liner": "a punchy one-liner",
  classic: "a classic dad joke setup-and-punchline",
  question: "a question-and-answer style joke",
  "groan-worthy": "an especially groan-worthy, terrible joke",
};

const AGE_GROUP_DESCRIPTIONS = {
  kids: "young children aged 5-8 — keep it simple, clean, and silly",
  tweens: "tweens aged 9-12 — slightly more clever, still totally clean",
  teens: "teenagers — can be a bit wittier and self-aware",
  adults: "adults — can reference everyday adult life situations",
  "all-ages": "the whole family — universally funny across all ages",
};

const LENGTH_DESCRIPTIONS = {
  short: "Keep it very short — 1-3 lines maximum",
  medium: "Medium length — a complete setup and punchline, maybe 3-5 lines",
  long: "Make it longer — build up the story with extra detail, 5-8 lines",
};

app.post("/api/joke", async (req, res) => {
  const {
    jokeType = "classic",
    ageGroup = "all-ages",
    length = "medium",
  } = req.body;

  const jokeTypeDesc =
    JOKE_TYPE_DESCRIPTIONS[jokeType] || JOKE_TYPE_DESCRIPTIONS.classic;
  const ageGroupDesc =
    AGE_GROUP_DESCRIPTIONS[ageGroup] || AGE_GROUP_DESCRIPTIONS["all-ages"];
  const lengthDesc = LENGTH_DESCRIPTIONS[length] || LENGTH_DESCRIPTIONS.medium;

  const prompt = `Tell me ${jokeTypeDesc}.

The joke is for ${ageGroupDesc}.
${lengthDesc}.

Deliver only the joke itself — no intro like "Sure!" or "Here's a joke:", and no commentary after. Just the joke, formatted naturally.`;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  try {
    const stream = client.messages.stream({
      model: "claude-opus-4-7",
      max_tokens: 512,
      messages: [{ role: "user", content: prompt }],
    });

    for await (const event of stream) {
      if (
        event.type === "content_block_delta" &&
        event.delta.type === "text_delta"
      ) {
        res.write(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`);
      }
    }

    res.write("data: [DONE]\n\n");
    res.end();
  } catch (err) {
    console.error("Claude API error:", err.message);
    res.write(
      `data: ${JSON.stringify({ error: "Failed to generate joke. Check your ANTHROPIC_API_KEY." })}\n\n`
    );
    res.end();
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`JokeBook running at http://localhost:${PORT}`);
});
