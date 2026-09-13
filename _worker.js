export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // CORS headers - allow your main app domain
    const corsHeaders = {
      'Access-Control-Allow-Origin': 'https://next-gig.sevavetisyan97.workers.dev',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    };

    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: corsHeaders
      });
    }

    // For all other requests, fetch from static assets and add CORS headers
    const response = await fetch(request);
    
    // Clone the response to modify headers
    const newHeaders = new Headers(response.headers);
    
    // Add CORS headers
    Object.entries(corsHeaders).forEach(([key, value]) => {
      newHeaders.set(key, value);
    });

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders
    });
  }
};
