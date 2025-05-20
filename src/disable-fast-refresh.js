// Este arquivo desativa completamente o Fast Refresh do React e o HMR do Vite
// para evitar recargas desnecessárias quando a janela ganha foco

// Desativar completamente o HMR
if (import.meta.hot) {
  // Desativar o Fast Refresh
  import.meta.hot.decline();

  // Desativar o HMR para todos os módulos
  import.meta.hot.dispose(() => {
    console.log('HMR desativado para evitar recargas desnecessárias');
  });

  // Sobrescrever a função de aceitação para não fazer nada
  import.meta.hot.accept = () => {};
}

// Desativar o evento de visibilidade que pode causar recargas
document.addEventListener('visibilitychange', (e) => {
  e.preventDefault();
  e.stopPropagation();
  console.log('Evento visibilitychange interceptado e bloqueado');
  return false;
}, true);

// Desativar o evento de foco que pode causar recargas
window.addEventListener('focus', (e) => {
  e.preventDefault();
  e.stopPropagation();
  console.log('Evento focus interceptado e bloqueado');
  return false;
}, true);

// Desativar o evento de blur que pode causar recargas
window.addEventListener('blur', (e) => {
  e.preventDefault();
  e.stopPropagation();
  console.log('Evento blur interceptado e bloqueado');
  return false;
}, true);

console.log('Fast Refresh, HMR e eventos de visibilidade completamente desativados');
