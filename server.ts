import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import multer from 'multer';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Supabase server client for server-side auth verification and data operations
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl.trim() !== '' &&
  supabaseAnonKey.trim() !== '' &&
  !supabaseUrl.includes('your-project.supabase.co')
);

let supabaseServerClient: SupabaseClient | null = null;
if (isSupabaseConfigured) {
  try {
    supabaseServerClient = createClient(supabaseUrl, supabaseAnonKey);
  } catch (e) {
    console.warn('Could not initialize Supabase server client:', e);
  }
}

// ----------------------------------------------------
// 1. CORS Policy: Restrict to Application Deployed Origin
// ----------------------------------------------------
app.use((req: Request, res: Response, next: NextFunction) => {
  const origin = req.headers.origin;
  const host = req.headers.host;
  const appUrl = process.env.APP_URL?.replace(/\/$/, '');

  const allowedOrigins: string[] = [
    appUrl,
    host ? `http://${host}` : undefined,
    host ? `https://${host}` : undefined,
    'http://localhost:3000',
    'http://127.0.0.1:3000',
  ].filter(Boolean) as string[];

  // Same-origin browser requests or non-CORS requests (no origin header)
  if (!origin) {
    return next();
  }

  const isAllowed = allowedOrigins.some((allowed) => {
    if (!allowed) return false;
    try {
      return origin === allowed || new URL(origin).host === new URL(allowed).host;
    } catch {
      return origin === allowed;
    }
  });

  if (isAllowed) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    if (req.method === 'OPTIONS') {
      return res.sendStatus(204);
    }
    return next();
  }

  // Strictly reject unauthorized cross-origin requests to /api/
  if (req.path.startsWith('/api/')) {
    return res.status(403).json({
      error: 'CORS Origin Forbidden',
      code: 'FORBIDDEN_ORIGIN',
      message: 'Cross-origin requests from this origin are not authorized.',
    });
  }

  next();
});

app.use(express.json());

// Multer in-memory upload handler (max 10MB)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

// ----------------------------------------------------
// 2. Rate Limiting for Photo-Identification Endpoint
// ----------------------------------------------------
interface RateLimitRecord {
  count: number;
  resetAt: number;
}
const identifyRateLimits = new Map<string, RateLimitRecord>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_IDENTIFY_REQUESTS_PER_MINUTE = 8; // 8 botanical scans / minute

// Periodic garbage collection for rate limit records
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of identifyRateLimits.entries()) {
    if (val.resetAt < now) {
      identifyRateLimits.delete(key);
    }
  }
}, 30000);

function checkIdentifyRateLimit(identifier: string): { allowed: boolean; remaining: number; resetInSec: number } {
  const now = Date.now();
  const record = identifyRateLimits.get(identifier);

  if (!record || record.resetAt < now) {
    identifyRateLimits.set(identifier, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true, remaining: MAX_IDENTIFY_REQUESTS_PER_MINUTE - 1, resetInSec: 60 };
  }

  if (record.count >= MAX_IDENTIFY_REQUESTS_PER_MINUTE) {
    return { allowed: false, remaining: 0, resetInSec: Math.ceil((record.resetAt - now) / 1000) };
  }

  record.count += 1;
  return { allowed: true, remaining: MAX_IDENTIFY_REQUESTS_PER_MINUTE - record.count, resetInSec: Math.ceil((record.resetAt - now) / 1000) };
}

// ----------------------------------------------------
// 3. Helper to Verify Supabase Session Token
// ----------------------------------------------------
async function verifySessionToken(req: Request): Promise<{ ok: boolean; userId?: string; error?: string }> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      ok: false,
      error: 'Authentication Required: An active Supabase session token (Bearer token) must be provided in the Authorization header.',
    };
  }

  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!token) {
    return {
      ok: false,
      error: 'Invalid Authorization header: Bearer token is empty.',
    };
  }

  if (supabaseServerClient) {
    try {
      const { data: { user }, error } = await supabaseServerClient.auth.getUser(token);
      if (error || !user) {
        return {
          ok: false,
          error: 'Session Expired or Invalid: The provided Supabase token is no longer valid. Please re-authenticate.',
        };
      }
      return { ok: true, userId: user.id };
    } catch (e: any) {
      return {
        ok: false,
        error: `Supabase Auth verification failed: ${e?.message || 'Unknown verification error'}`,
      };
    }
  }

  // If Supabase credentials are not configured in this environment, require non-empty token
  if (token.length >= 10) {
    return { ok: true, userId: 'local-authenticated-steward' };
  }

  return {
    ok: false,
    error: 'Authentication Required: Please sign in with a valid account before accessing this API.',
  };
}

// ----------------------------------------------------
// API Endpoints
// ----------------------------------------------------

// API Health Check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'RootGuard Backend API',
    supabaseConfigured: isSupabaseConfigured,
    plantnetConfigured: Boolean(process.env.PLANTNET_API_KEY && process.env.PLANTNET_API_KEY.trim() !== ''),
  });
});

// Pl@ntNet Identification Proxy Endpoint (Rate Limiting by IP)
app.post('/api/identify-plant', upload.single('image'), async (req: Request, res: Response) => {
  try {
    // Step B: Rate limiting per IP address
    const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || 'unknown-ip';
    const rateLimitKey = `ip:${clientIp}`;
    const rateStatus = checkIdentifyRateLimit(rateLimitKey);

    res.setHeader('X-RateLimit-Limit', MAX_IDENTIFY_REQUESTS_PER_MINUTE.toString());
    res.setHeader('X-RateLimit-Remaining', rateStatus.remaining.toString());

    if (!rateStatus.allowed) {
      return res.status(429).json({
        error: 'Rate Limit Exceeded',
        code: 'RATE_LIMIT_EXCEEDED',
        message: `Too many photo-identification requests. You can submit up to ${MAX_IDENTIFY_REQUESTS_PER_MINUTE} photos per minute. Please try again in ${rateStatus.resetInSec} seconds.`,
      });
    }

    // Step C: Pl@ntNet API Key (Server-side only; strictly never VITE_ prefix)
    const apiKey = process.env.PLANTNET_API_KEY;
    if (!apiKey || apiKey.trim() === '' || apiKey === 'MY_PLANTNET_API_KEY') {
      return res.status(400).json({
        error: 'Pl@ntNet API Key Not Configured',
        code: 'MISSING_API_KEY',
        message:
          'Pl@ntNet botanical identification requires an API key from https://my.plantnet.org. Please set PLANTNET_API_KEY in your server environment.',
      });
    }

    // Step D: Validate uploaded photo
    if (!req.file) {
      return res.status(400).json({
        error: 'No Image Uploaded',
        code: 'NO_IMAGE',
        message: 'Please attach a valid botanical specimen image (leaf, bark, or flower).',
      });
    }

    const organ = (req.body?.organ as string) || 'auto';
    const project = (req.body?.project as string) || 'all';

    // Step E: Dispatch multipart request to Pl@ntNet
    const formData = new FormData();
    const fileBlob = new Blob([req.file.buffer], { type: req.file.mimetype });
    formData.append('images', fileBlob, req.file.originalname || 'plant.jpg');

    if (organ && organ !== 'auto') {
      formData.append('organs', organ);
    }

    const plantnetUrl = `https://my-api.plantnet.org/v2/identify/${encodeURIComponent(project)}?api-key=${encodeURIComponent(apiKey.trim())}`;

    const response = await fetch(plantnetUrl, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorJson: any = null;
      try {
        errorJson = JSON.parse(errorText);
      } catch {
        // non-JSON
      }

      if (response.status === 404) {
        return res.json({
          bestMatch: null,
          results: [],
          message: 'No botanical matches found for this photo in the Pl@ntNet database.',
        });
      }

      if (response.status === 401 || response.status === 403) {
        return res.status(401).json({
          error: 'Invalid Pl@ntNet API Key',
          code: 'INVALID_API_KEY',
          message: 'The server Pl@ntNet API key was rejected by the service. Please verify your credentials at my.plantnet.org.',
        });
      }

      return res.status(response.status).json({
        error: 'Pl@ntNet Service Error',
        code: 'PLANTNET_ERROR',
        message: errorJson?.message || `Pl@ntNet responded with HTTP status ${response.status}`,
      });
    }

    const data: any = await response.json();

    // Map top 5 results
    const results = (data.results || []).slice(0, 5).map((item: any) => {
      const score = typeof item.score === 'number' ? item.score : 0;
      const percentage = Math.round(score * 100);
      const species = item.species || {};
      const commonNames: string[] = species.commonNames || [];
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

    return res.json({
      bestMatch: data.bestMatch || (results[0]?.scientificName ?? null),
      results,
      query: {
        organ,
        project,
      },
    });
  } catch (err: any) {
    console.error('Plant identification error:', err);
    return res.status(500).json({
      error: 'Identification Request Failed',
      message: err?.message || 'An unexpected error occurred while communicating with the flora identification service.',
    });
  }
});

// ----------------------------------------------------
// 4. Server-Side Input Validation for Data-Writing Endpoints
// ----------------------------------------------------

// POST /api/trees: Server-side validation for logging new tree specimens
app.post('/api/trees', async (req: Request, res: Response) => {
  try {
    const {
      species,
      planter,
      lat,
      lng,
      status = 'healthy',
      soil_type = 'loamy',
      slope = 'gentle',
      date_planted,
      notes,
    } = req.body;

    const errors: string[] = [];

    // Species validation
    if (!species || typeof species !== 'string' || species.trim().length === 0) {
      errors.push('Species name is required.');
    } else if (species.trim().length > 120) {
      errors.push('Species name cannot exceed 120 characters.');
    }

    // Planter validation
    if (!planter || typeof planter !== 'string' || planter.trim().length === 0) {
      errors.push('Planter identifier is required.');
    } else if (planter.trim().length > 100) {
      errors.push('Planter name cannot exceed 100 characters.');
    }

    // Coordinates validation
    const numLat = Number(lat);
    const numLng = Number(lng);
    if (isNaN(numLat) || numLat < -90 || numLat > 90) {
      errors.push('Latitude must be a valid number between -90 and +90.');
    }
    if (isNaN(numLng) || numLng < -180 || numLng > 180) {
      errors.push('Longitude must be a valid number between -180 and +180.');
    }

    // Status validation
    const allowedStatuses = ['healthy', 'needs-watch', 'not-surviving'];
    if (!allowedStatuses.includes(status)) {
      errors.push(`Status must be one of: ${allowedStatuses.join(', ')}.`);
    }

    // Soil type validation
    const allowedSoil = ['loamy', 'sandy', 'clayey', 'rocky', 'unknown'];
    if (!allowedSoil.includes(soil_type)) {
      errors.push(`Soil type must be one of: ${allowedSoil.join(', ')}.`);
    }

    // Slope validation
    const allowedSlopes = ['flat', 'gentle', 'steep'];
    if (!allowedSlopes.includes(slope)) {
      errors.push(`Slope must be one of: ${allowedSlopes.join(', ')}.`);
    }

    // Date validation
    if (!date_planted || typeof date_planted !== 'string') {
      errors.push('Date planted is required in YYYY-MM-DD format.');
    } else {
      const parsedDate = new Date(date_planted);
      if (isNaN(parsedDate.getTime())) {
        errors.push('Date planted must be a valid date.');
      }
    }

    // Notes validation
    if (notes && typeof notes === 'string' && notes.length > 2000) {
      errors.push('Notes cannot exceed 2000 characters.');
    }

    if (errors.length > 0) {
      return res.status(400).json({
        error: 'Validation Failed',
        code: 'INVALID_INPUT',
        details: errors,
      });
    }

    const treeRecord = {
      tree_id: req.body.tree_id || `tree-${Date.now()}`,
      species_name: species.trim(),
      planter_name: planter.trim(),
      latitude: numLat,
      longitude: numLng,
      date_planted: date_planted.trim(),
      status,
      soil_type,
      slope,
      notes: notes ? notes.trim() : null,
      created_at: new Date().toISOString(),
    };

    return res.status(201).json({
      success: true,
      message: 'Tree record validated and registered.',
      tree: treeRecord,
    });
  } catch (err: any) {
    return res.status(500).json({
      error: 'Server Error',
      message: err?.message || 'Failed to process tree submission.',
    });
  }
});

// POST /api/trees/:id/checkins: Server-side validation for survival check-ins
app.post('/api/trees/:id/checkins', (req: Request, res: Response) => {
  const treeId = req.params.id;
  const { date, status, note } = req.body;

  const errors: string[] = [];

  if (!treeId || treeId.trim().length === 0) {
    errors.push('Tree ID is required in the path.');
  }

  const allowedStatuses = ['healthy', 'needs-watch', 'not-surviving'];
  if (!status || !allowedStatuses.includes(status)) {
    errors.push(`Status must be one of: ${allowedStatuses.join(', ')}.`);
  }

  if (!note || typeof note !== 'string' || note.trim().length < 2) {
    errors.push('Check-in note must contain at least 2 characters.');
  } else if (note.trim().length > 2000) {
    errors.push('Check-in note cannot exceed 2000 characters.');
  }

  if (!date || isNaN(new Date(date).getTime())) {
    errors.push('A valid check-in date is required.');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      error: 'Validation Failed',
      code: 'INVALID_INPUT',
      details: errors,
    });
  }

  return res.status(201).json({
    success: true,
    message: 'Check-in validated successfully.',
    checkin: {
      id: `checkin-${treeId}-${Date.now()}`,
      tree_id: treeId,
      date: date.trim(),
      status,
      note: note.trim(),
    },
  });
});

// POST /api/campaigns: Server-side validation for reforestation initiatives
app.post('/api/campaigns', (req: Request, res: Response) => {
  const { title, description, targetTrees, organizer, startDate, endDate, slope } = req.body;
  const errors: string[] = [];

  if (!title || typeof title !== 'string' || title.trim().length < 3) {
    errors.push('Campaign title must be at least 3 characters long.');
  } else if (title.trim().length > 150) {
    errors.push('Campaign title cannot exceed 150 characters.');
  }

  if (typeof targetTrees !== 'number' || targetTrees < 1 || targetTrees > 1000000) {
    errors.push('Target trees must be a positive number between 1 and 1,000,000.');
  }

  if (!organizer || typeof organizer !== 'string' || organizer.trim().length < 2) {
    errors.push('Organizer name must be at least 2 characters long.');
  }

  if (!startDate || isNaN(new Date(startDate).getTime())) {
    errors.push('A valid campaign start date is required.');
  }

  if (!endDate || isNaN(new Date(endDate).getTime())) {
    errors.push('A valid campaign end date is required.');
  } else if (startDate && new Date(endDate) < new Date(startDate)) {
    errors.push('Campaign end date cannot be earlier than start date.');
  }

  const allowedSlopes = ['flat', 'gentle', 'steep'];
  if (slope && !allowedSlopes.includes(slope)) {
    errors.push(`Slope must be one of: ${allowedSlopes.join(', ')}.`);
  }

  if (errors.length > 0) {
    return res.status(400).json({
      error: 'Validation Failed',
      code: 'INVALID_INPUT',
      details: errors,
    });
  }

  return res.status(201).json({
    success: true,
    message: 'Campaign validated successfully.',
    campaign: {
      id: `campaign-${Date.now()}`,
      title: title.trim(),
      description: description ? description.trim() : '',
      targetTrees: Number(targetTrees),
      organizer: organizer.trim(),
      startDate: startDate.trim(),
      endDate: endDate.trim(),
      slope: slope || 'gentle',
    },
  });
});

// ----------------------------------------------------
// Production / Dev Server Bootstrap
// ----------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`RootGuard server running on http://localhost:${PORT}`);
  });
}

startServer();
