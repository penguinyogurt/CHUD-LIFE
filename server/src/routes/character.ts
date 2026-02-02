import { Router, Request, Response } from 'express';
import multer from 'multer';
import { Readable } from 'stream';

import { convertImageTo3D } from '../services/hunyuan3d.js';
import {
  rigModel,
  startAnimationTask,
  waitForAnimationCompletion,
  startRetexturingTask,
  waitForRetexturingCompletion,
  RetextureResult
} from '../services/meshy.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

interface GenerateResponse {
  status: 'completed' | 'failed';
  riggedModelUrl?: string;
  glbModelUrl?: string;
  animations?: {
    idle?: string;
    walking?: string;
    attack?: string;
    special?: string;
    emote?: string;
  };
  error?: string;
}

const ANIMATION_IDS = {
  idle: 0,
  walking: 1,    
  attack: 206,    // Spartan Kick
  special: 452,   // Backflip
  emote: 74
};

router.post('/create', upload.single('image'), async (req: Request, res: Response) => {
  try {
    let imageUrl: string;

    if (req.file) {
      const base64 = req.file.buffer.toString('base64');
      const mimeType = req.file.mimetype;
      imageUrl = `data:${mimeType};base64,${base64}`;
    } else if (req.body.imageUrl) {
      imageUrl = req.body.imageUrl;
    } else {
      res.status(400).json({
        status: 'failed',
        error: 'No image provided.'
      } as GenerateResponse);
      return;
    }

    console.log('=== Starting Character Generation Pipeline ===');

    console.log('\n--- Step 1: 3D Generation with Hunyuan 3D v3 ---');
    const glbModelUrl = await convertImageTo3D(imageUrl);

    console.log('\n--- Step 1.5: Retexturing with Meshy.ai ---');
    const retextureTaskId = await startRetexturingTask(glbModelUrl, imageUrl);
    const retextureResult = await waitForRetexturingCompletion(retextureTaskId);
    console.log('Textured model URL:', retextureResult.modelUrl);
    console.log('Texture URL for rigging:', retextureResult.textureUrl || 'not available');

    console.log('\n--- Step 2: Rigging with Meshy.ai ---');
    const rigOutput = await rigModel(retextureResult.modelUrl, retextureResult.textureUrl);
    const riggedModelUrl = rigOutput.result?.rigged_character_glb_url || rigOutput.result?.glb_url;
    const rigTaskId = rigOutput.id;

    console.log('\n--- Step 3: Triggering Animation Tasks ---');
    const animationTaskPromises = Object.entries(ANIMATION_IDS).map(async ([key, actionId]) => {
      try {
        const taskId = await startAnimationTask(rigTaskId, actionId);
        const url = await waitForAnimationCompletion(taskId);
        return { [key]: url };
      } catch (err) {
        console.error(`Failed to generate animation ${key}:`, err);
        return { [key]: null };
      }
    });

    const animationResults = await Promise.all(animationTaskPromises);
    const animations = Object.assign({}, ...animationResults);

    console.log('\n=== Character Generation Complete ===');
    
    res.json({
      status: 'completed',
      riggedModelUrl,
      glbModelUrl,
      animations
    } as GenerateResponse);

  } catch (error) {
    console.error('Character generation error:', error);
    res.status(500).json({
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    } as GenerateResponse);
  }
});

// Diagnostic route
router.get('/create', (req: Request, res: Response) => {
  res.status(405).json({ status: 'failed', error: 'Use POST' });
});

// SSE Streaming endpoint for real-time progress
router.post('/create-stream', upload.single('image'), async (req: Request, res: Response) => {
  // Set up SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.flushHeaders();

  const sendEvent = (data: object) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  try {
    let imageUrl: string;

    if (req.file) {
      const base64 = req.file.buffer.toString('base64');
      const mimeType = req.file.mimetype;
      imageUrl = `data:${mimeType};base64,${base64}`;
      sendEvent({ message: 'Image received and processed' });
    } else if (req.body.imageUrl) {
      imageUrl = req.body.imageUrl;
      sendEvent({ message: 'Image URL received' });
    } else {
      sendEvent({ status: 'error', error: 'No image provided' });
      res.end();
      return;
    }

    sendEvent({ message: 'Starting 3D generation pipeline...' });

    // Step 1: 3D Generation
    sendEvent({ message: 'Converting image to 3D model with Hunyuan 3D v3...' });
    const glbModelUrl = await convertImageTo3D(imageUrl);
    sendEvent({ message: '3D model generated successfully' });

    // Step 1.5: Retexturing
    sendEvent({ message: 'Applying textures with Meshy.ai...' });
    const retextureTaskId = await startRetexturingTask(glbModelUrl, imageUrl);
    sendEvent({ message: 'Retexturing task started, waiting for completion...' });
    const retextureResult = await waitForRetexturingCompletion(retextureTaskId);
    sendEvent({ message: 'Texturing complete' });

    // Step 2: Rigging
    sendEvent({ message: 'Rigging model for animation...' });
    const rigOutput = await rigModel(retextureResult.modelUrl, retextureResult.textureUrl);
    const riggedModelUrl = rigOutput.result?.rigged_character_glb_url || rigOutput.result?.glb_url;
    const rigTaskId = rigOutput.id;
    sendEvent({ message: 'Model rigged successfully' });

    // Step 3: Animations
    sendEvent({ message: 'Generating animations...' });
    const animationTaskPromises = Object.entries(ANIMATION_IDS).map(async ([key, actionId]) => {
      try {
        sendEvent({ message: `Starting ${key} animation generation...` });
        const taskId = await startAnimationTask(rigTaskId, actionId);
        const url = await waitForAnimationCompletion(taskId);
        sendEvent({ message: `${key} animation complete` });
        return { [key]: url };
      } catch (err) {
        sendEvent({ message: `Warning: ${key} animation failed` });
        return { [key]: null };
      }
    });

    const animationResults = await Promise.all(animationTaskPromises);
    const animations = Object.assign({}, ...animationResults);

    sendEvent({ message: 'All animations generated' });
    sendEvent({
      status: 'complete',
      riggedModelUrl,
      glbModelUrl,
      animations
    });

  } catch (error) {
    console.error('Character generation error:', error);
    sendEvent({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }

  res.end();
});

router.get('/status', (req: Request, res: Response) => {
  res.json({ status: 'ready' });
});

router.get('/model-proxy', async (req: Request, res: Response) => {
  const { url } = req.query;
  if (!url || typeof url !== 'string') return res.status(400).send('Missing url');
  try {
    const response = await fetch(url);
    const contentType = response.headers.get('content-type');
    if (contentType) res.setHeader('Content-Type', contentType);
    res.setHeader('Access-Control-Allow-Origin', '*');
    // @ts-ignore
    const nodeStream = Readable.fromWeb(response.body);
    nodeStream.pipe(res);
  } catch (error) {
    res.status(500).send('Proxy error');
  }
});

export default router;