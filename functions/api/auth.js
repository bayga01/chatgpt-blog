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

    try {
        const url = new URL(request.url);
        const redirectUrl = new URL('https://github.com/login/oauth/authorize');
        redirectUrl.searchParams.set('client_id', client_id);
        redirectUrl.searchParams.set('redirect_uri', url.origin + '/api/callback');
        redirectUrl.searchParams.set('scope', 'repo user');

        // 生成随机 state 防 CSRF：同时放进授权 URL 和 HttpOnly Cookie，供回调时比对
        const stateBytes = crypto.getRandomValues(new Uint8Array(16));
        const state = Array.from(stateBytes).map(function (b) {
            return b.toString(16).padStart(2, '0');
        }).join('');
        redirectUrl.searchParams.set('state', state);

        // Response.redirect 的响应头不可修改，手动构造 302 以携带 Set-Cookie
        return new Response(null, {
            status: 302,
            headers: {
                'Location': redirectUrl.href,
                'Set-Cookie': 'oauth_state=' + state + '; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=600'
            }
        });

    } catch (error) {
        console.error(error);
        return new Response(error.message, {
            status: 500,
        });
    }
}
