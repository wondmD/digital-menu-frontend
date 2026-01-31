import React from 'react'
import { getImageUrl } from '@/lib/utils'
import { Smartphone, Globe, Info, Utensils } from 'lucide-react'

interface QRPrintCardProps {
  restaurant: {
    name: string
    logo?: string
    logo_url?: string
    logo_image_url?: string
    description?: string
    address?: string
    phone?: string
  }
  qrUrl: string
}

export const QRPrintCard: React.FC<QRPrintCardProps> = ({ restaurant, qrUrl }) => {
  const logo = getImageUrl(
    restaurant.logo_url || 
    restaurant.logo_image_url || 
    restaurant.logo
  )

  return (
    <div className="w-[3in] h-[4in] bg-white border border-gray-100 shadow-2xl flex flex-col items-center justify-between p-4 text-black font-sans mx-auto overflow-hidden print:border-0 print:shadow-none print:m-0 relative">
      {/* Decorative Brand Accent */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-primary via-red-400 to-primary" />
      
      {/* Top Section: Brand Identity */}
      <div className="w-full flex flex-col items-center gap-2 pt-4">
        {logo ? (
          <div className="h-14 w-14 rounded-full bg-white flex items-center justify-center overflow-hidden border-2 border-gray-50 shadow-md">
            <img src={logo} alt={restaurant.name} className="h-full w-full object-cover" />
          </div>
        ) : (
          <div className="h-14 w-14 rounded-full bg-gray-50 flex items-center justify-center border-2 border-dashed border-gray-200">
             <Utensils className="h-6 w-6 text-gray-300" />
          </div>
        )}
        <div className="text-center space-y-0.5">
          <h2 className="text-lg font-black uppercase tracking-tight leading-tight">
            {restaurant.name}
          </h2>
          <p className="text-[7px] text-gray-400 font-bold uppercase tracking-[0.2em] italic max-w-[2.2in] truncate">
            {restaurant.description || "Digital Menu Experience"}
          </p>
        </div>
      </div>

      {/* Middle Section: High-Impact QR */}
      <div className="flex-1 flex flex-col items-center justify-center w-full py-2">
        <div className="relative p-3 bg-white rounded-[2rem] shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] border border-gray-50">
           <img 
             src={`https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(qrUrl)}`}
             alt="Menu QR"
             className="h-32 w-32 md:h-36 md:w-36"
           />
           {/* Scan Corner Markers */}
           <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-primary rounded-tl-lg" />
           <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-primary rounded-tr-lg" />
           <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-primary rounded-bl-lg" />
           <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-primary rounded-br-lg" />
        </div>
        
        <div className="mt-3 flex flex-col items-center gap-1">
          <div className="bg-primary text-white px-4 py-1.5 rounded-full shadow-lg">
             <p className="text-[9px] font-black uppercase tracking-[0.15em]">Scan to View Menu</p>
          </div>
          <p className="text-[6px] font-bold text-gray-400 uppercase tracking-widest mt-1">
            Browse our full menu instantly
          </p>
        </div>
      </div>

      {/* Information Grid: Enriching the card with real data */}
      <div className="w-full bg-gray-50/50 rounded-2xl p-3 grid grid-cols-2 gap-2 border border-gray-100">
        <div className="flex items-start gap-2">
           <Smartphone className="h-3 w-3 text-primary shrink-0" />
           <div className="flex flex-col">
              <span className="text-[6px] font-black uppercase text-gray-400 tracking-tighter">Fast Access</span>
              <span className="text-[7px] font-bold text-gray-700 leading-none">No App Required</span>
           </div>
        </div>
        <div className="flex items-start gap-2">
           <Globe className="h-3 w-3 text-primary shrink-0" />
           <div className="flex flex-col">
              <span className="text-[6px] font-black uppercase text-gray-400 tracking-tighter">Availability</span>
              <span className="text-[7px] font-bold text-gray-700 leading-none truncate w-20">{restaurant.address || "Live Menu"}</span>
           </div>
        </div>
        <div className="flex items-start gap-2 col-span-2 border-t border-gray-100 pt-2 mt-0.5">
           <Info className="h-3 w-3 text-primary shrink-0" />
           <p className="text-[6px] font-medium text-gray-500 leading-tight">
             Open your phone camera and point it at the QR code to browse our latest dishes, prices, and specials.
           </p>
        </div>
      </div>

      {/* Footer */}
      <div className="w-full pt-2 pb-1 flex justify-between items-center opacity-40">
        <span className="text-[5px] font-bold uppercase tracking-[0.3em]">Agelgil Digital Menu</span>
        <div className="flex gap-1">
          <div className="h-1 w-1 rounded-full bg-gray-300" />
          <div className="h-1 w-1 rounded-full bg-primary" />
          <div className="h-1 w-1 rounded-full bg-gray-300" />
        </div>
      </div>
    </div>
  )
}
