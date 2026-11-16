// Navegación entre páginas con la meta que devuelve la API ({ pagina, totalPaginas, total }).
export default function Paginador({ meta, onCambiar }) {
  if (!meta || meta.totalPaginas <= 1) return null;
  const { pagina, totalPaginas } = meta;
  return (
    <nav className="paginador" aria-label="Paginación">
      <button type="button" className="btn-accion" onClick={() => onCambiar(pagina - 1)} disabled={pagina <= 1}>
        ← Anterior
      </button>
      <span aria-live="polite">Página {pagina} de {totalPaginas}</span>
      <button type="button" className="btn-accion" onClick={() => onCambiar(pagina + 1)} disabled={pagina >= totalPaginas}>
        Siguiente →
      </button>
    </nav>
  );
}
