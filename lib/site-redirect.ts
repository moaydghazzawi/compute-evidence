import { SITE_URL } from './site-identity.ts';

export function redirectLegacyDomain(request: Request): Response | null {
  const url = new URL(request.url);
  if (
    url.hostname !== 'when-controls-raise-the-cost.moaydghazzawi.com' ||
    (request.method !== 'GET' && request.method !== 'HEAD')
  ) {
    return null;
  }

  const destination = new URL(SITE_URL);
  url.protocol = destination.protocol;
  url.hostname = destination.hostname;
  url.port = destination.port;
  return Response.redirect(url.href, 308);
}
