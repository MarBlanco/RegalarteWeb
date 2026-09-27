import { describe, it, expect } from 'vitest'
import {
  buildProfileForm,
  snapshotProfile,
  isProfileDirty,
  validateExtraAddress,
} from './profile'

const USER = {
  name: 'Guale',
  phone: '111',
  address: null,
  addresses: [],
}

describe('Mi cuenta — snapshot y dirty', () => {
  it('construye defaults y detecta cambios', () => {
    const form = buildProfileForm(USER)
    const saved = snapshotProfile(form)
    expect(isProfileDirty(form, saved)).toBe(false)
    expect(
      isProfileDirty({ ...form, name: 'Otro' }, saved),
    ).toBe(true)
    expect(
      isProfileDirty(
        { ...form, address: { ...form.address, street: 'X' } },
        saved,
      ),
    ).toBe(true)
  })

  it('ignora espacios y teléfono oculto', () => {
    const form = buildProfileForm(USER)
    const saved = snapshotProfile(form)
    expect(
      isProfileDirty({ ...form, name: '  Guale  ' }, saved),
    ).toBe(false)
    const withAlt = {
      ...form,
      showAltPhone: false,
      phoneAlt: '999',
    }
    expect(isProfileDirty(withAlt, saved)).toBe(false)
  })
})

describe('Mi cuenta — validación de dirección adicional', () => {
  it('exige campos mínimos', () => {
    const errs = validateExtraAddress({
      label: '',
      street: '',
      number: '',
      postalCode: '',
      locality: '',
      province: '',
    })
    expect(Object.keys(errs).sort()).toEqual(
      ['label', 'locality', 'number', 'postalCode', 'province', 'street'].sort(),
    )
  })

  it('acepta completa', () => {
    expect(
      validateExtraAddress({
        label: 'Trabajo',
        street: 'Urquiza',
        number: '567',
        postalCode: '3260',
        locality: 'Concepción',
        province: 'Entre Ríos',
      }),
    ).toEqual({})
  })
})
