const MESHY_API_URL = 'https://api.meshy.ai/openapi/v1';

export interface MeshyRiggingResult {
  id: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'SUCCEEDED' | 'FAILED';
  result?: {
    rigged_character_glb_url?: string;
    rigged_model_url?: string;
    model_url?: string;
    glb_url?: string;
    basic_animations?: {
      walking_glb_url?: string;
      running_glb_url?: string;
    };
  };
  task_error?: {
    message: string;
  };
}

async function meshyRequest(
  endpoint: string,
  method: 'GET' | 'POST' = 'GET',
  body?: object
): Promise<Response> {
  const apiKey = process.env.MESHY_API_KEY;
  if (!apiKey) {
    throw new Error('MESHY_API_KEY not configured');
  }

  const response = await fetch(`${MESHY_API_URL}${endpoint}`, {
    method,
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: body ? JSON.stringify(body) : undefined
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Meshy API error: ${response.status} - ${errorText}`);
  }

  return response;
}

export async function startRiggingTask(modelUrl: string, textureUrl?: string): Promise<string> {
  console.log('Starting Meshy rigging task...');
  console.log('Rigging input URL:', modelUrl);
  if (textureUrl) {
    console.log('Texture URL for rigging:', textureUrl);
  }

  const requestBody: Record<string, any> = {
    model_url: modelUrl,
    height_meters: 1.7
  };

  // Pass texture URL to preserve textures during rigging
  if (textureUrl) {
    requestBody.texture_image_url = textureUrl;
  }

  const response = await meshyRequest('/rigging', 'POST', requestBody);
  const data = await response.json() as { result: string };
  console.log('Rigging task created:', data.result);
  return data.result;
}

export async function startRetexturingTask(modelUrl: string, imageUrl: string): Promise<string> {
  console.log('Starting Meshy retexturing task...');
  const response = await meshyRequest('/retexture', 'POST', {
    model_url: modelUrl,
    image_style_url: imageUrl,
    enable_pbr: true,
    enable_original_uv: true,
    ai_model: 'meshy-5'
  });
  const data = await response.json() as { result: string };
  return data.result;
}

export async function getRetexturingTaskStatus(taskId: string): Promise<any> {
  const response = await meshyRequest(`/retexture/${taskId}`);
  return response.json();
}

export interface RetextureResult {
  modelUrl: string;
  textureUrl?: string;
}

export async function waitForRetexturingCompletion(
  taskId: string,
  maxWaitMs: number = 600000,
  pollIntervalMs: number = 5000
): Promise<RetextureResult> {
  const startTime = Date.now();
  while (Date.now() - startTime < maxWaitMs) {
    const status = await getRetexturingTaskStatus(taskId);
    console.log(`Retexturing ${taskId} status:`, status.status);

    if (status.status === 'SUCCEEDED') {
      console.log(`Retexturing SUCCESS payload:`, JSON.stringify(status, null, 2));
      const modelUrl = status.model_urls?.glb || status.model_url || status.result?.model_url;
      // Extract base color texture URL for rigging
      const textureUrl = status.texture_urls?.find((t: any) => t.base_color)?.base_color
        || status.texture_urls?.[0]?.base_color;

      if (modelUrl) {
        console.log('Retexturing completed. Model URL:', modelUrl);
        console.log('Texture URL:', textureUrl || 'not found');
        return { modelUrl, textureUrl };
      }
      console.warn('Retexturing succeeded but URL not found in result keys:', Object.keys(status));
    }
    if (status.status === 'FAILED') {
      throw new Error(`Retexturing failed: ${status.task_error?.message || 'Unknown error'}`);
    }
    await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
  }
  throw new Error('Retexturing task timed out');
}

export async function startAnimationTask(rigTaskId: string, actionId: number): Promise<string> {
  console.log(`Starting Meshy animation task for action_id ${actionId}...`);
  const response = await meshyRequest('/animations', 'POST', {
    rig_task_id: rigTaskId,
    action_id: actionId
  });
  const data = await response.json() as { result: string };
  return data.result;
}

export async function getAnimationTaskStatus(taskId: string): Promise<any> {
  const response = await meshyRequest(`/animations/${taskId}`);
  return response.json();
}

export async function waitForAnimationCompletion(
  taskId: string,
  maxWaitMs: number = 300000,
  pollIntervalMs: number = 5000
): Promise<string> {
  const startTime = Date.now();
  while (Date.now() - startTime < maxWaitMs) {
    const status = await getAnimationTaskStatus(taskId);
    if (status.status === 'SUCCEEDED') {
      console.log(`Animation ${taskId} SUCCESS payload:`, JSON.stringify(status, null, 2));
      const url = status.result?.animation_glb_url || 
                  status.result?.model_url || 
                  status.result?.glb_url;
      if (url) return url;
    }
    if (status.status === 'FAILED') {
      throw new Error(`Animation failed: ${status.task_error?.message || 'Unknown error'}`);
    }
    await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
  }
  throw new Error('Animation task timed out');
}

export async function getRiggingTaskStatus(taskId: string): Promise<MeshyRiggingResult> {
  const response = await meshyRequest(`/rigging/${taskId}`);
  return response.json() as Promise<MeshyRiggingResult>;
}

export async function waitForRiggingWithId(
  taskId: string,
  maxWaitMs: number = 600000, // Increased to 10 minutes
  pollIntervalMs: number = 5000
): Promise<{ result: MeshyRiggingResult['result'], id: string }> {
  const startTime = Date.now();
  while (Date.now() - startTime < maxWaitMs) {
    const status = await getRiggingTaskStatus(taskId);
    console.log(`Rigging ${taskId} status:`, status.status);
    
    if (status.status === 'SUCCEEDED') {
      console.log(`Rigging ${taskId} SUCCESS payload:`, JSON.stringify(status, null, 2));
      return { result: status.result, id: status.id };
    }
    if (status.status === 'FAILED') {
      throw new Error(`Rigging failed: ${status.task_error?.message || 'Unknown error'}`);
    }
    await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
  }
  throw new Error('Rigging task timed out');
}

export async function rigModel(modelUrl: string, textureUrl?: string): Promise<{ result: MeshyRiggingResult['result'], id: string }> {
  const taskId = await startRiggingTask(modelUrl, textureUrl);
  return waitForRiggingWithId(taskId);
}