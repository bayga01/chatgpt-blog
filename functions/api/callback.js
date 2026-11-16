function renderBody(status, content, origin) {
    const html = `
    <script>
      const receiveMessage = (message) => {
        window.opener.postMessage(
          'authorization:github:${status}:${JSON.stringify(content)}',
          message.origin
        );
        window.removeEventListener("message", receiveMessage, false);
      }
      window.addEventListener("message", receiveMessage, false);
      window.opener.postMessage("authorizing:github", ${JSON.stringify(origin)});
    </script>
    `;
    const blob = new Blob([html]);
    return blob;
}

export async function onRequest(context) {
    const {
        request, // same as existing Worker API
        env, // same as existing Worker API
        params, // if filename includes [id] or [[path]]
        waitUntil, // same as ctx.waitUntil in existing Worker API
        next, // used for middleware or to fetch assets
        data, // arbitrary space for passing data between middlewares
    } = context;

    const client_id = env.GITHUB_CLIENT_ID;
    const client_secret = env.GITHUB_CLIENT_SECRET;

    try {
        const url = new URL(request.url);
        const code = url.searchParams.get('code');
        const state = url.searchParams.get('state');

        // CSRF 防护：比对授权时种下的 HttpOnly Cookie 与回传的 state，不一致直接拒绝
        const cookieHeader = request.headers.get('Cookie') || '';
        const cookieState = (cookieHeader.match(/(?:^|;\s*)oauth_state=([a-f0-9]+)/) || [])[1];
        if (!state || !cookieState || state !== cookieState) {
            return new Response('Invalid OAuth state', {
                headers: { 'content-type': 'text/plain;charset=UTF-8' },
                status: 403,
            });
        }

        const response = await fetch(
            'https://github.com/login/oauth/access_token',
            {
                method: 'POST',
                headers: {
                    'content-type': 'application/json',
                    'user-agent': 'cloudflare-functions-github-oauth-login-demo',
                    'accept': 'application/json',
                },
                body: JSON.stringify({ client_id, client_secret, code }),
            },
        );
        const result = await response.json();
        if (result.error) {
            return new Response(renderBody('error', result, url.origin), {
                headers: {
                    'content-type': 'text/html;charset=UTF-8',
                    // 一次性 state 用完即清
                    'Set-Cookie': 'oauth_state=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0'
                },
                status: 401 
            });
        }
        const token = result.access_token;
        const provider = 'github';
        const responseBody = renderBody('success', {
            token,
            provider,
        }, url.origin);
        return new Response(responseBody, { 
            headers: {
                'content-type': 'text/html;charset=UTF-8',
                // 一次性 state 用完即清
                'Set-Cookie': 'oauth_state=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0'
            },
            status: 200 
        });

    } catch (error) {
        console.error(error);
        return new Response(error.message, {
            headers: {
                'content-type': 'text/html;charset=UTF-8',
            },
            status: 500,
        });
    }
}
