export default function EstadoVacio({ titulo, children }) {
  return (
    <div className="vacio">
      <span className="vacio-icono" aria-hidden="true">◌</span>
      <p className="vacio-titulo">{titulo}</p>
      {children}
    </div>
  );
}
