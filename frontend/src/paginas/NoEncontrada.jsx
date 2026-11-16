import { useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function NoEncontrada() {
  useEffect(() => { document.title = 'Página no encontrada · Proyectos Nodo Sur'; }, []);
  return (
    <section className="tarjeta centrado" aria-labelledby="titulo">
      <h1 id="titulo">Página no encontrada</h1>
      <p>La dirección que buscas no existe o fue movida.</p>
      <Link className="btn" to="/">Ir al inicio</Link>
    </section>
  );
}
