export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { description, mealType } = req.body;

  if (!description) {
    return res.status(400).json({ error: 'description is required' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 300,
        system: `Você é nutricionista especialista em alimentos brasileiros e internacionais.
Estime calorias e macronutrientes da refeição descrita.
Responda SOMENTE JSON válido, sem markdown, sem texto extra.
Formato: {"kcal":número,"prot":número,"carb":número,"fat":número,"note":"observação curta opcional, max 50 chars"}
Todos os valores em números inteiros. note deve ser vazio "" se não houver incerteza relevante.`,
        messages: [
          {
            role: 'user',
            content: `Refeição (${mealType || 'não especificado'}): ${description}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      return res.status(502).json({ error: 'Anthropic API error', detail: err });
    }

    const data = await response.json();
    const text = (data.content || [])
      .map((i) => i.text || '')
      .join('')
      .replace(/```json|```/g, '')
      .trim();

    const parsed = JSON.parse(text);
    return res.status(200).json(parsed);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
