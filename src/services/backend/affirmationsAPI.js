import { affirmations } from '../../data/affirmations.js';

// Get valid API keys from environment variable (required)
const getValidApiKeys = () => {
  const envKeys = process.env.AFFIRMATIONS_API_KEYS;
  if (!envKeys) {
    throw new Error('AFFIRMATIONS_API_KEYS environment variable is not set');
  }
  
  return envKeys.split(',').map(key => key.trim());
};

const validApiKeys = getValidApiKeys();

export const affirmationsAPI = {
  getRandom: (req, res) => {
    const apiKey = req.headers['x-api-key'] || req.query.apiKey;
    
    if (!apiKey || !validApiKeys.includes(apiKey)) {
      return res.status(401).json({
        error: 'Unauthorized: Invalid or missing API key'
      });
    }

    const randomIndex = Math.floor(Math.random() * affirmations.length);
    
    res.json({
      affirmation: affirmations[randomIndex],
      id: randomIndex,
      timestamp: new Date().toISOString(),
      totalCount: affirmations.length
    });
  },

  getMultiple: (req, res) => {
    const apiKey = req.headers['x-api-key'] || req.query.apiKey;
    
    if (!apiKey || !validApiKeys.includes(apiKey)) {
      return res.status(401).json({
        error: 'Unauthorized: Invalid or missing API key'
      });
    }

    const count = Math.min(parseInt(req.query.count) || 5, 20);
    const selectedAffirmations = [];
    const usedIndices = new Set();

    while (selectedAffirmations.length < count && usedIndices.size < affirmations.length) {
      const randomIndex = Math.floor(Math.random() * affirmations.length);
      if (!usedIndices.has(randomIndex)) {
        usedIndices.add(randomIndex);
        selectedAffirmations.push({
          affirmation: affirmations[randomIndex],
          id: randomIndex
        });
      }
    }

    res.json({
      affirmations: selectedAffirmations,
      count: selectedAffirmations.length,
      timestamp: new Date().toISOString(),
      totalCount: affirmations.length
    });
  },

  getInfo: (req, res) => {
    res.json({
      name: 'Affirmations API',
      version: '1.0.0',
      totalAffirmations: affirmations.length,
      endpoints: {
        'GET /api/affirmations/random': 'Get a single random affirmation',
        'GET /api/affirmations/multiple?count=5': 'Get multiple random affirmations',
        'GET /api/affirmations/info': 'Get API information'
      }
    });
  }
};