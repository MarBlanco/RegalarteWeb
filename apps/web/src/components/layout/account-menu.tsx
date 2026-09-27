'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useEditMode, useIsStaff } from '@/hooks/use-edit-mode'
function ChevronDown({ className = 'h-3.5 w-3.5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}

function ChevronRight({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  )
}

function UserIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5" />
    </svg>
  )
}

function BagIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M6 7h15l1.5 13.5a1 1 0 0 1-1 1.1H7.6a1 1 0 0 1-1-1.1L6 7z" />
      <path d="M9 10V6a3 3 0 0 1 6 0v4" />
    </svg>
  )
}

function HeartIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    </svg>
  )
}

function PencilIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
    </svg>
  )
}

function LogoutIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <path d="M21 12H9" />
    </svg>
  )
}

function ShieldIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  )
}

/**
 * Account Menu único del header (reemplaza la personita).
 * Un solo componente para visitante/cliente/staff/admin: las opciones se
 * determinan por la sesión y el rol reales. Sin usuarios hardcodeados.
 */
export function AccountMenu() {
  const router = useRouter()
  const pathname = usePathname()
  const user = useAuth((s) => s.user)
  const token = useAuth((s) => s.token)
  const logout = useAuth((s) => s.logout)
  const isStaff = useIsStaff()
  const setViewAsClient = useEditMode((s) => s.setViewAsClient)
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  const authenticated = !!user && !!token
  const isAdmin = user?.role === 'admin'

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!open) return
    function onPointerDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  function handleLogout() {
    logout()
    setViewAsClient(false)
    setOpen(false)
    router.push('/')
  }

  const firstName = (user?.name ?? '').split(' ')[0] || 'Cuenta'
  const initial = (firstName.charAt(0) || '?').toUpperCase()

  const rowCls =
    'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-[#1F1B16] transition-colors hover:bg-[#F5EFE7]'

  function Row({
    href,
    onClick,
    icon,
    children,
  }: {
    href?: string
    onClick?: () => void
    icon: React.ReactNode
    children: React.ReactNode
  }) {
    const cls = `${rowCls} min-w-0`
    const inner = (
      <>
        <span className="shrink-0 text-[#38271D]">{icon}</span>
        <span className="min-w-0 flex-1 truncate">{children}</span>
        <ChevronRight className="h-4 w-4 shrink-0 text-[#C4B8A8]" />
      </>
    )
    if (href) {
      return (
        <Link
          href={href}
          onClick={() => {
            onClick?.()
            setOpen(false)
          }}
          role="menuitem"
          className={cls}
        >
          {inner}
        </Link>
      )
    }
    return (
      <button
        type="button"
        onClick={() => {
          onClick?.()
          setOpen(false)
        }}
        role="menuitem"
        className={cls}
      >
        {inner}
      </button>
    )
  }

  return (
    <div ref={rootRef} className="relative flex-shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={authenticated ? `Cuenta de ${firstName}` : 'Ingresar a tu cuenta'}
        className="flex h-10 items-center gap-2 rounded-full border border-[#E5DDD1] bg-white py-1 pl-1.5 pr-3 text-[#38271D] shadow-sm transition-colors hover:border-[#C45A37]/50 sm:h-11"
      >
        {authenticated ? (
          <span
            aria-hidden="true"
            className="flex h-7 w-7 items-center justify-center rounded-full bg-[#B85C33] text-[13px] font-bold text-white sm:h-8 sm:w-8"
          >
            {initial}
          </span>
        ) : (
          <span className="flex h-7 w-7 items-center justify-center sm:h-8 sm:w-8">
            <UserIcon className="h-5 w-5" />
          </span>
        )}
        <span className="hidden whitespace-nowrap text-[13px] font-semibold sm:inline">
          {authenticated ? `Hola, ${firstName}` : 'Ingresar'}
        </span>
        <ChevronDown
          className={`h-3.5 w-3.5 shrink-0 text-[#7A6A5D] transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open ? (
        <div
          role="menu"
          aria-label="Menú de cuenta"
          className="absolute right-0 top-[calc(100%+8px)] z-50 max-h-[80vh] w-[320px] max-w-[calc(100vw-2rem)] overflow-y-auto rounded-xl border border-[#EBDFD1] bg-white p-2 shadow-[0_12px_40px_rgba(56,39,29,0.16)]"
        >
          {authenticated ? (
            <div className="flex items-center gap-3 px-3 pb-2 pt-3">
              <span
                aria-hidden="true"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#F3EADB] text-lg font-bold text-[#B85C33]"
              >
                {initial}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-[#1F1B16]">
                  Hola, {firstName}
                </p>
                <p className="truncate text-xs text-[#7A6A5D]">{user?.email}</p>
                {isAdmin ? (
                  <span className="mt-1 inline-block rounded-full bg-[#38271D] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                    Administrador
                  </span>
                ) : null}
                {!isAdmin && isStaff ? (
                  <span className="mt-1 inline-block rounded-full bg-[#F3EADB] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#8A5A33]">
                    Staff
                  </span>
                ) : null}
              </div>
            </div>
          ) : null}

          <div className={authenticated ? 'mt-1 border-t border-[#EBDFD1] pt-1' : ''}>
            {!authenticated ? (
              <>
                <Row href="/auth/login" icon={<UserIcon />}>
                  Iniciar sesión
                </Row>
                <Row href="/auth/register" icon={<PencilIcon />}>
                  Crear cuenta
                </Row>
              </>
            ) : (
              <>
                <Row href="/orders" icon={<BagIcon />}>
                  Compras
                </Row>
                <Row href="/wishlist" icon={<HeartIcon />}>
                  Favoritos
                </Row>
                <Row href="/profile" icon={<UserIcon />}>
                  Información
                </Row>

                {isStaff ? (
                  <>
                    {isAdmin ? (
                      <>
                        <div className="my-1 border-t border-[#EBDFD1]" aria-hidden="true" />
                        <Row href="/admin" icon={<ShieldIcon />}>
                          Administración
                        </Row>
                      </>
                    ) : null}
                  </>
                ) : null}

                <div className="my-1 border-t border-[#EBDFD1]" aria-hidden="true" />
                <Row onClick={handleLogout} icon={<LogoutIcon />}>
                  Cerrar sesión
                </Row>
              </>
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}
