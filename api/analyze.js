export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { description, mealType } = req.body;

  if (!description) {
    return res.status(400).json({ error: 'description is required' });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        temperature: 0.1,
        max_tokens: 300,
        messages: [
          {
            role: 'system',
            content: `Vocà é nutricionista especialista em alimentos brasileiros e internacionais.
Estime calorias e macronutrientes da refeição descrita.
Responda SOMENTE JSON válido, sem markdown, sem texto extra.
Formato: {"kcal":número,"prot":número,"carb":número,"fat":número,"note":"observação curta opcional, max 50 chars"}
Todos os valores em números inteiros. note deve ser "" se não houver incerteza relevante.`,
          },
          {
            role: 'user',
            content: `Refeição (${mealType || 'não especificado'}): ${description}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      return res.status(502).json({ error: 'Groq API error', detail: err });
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || '';
    const clean = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);
    return res.status(200).json(parsed);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
