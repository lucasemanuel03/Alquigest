export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center h-screen text-center bg-background">
      <h1 className="text-4xl font-bold mb-4">404 - Página no encontrada</h1>
      <p className="text-muted-foreground mb-6">
        Lo sentimos 😞, la página que buscás no existe o fue movida.
      </p>
      <p className="text-muted-foreground mb-6">
        Atte. Equipo Alquigest
      </p>
      <a
        href="/"
        className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/80 transition"
      >
        Volver al inicio
      </a>
    </div>
  )
}
