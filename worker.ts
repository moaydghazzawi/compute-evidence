import handler from 'vinext/server/fetch-handler';
import { redirectLegacyDomain } from './lib/site-redirect';

const worker = {
  async fetch(
    request: Request,
    env: Parameters<typeof handler.fetch>[1],
    ctx: ExecutionContext,
  ): Promise<Response> {
    // Keep requests from already-open research desks on their original origin.
    return redirectLegacyDomain(request) ?? handler.fetch(request, env, ctx);
  },
};

export default worker;
