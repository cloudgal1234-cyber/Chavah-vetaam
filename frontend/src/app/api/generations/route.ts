import { NextRequest } from 'next/server';
import { resolveUser } from '@/lib/auth-server';
import { prisma } from '@/lib/prisma';
import { runGeneration } from '@/services/ai';

export async function GET(req: NextRequest) {
  const user = await resolveUser(req);

  const { searchParams } = req.nextUrl;
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const mediaType = searchParams.get('mediaType') || undefined;
  const status = searchParams.get('status') || undefined;
  const campaignId = searchParams.get('campaignId') || undefined;
  const skip = (page - 1) * limit;

  const where: any = {
    campaign: { userId: user.id },
    ...(mediaType && { mediaType }),
    ...(status && { status }),
    ...(campaignId && { campaignId }),
  };

  const [total, items] = await Promise.all([
    prisma.generation.count({ where }),
    prisma.generation.findMany({
      where,
      include: { campaign: { select: { id: true, title: true } } },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
  ]);

  return Response.json({ total, page, limit, items });
}

export async function POST(req: NextRequest) {
  const user = await resolveUser(req);

  try {
    const { campaignId, mediaType, prompt } = await req.json();
    if (!campaignId || !mediaType) {
      return Response.json({ error: 'campaignId and mediaType are required' }, { status: 400 });
    }

    const validTypes = ['VIDEO', 'IMAGE', 'AUDIO', 'UGC', 'TEXT'];
    if (!validTypes.includes(mediaType)) {
      return Response.json({ error: `mediaType must be one of: ${validTypes.join(', ')}` }, { status: 400 });
    }

    const campaign = await prisma.campaign.findFirst({ where: { id: campaignId, userId: user.id } });
    if (!campaign) return Response.json({ error: 'Campaign not found' }, { status: 404 });

    const generation = await prisma.generation.create({
      data: { campaignId, mediaType, status: 'PROCESSING', prompt: prompt || campaign.script, creditsUsed: 0 },
    });

    runGeneration(mediaType, generation.prompt || '')
      .then((result) =>
        prisma.generation.update({
          where: { id: generation.id },
          data: { status: 'COMPLETED', resultUrl: result.resultUrl, thumbnailUrl: result.thumbnailUrl, metadata: result.metadata },
        })
      )
      .catch(async (err) => {
        await prisma.generation.update({ where: { id: generation.id }, data: { status: 'FAILED', errorMessage: err.message } });
      });

    return Response.json({ id: generation.id, status: 'PROCESSING' }, { status: 202 });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
