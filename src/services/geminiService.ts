export async function generateContent(prompt: string, systemInstruction?: string) {
  const response = await fetch("/api/gemini/generate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ prompt, systemInstruction }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to generate content");
  }
  
  const data = await response.json();
  try {
    return JSON.parse(data.text);
  } catch {
    return data.text;
  }
}
