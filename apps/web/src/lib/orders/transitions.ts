/**
 * Orders: maquina de estados permitida (AUDIT-005).
 *
 * Evita transiciones invalidas que corrompan la integridad de la orden
 * (p. ej. paid -> pending, rejected -> paid, fulfilled -> pending).
 *
 * Modelo (conservador, reversible solo donde el negocio lo justifica):
 *   pending    -> paid | rejected | cancelled
 *   paid       -> fulfilled | cancelled (cancelled = reembolso)
 *   rejected   -> (terminal)
 *   cancelled  -> (terminal)
 *   fulfilled  -> (terminal)
 *   from == to -> permitido (edicion sin cambio de estado)
 */

export type OrderStatus =
  | 'pending'
  | 'paid'
  | 'rejected'
  | 'cancelled'
  | 'fulfilled'

const ALLOWED: Record<OrderStatus, ReadonlySet<OrderStatus>> = {
  pending: new Set<OrderStatus>(['paid', 'rejected', 'cancelled']),
  paid: new Set<OrderStatus>(['fulfilled', 'cancelled']),
  rejected: new Set<OrderStatus>(),
  cancelled: new Set<OrderStatus>(),
  fulfilled: new Set<OrderStatus>(),
}

const VALID: ReadonlySet<string> = new Set(Object.keys(ALLOWED))

export function isOrderStatus(value: unknown): value is OrderStatus {
  return typeof value === 'string' && VALID.has(value)
}

export function canTransition(
  from: OrderStatus,
  to: OrderStatus,
): boolean {
  if (from === to) return true
  return ALLOWED[from]?.has(to) ?? false
}