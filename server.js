import express from "express";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(express.json());
app.use(express.static(join(__dirname, "public")));

const TYPE_TO_CATEGORY = {
  pun: "Pun",
  "knock-knock": "Misc",
  "one-liner": "Any",
  classic: "Misc",
  question: "Any",
  "groan-worthy": "Pun",
};

const TYPE_TO_JOKE_TYPE = {
  "one-liner": "single",
  question: "twopart",
};

const AGE_TO_BLACKLIST = {
  kids: "nsfw,racist,sexist,explicit,political,dark",
  tweens: "nsfw,racist,sexist,explicit,political",
  teens: "nsfw,racist,sexist,explicit",
  adults: "racist,sexist",
  "all-ages": "nsfw,racist,sexist,explicit,political,dark",
};

const LENGTH_TO_TYPE = {
  short: "single",
  long: "twopart",
  medium: null,
};

app.post("/api/joke", async (req, res) => {
  const { jokeType = "classic", ageGroup = "all-ages", length = "medium" } = req.body;

  const category = TYPE_TO_CATEGORY[jokeType] || "Misc";
  const blacklist = AGE_TO_BLACKLIST[ageGroup] || AGE_TO_BLACKLIST["all-ages"];

  // jokeType overrides take precedence; length fills in when type has no preference
  const forcedType = TYPE_TO_JOKE_TYPE[jokeType];
  const lengthType = LENGTH_TO_TYPE[length];
  const jokeTypeParam = forcedType || lengthType;

  const url = new URL(`https://v2.jokeapi.dev/joke/${category}`);
  url.searchParams.set("blacklistFlags", blacklist);
  if (jokeTypeParam) url.searchParams.set("type", jokeTypeParam);

  try {
    const response = await fetch(url.toString());
    if (!response.ok) throw new Error(`JokeAPI error: ${response.status}`);

    const data = await response.json();

    if (data.error) throw new Error(data.message || "JokeAPI returned an error");

    let joke;
    if (data.type === "twopart") {
      joke = `${data.setup}\n\n${data.delivery}`;
    } else {
      joke = data.joke;
    }

    res.json({ joke });
  } catch (err) {
    console.error("JokeAPI error:", err.message);
    res.status(500).json({ error: "Failed to fetch a joke. Please try again." });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`JokeBook running at http://localhost:${PORT}`);
});
