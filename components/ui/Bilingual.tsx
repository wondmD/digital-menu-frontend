"use client"

import React from "react"
import {useTranslations} from "next-intl"
import amMessages from "../../messages/am.json"

function getNested(obj: any, path: string) {
  return path.split('.').reduce((acc, p) => (acc && acc[p] !== undefined) ? acc[p] : undefined, obj)
}

export default function Bilingual({ ns, id, className }: { ns: string; id: string; className?: string }) {
  const t = useTranslations(ns)
  const english = t(id)
  const am = getNested(amMessages[ns] || {}, id) || ""

  return (
    <span className={className}>
      {english} {am ? <>| <span className="italic">{am}</span></> : null}
    </span>
  )
}
