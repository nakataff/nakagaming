// Confere o acesso público ao serviço antes de solicitar a senha.
// Não envia email, senha nem token nessa verificação.
export async function verifyAuthAccess(fetcher, apiKey) {
  let response;
  try {
    response = await fetcher('https://identitytoolkit.googleapis.com/v1/projects?key=' + encodeURIComponent(apiKey), {
      referrerPolicy:'strict-origin-when-cross-origin'
    });
  } catch {
    throw Object.assign(new Error('Não foi possível conectar ao serviço de acesso.'), {code:'auth/network-request-failed'});
  }
  if (response.ok) return;
  const payload = await response.json().catch(() => ({}));
  const details = payload.error?.details || [];
  const blocked = details.some((item) => item.reason === 'API_KEY_HTTP_REFERRER_BLOCKED')
    || /requests from referer .* are blocked/i.test(payload.error?.message || '');
  throw Object.assign(new Error('O serviço de acesso recusou a configuração deste site.'), {
    code:blocked ? 'naka/domain-blocked' : 'naka/auth-service-error'
  });
}
