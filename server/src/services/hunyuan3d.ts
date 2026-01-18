import { fal } from '@fal-ai/client';

fal.config({
  credentials: process.env.FAL_KEY
});

export interface Hunyuan3DResult {
  model_glb?: {
    url: string;
  };
  model_urls?: {
    glb?: {
      url: string;
    };
  };
}

export async function convertImageTo3D(imageUrl: string): Promise<string> {
  console.log('Starting Hunyuan 3D v3 conversion...');
  console.log('Input image:', imageUrl);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await (fal as any).subscribe('fal-ai/hunyuan3d-v3/image-to-3d', {
    input: {
      input_image_url: imageUrl,
      generate_type: 'Normal',
      enable_pbr: true,
      face_count: 100000
    },
    logs: true,
    onQueueUpdate: (update: { status: string; logs?: Array<{ message: string }> }) => {
      if (update.status === 'IN_PROGRESS') {
        console.log('Hunyuan 3D progress:', update.logs?.map(l => l.message).join('\n'));
      }
    }
  }) as { data: Hunyuan3DResult };

  console.log('Hunyuan 3D raw result:', JSON.stringify(result, null, 2));

  const glbUrl = result.data?.model_glb?.url || result.data?.model_urls?.glb?.url;

  if (!glbUrl) {
    throw new Error('No GLB returned from Hunyuan 3D v3');
  }

  console.log('Hunyuan 3D v3 completed. GLB URL:', glbUrl);
  return glbUrl;
}
