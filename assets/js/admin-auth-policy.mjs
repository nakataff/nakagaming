export const ADMIN_EMAIL = 'admin@centralfreefire.com.br';
export const ADMIN_PATHS = new Set(['/admin/', '/admin/site/', '/admin/equipes/', '/admin/competitivo/', '/admin/noticias/', '/admin/guilda/', '/admin/backup/']);
export function isAdminUser(user) {
  return !!user && typeof user.uid === 'string' && !!user.uid && user.email === ADMIN_EMAIL;
}
export function safeAdminPath(value) {
  return ADMIN_PATHS.has(value) ? value : '/admin/';
}
export function assertAdmin(user) {
  if (!isAdminUser(user)) throw Object.assign(new Error('Entre com a conta administrativa da Central Free Fire.'), {code:'naka/auth-required'});
  return user;
}
export function authMessage(error) {
  const code = String(error?.code || '');
  if (code === 'naka/domain-blocked' || code === 'auth/app-not-authorized' || (code.includes('requests-from-referer') && code.includes('blocked'))) return 'O Google Cloud ainda não liberou nakagaming.com.br para esta chave do Firebase. Adicione o domínio nas restrições de sites da chave; sua senha não foi validada.';
  if (['auth/invalid-credential','auth/wrong-password','auth/user-not-found','auth/invalid-login-credentials'].includes(code)) return 'Não foi possível entrar. Confira a senha do painel da Central Free Fire.';
  if (code === 'auth/too-many-requests') return 'Muitas tentativas. Aguarde um pouco antes de tentar novamente.';
  if (code === 'auth/network-request-failed') return 'Não foi possível conectar. Confira sua conexão e tente novamente.';
  if (code === 'auth/user-disabled') return 'Esta conta está desativada. Confira o cadastro no Firebase.';
  if (code === 'auth/unauthorized-domain') return 'O domínio da Naka ainda precisa ser autorizado no Firebase Authentication.';
  if (code === 'auth/operation-not-allowed') return 'O login por senha não está habilitado neste projeto Firebase.';
  if (code === 'naka/auth-required') return error.message;
  return 'Não foi possível concluir o acesso. Tente novamente ou confira a configuração do Firebase.';
}
