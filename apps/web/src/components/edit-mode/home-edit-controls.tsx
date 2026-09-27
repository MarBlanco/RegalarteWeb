'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { EditButton } from './edit-button'
import { EditModal, type EditField } from './edit-modal'
import { saveHomeContentPatch } from './api'
import type {
  HomeBenefitIcon,
  HomeCategorySlug,
} from '@/lib/home-content'

const CATEGORY_OPTIONS = [
  { value: 'velas', label: 'Velas' },
  { value: 'aromas', label: 'Aromas' },
  { value: 'wax-melts', label: 'Wax-Melts' },
  { value: 'quemadores', label: 'Quemadores' },
  { value: 'packs', label: 'Packs' },
  { value: 'regalarte', label: 'Regalarte' },
]

const ICON_OPTIONS = [
  { value: 'shipping', label: 'Envíos' },
  { value: 'packaging', label: 'Packaging' },
  { value: 'payment', label: 'Pagos' },
  { value: 'leaf', label: 'Hoja / Bienestar' },
  { value: 'support', label: 'Atención' },
]

export interface SectionMetaInput {
  categorySlug: HomeCategorySlug
  title: string
  description: string
}

export interface BenefitInput {
  icon: HomeBenefitIcon
  title: string
  description: string
}

function useSave() {
  const router = useRouter()
  const token = useAuth((s) => s.token)
  return async (patch: Record<string, unknown>) => {
    if (!token) throw new Error('Sesión vencida. Volvé a iniciar sesión.')
    await saveHomeContentPatch(patch, token)
    router.refresh()
  }
}

/** Editar título/texto comercial de una sección de la Home. */
export function SectionEditButton({
  sections,
  categorySlug,
}: {
  sections: SectionMetaInput[]
  categorySlug: string
}) {
  const [open, setOpen] = useState(false)
  const save = useSave()
  const meta = sections.find((s) => s.categorySlug === categorySlug)
  if (!meta) return null
  const fields: EditField[] = [
    { name: 'title', label: 'Título de la sección', type: 'text', maxLength: 80 },
    { name: 'description', label: 'Texto comercial', type: 'textarea', maxLength: 300 },
  ]
  return (
    <>
      <EditButton onClick={() => setOpen(true)} />
      {open ? (
        <EditModal
          title={`Editar sección: ${meta.title}`}
          fields={fields}
          initialValues={{ title: meta.title, description: meta.description }}
          onClose={() => setOpen(false)}
          onSave={async (values) => {
            await save({
              sections: sections.map((s) =>
                s.categorySlug === categorySlug
                  ? {
                      categorySlug,
                      title: values.title,
                      description: values.description,
                    }
                  : s,
              ),
            })
          }}
        />
      ) : null}
    </>
  )
}

/** Editar intro debajo del Hero. */
export function IntroEditButton({
  intro,
}: {
  intro: { title: string; description: string }
}) {
  const [open, setOpen] = useState(false)
  const save = useSave()
  const fields: EditField[] = [
    { name: 'title', label: 'Título', type: 'text', maxLength: 200 },
    { name: 'description', label: 'Descripción', type: 'textarea', maxLength: 600 },
  ]
  return (
    <>
      <EditButton onClick={() => setOpen(true)} />
      {open ? (
        <EditModal
          title="Editar intro"
          fields={fields}
          initialValues={{ title: intro.title, description: intro.description }}
          onClose={() => setOpen(false)}
          onSave={async (values) => {
            await save({ intro: { title: values.title, description: values.description } })
          }}
        />
      ) : null}
    </>
  )
}

/** Editar un beneficio (ícono, título y texto). */
export function BenefitEditButton({
  benefits,
  index,
}: {
  benefits: BenefitInput[]
  index: number
}) {
  const [open, setOpen] = useState(false)
  const save = useSave()
  const benefit = benefits[index]
  if (!benefit) return null
  const fields: EditField[] = [
    { name: 'icon', label: 'Ícono', type: 'select', options: ICON_OPTIONS },
    { name: 'title', label: 'Título', type: 'text', maxLength: 80 },
    { name: 'description', label: 'Texto', type: 'textarea', maxLength: 200 },
  ]
  return (
    <>
      <EditButton onClick={() => setOpen(true)} className="absolute right-2 top-2" />
      {open ? (
        <EditModal
          title={`Editar beneficio: ${benefit.title}`}
          fields={fields}
          initialValues={{
            icon: benefit.icon,
            title: benefit.title,
            description: benefit.description,
          }}
          onClose={() => setOpen(false)}
          onSave={async (values) => {
            await save({
              benefits: benefits.map((b, i) =>
                i === index
                  ? {
                      icon: values.icon,
                      title: values.title,
                      description: values.description,
                    }
                  : b,
              ),
            })
          }}
        />
      ) : null}
    </>
  )
}

export { CATEGORY_OPTIONS }
