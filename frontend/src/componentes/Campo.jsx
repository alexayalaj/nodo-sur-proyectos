// Etiqueta + control + mensaje de error asociado (aria-invalid y aria-describedby).
export default function Campo({ id, etiqueta, error, ayuda, children }) {
  const idError = `${id}-error`;
  const idAyuda = `${id}-ayuda`;
  const descripcion = [error ? idError : null, ayuda ? idAyuda : null].filter(Boolean).join(' ') || undefined;
  return (
    <div className="campo">
      <label htmlFor={id}>{etiqueta}</label>
      {children({ id, 'aria-invalid': error ? 'true' : undefined, 'aria-describedby': descripcion, className: error ? 'invalido' : undefined })}
      {ayuda && <p id={idAyuda} className="ayuda">{ayuda}</p>}
      {error && <p id={idError} className="error-campo">{error}</p>}
    </div>
  );
}
