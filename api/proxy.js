const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
console.log('API key found:', !!anthropicApiKey);
console.log('API key starts with:', anthropicApiKey?.substring(0, 15));
const anthropicModel = "claude-sonnet-4-20250514";
const anthropicVersion =
  process.env.CLAUDE_API_VERSION || process.env.ANTHROPIC_VERSION || '2023-06-01';

console.log(`Configured Claude model: ${anthropicModel}`);

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    if (!anthropicApiKey) {
      return res.status(500).json({ error: 'Anthropic API key is not configured on the server.' });
    }
    
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicApiKey,
        'anthropic-version': anthropicVersion
      },
      body: JSON.stringify({
        model: anthropicModel,
        ...req.body
      })
    });
    
    const responseText = await response.text();
    console.log('Anthropic API status:', response.status);
    
    if (!response.ok) {
      console.error('Anthropic API Error:', responseText);
      return res.status(response.status).json({
        error: responseText,
        status: response.status,
        statusText: response.statusText
      });
    }
    
    const data = JSON.parse(responseText);
    res.status(200).json(data);
    
  } catch (error) {
    console.error('Serverless proxy error:', error);
    res.status(500).json({
      error: 'API call failed',
      details: error instanceof Error ? error.message : undefined
    });
  }
}





