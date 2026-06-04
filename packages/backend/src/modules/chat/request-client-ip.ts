type RequestLike = {
  ip?: string;
  headers: Record<string, string | string[] | undefined>;
};

/** IP do cliente (primeiro hop em X-Forwarded-For quando atrás de proxy). */
export function getClientIp(request: RequestLike): string {
  const forwarded = request.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim()) {
    return forwarded.split(',')[0].trim();
  }
  if (Array.isArray(forwarded) && forwarded[0]) {
    return String(forwarded[0]).split(',')[0].trim();
  }
  if (request.ip?.trim()) {
    return request.ip.trim();
  }
  return 'unknown';
}
