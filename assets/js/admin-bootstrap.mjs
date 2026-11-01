// Falha fechada: sem autenticação ou módulos, a área e os dados não são abertos.
try { await import('./admin.mjs?v=20261101-bulk'); }
catch {
  const message = document.querySelector('#auth-loading-message');
  if (message) message.textContent = 'Não foi possível conectar ao serviço de acesso. Confira a conexão e recarregue esta página.';
}
