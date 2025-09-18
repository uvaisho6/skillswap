import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function moderateText(text: string) {
  const response = await openai.moderations.create({
    input: text,
    model: "text-moderation-latest",
  });
  return response.results[0];
}

export async function getEmbedding(text: string) {
  const response = await openai.embeddings.create({
    input: text,
    model: "text-embedding-3-large",
  });
  return response.data[0].embedding;
}

export async function improveListing(title: string, description: string) {
  const response = await openai.chat.completions.create({
    model: "gpt-4-turbo-preview",
    messages: [
      {
        role: "system",
        content:
          "You are a helpful assistant that improves listing titles and descriptions for clarity and suggests relevant tags.",
      },
      {
        role: "user",
        content: `Improve the following listing:\n\nTitle: ${title}\n\nDescription: ${description}\n\nSuggest 5 relevant tags.`,
      },
    ],
  });
  return response.choices[0].message.content;
}