import Link from 'next/link'

const footerLinks = {
  navegacion: [
    { href: '/', label: 'Inicio' },
    { href: '/catalogo', label: 'Catálogo' },
    { href: '/gift-finder', label: 'Gift Finder' },
    { href: '/armatu-regalo', label: 'Armá Tu Regalo' },
    { href: '/solistica', label: 'Solística' },
  ],
  ayuda: [
    { href: '/como-comprar', label: 'Cómo comprar' },
    { href: '/preguntas-frecuentes', label: 'Preguntas frecuentes' },
    { href: '/envios', label: 'Envíos' },
    { href: '/devoluciones', label: 'Devoluciones' },
    { href: '/contacto', label: 'Contacto' },
  ],
  wholesale: [
    { href: '/wholesale', label: 'Mayoristas' },
    { href: '/wholesale/registro', label: 'Registro mayorista' },
  ],
}

export function Footer() {
  return (
    <footer className="border-t bg-muted/50">
      <div className="container py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="text-xl font-bold text-primary">
              Regalarte
            </Link>
            <p className="mt-2 text-sm text-muted-foreground max-w-xs">
              Descubrí el regalo perfecto para cada ocasión. Inspiración, curaduría y
              momentos especiales.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-3">Navegación</h3>
            <ul className="space-y-2">
              {footerLinks.navegacion.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-3">Ayuda</h3>
            <ul className="space-y-2">
              {footerLinks.ayuda.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-3">Wholesale</h3>
            <ul className="space-y-2">
              {footerLinks.wholesale.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} Regalarte. Todos los derechos reservados.
          </p>
          <div className="flex items-center gap-4">
            <Link
              href="/terminos"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Términos y condiciones
            </Link>
            <Link
              href="/privacidad"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Privacidad
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
