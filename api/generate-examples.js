export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { role } = req.body;
  if (!role) return res.status(400).json({ error: 'role required' });

  const prompt = `당신은 기업 업무 전문가입니다. "${role}" 직무를 맡고 있는 사람이 반복적으로 수행하는 업무를 예시로 만들어주세요.

아래 JSON 형식으로만 응답하세요. 다른 텍스트 없이 JSON만 출력하세요.

{
  "taskName": "번거롭게 느껴지는 반복 업무 예시 (1문장)",
  "taskFreq": "빈도와 소요 시간 예시 (예: 매주 1회, 약 2시간)",
  "taskReason": "이 업무가 존재하는 이유 예시 (1문장)",
  "taskInput": "이 업무의 Input 예시 (1문장)",
  "taskOutput": "이 업무의 Output 예시 (1문장)"
}`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 300 }
        })
      }
    );

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // JSON 추출 (```json ... ``` 또는 순수 JSON)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return res.status(500).json({ error: 'Failed to parse response' });

    const examples = JSON.parse(jsonMatch[0]);
    return res.status(200).json(examples);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
