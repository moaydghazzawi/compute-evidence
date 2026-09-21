import { researchData } from '@/lib/research';
import { handleResearchDesk } from '@/lib/research-desk-server';

export const dynamic = 'force-dynamic';
export const POST = (request: Request) =>
  handleResearchDesk(request, researchData);
