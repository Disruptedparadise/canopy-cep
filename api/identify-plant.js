export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const apiKey = process.env.PLANTNET_API_KEY || '2b105Qkannd1n6IwRrBVPSkfSu';
    const project = (req.query && req.query.project) ? req.query.project : 'all';
    const plantnetUrl = `https://my-api.plantnet.org/v2/identify/${encodeURIComponent(project)}?api-key=${encodeURIComponent(apiKey.trim())}`;

    // Read the raw multipart buffer from incoming stream
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    const response = await fetch(plantnetUrl, {
      method: 'POST',
      headers: {
        'content-type': req.headers['content-type'] || 'multipart/form-data',
      },
      body: buffer,
    });

    const text = await response.text();

    if (!response.ok) {
      if (response.status === 404) {
        return res.status(200).json({
          bestMatch: null,
          results: [],
          message: 'No botanical matches found for this photo in the Pl@ntNet database.',
        });
      }
      return res.status(response.status).send(text);
    }

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      return res.status(502).json({ error: 'Invalid response from flora identification service.' });
    }

    // Map top 5 results into Canopy format
    const results = (data.results || []).slice(0, 5).map((item) => {
      const score = typeof item.score === 'number' ? item.score : 0;
      const percentage = Math.round(score * 100);
      const species = item.species || {};
      const commonNames = species.commonNames || [];
      const scientificName = species.scientificNameWithoutAuthor || species.scientificName || 'Unknown Specimen';

      return {
        score,
        percentage,
        scientificName,
        scientificNameWithAuthor: species.scientificName,
        family: species.family?.scientificNameWithoutAuthor || '',
        genus: species.genus?.scientificNameWithoutAuthor || '',
        commonNames,
      };
    });

    return res.status(200).json({
      bestMatch: data.bestMatch || (results[0]?.scientificName ?? null),
      results,
    });
  } catch (err) {
    console.error('Serverless Pl@ntNet identification error:', err);
    return res.status(500).json({
      error: 'Identification Request Failed',
      message: err?.message || 'Error occurred while communicating with the plant identification API.',
    });
  }
}
