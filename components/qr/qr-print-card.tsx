"use client"

import Image from "next/image"
import React from "react"
import { getImageUrl } from "@/lib/utils"

type Props = {
  restaurant: any
  qrUrl: string
}

export function QRPrintCard({ restaurant, qrUrl }: Props) {
  const logo = getImageUrl(restaurant?.logo_url || restaurant?.logo_image_url || restaurant?.logo)

  return (
    <div className="p-8 bg-white text-black print:mx-0 print:my-0">
      <div className="w-[300px] h-[400px] flex flex-col items-center justify-between border border-gray-200 p-6 rounded-2xl">
        <div className="w-full text-center">
          {logo ? (
            <div className="mx-auto mb-4 h-20 w-20 relative">
              <Image src={logo} alt={restaurant?.name || "logo"} fill sizes="80px" className="object-contain" />
            </div>
          ) : (
            <div className="h-20 w-20 mb-4 rounded-lg bg-muted/10 flex items-center justify-center text-sm">Logo</div>
          )}

          <h2 className="text-lg font-black uppercase tracking-tight">{restaurant?.name}</h2>
          {restaurant?.tagline && (
            <p className="mt-1 text-xs italic text-muted-foreground">“{restaurant.tagline}”</p>
          )}
        </div>

        <div className="w-full flex-1 flex items-center justify-center">
          <img
            src={`https://api.qrserver.com/v1/create-qr-code/?size=600x600&data=${encodeURIComponent(qrUrl)}`}
            alt="QR Code"
            className="h-56 w-56"
          />
        </div>

        <div className="w-full text-center">
          <p className="text-[10px] uppercase tracking-widest font-black">Scan to view menu</p>
          <p className="mt-2 text-xs text-muted-foreground">{restaurant?.address || ""}</p>
        </div>
      </div>
    </div>
  )
}

export default QRPrintCard
