import { useEffect, useRef } from 'react';

// Diálogo modal nativo: atrapa el foco, se cierra con Escape y devuelve el foco al botón que lo abrió.
export default function ConfirmarDialogo({ abierto, titulo, mensaje, textoConfirmar = 'Eliminar', ocupado = false, onConfirmar, onCancelar }) {
  const ref = useRef(null);
  useEffect(() => {
    const dialogo = ref.current;
    if (!dialogo) return;
    if (abierto && !dialogo.open) dialogo.showModal();
    if (!abierto && dialogo.open) dialogo.close();
  }, [abierto]);

  return (
    <dialog ref={ref} aria-labelledby="titulo-dialogo" onCancel={(e) => { e.preventDefault(); onCancelar(); }}>
      <div className="dialogo-cuerpo">
        <h2 id="titulo-dialogo">{titulo}</h2>
        <p>{mensaje}</p>
        <div className="acciones-form">
          <button type="button" className="btn-accion" onClick={onCancelar} disabled={ocupado}>Cancelar</button>
          <button type="button" className="btn btn-peligro" onClick={onConfirmar} disabled={ocupado}>
            {ocupado ? 'Procesando…' : textoConfirmar}
          </button>
        </div>
      </div>
    </dialog>
  );
}
