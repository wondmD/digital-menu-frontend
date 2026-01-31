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
    <div className="w-[3in] h-[4in] bg-white border border-gray-100 shadow-2xl flex flex-col items-center justify-between p-4 text-black font-sans mx-auto overflow-hidden print:border-0 print:shadow-none print:m-0 relative group">
      {/* --- GRAPHICAL BACKGROUND ELEMENTS --- */}
      {/* Top Abstract Shape */}
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/5 rounded-full blur-3xl -z-10" />
      <div className="absolute top-0 right-0 w-24 h-24 -z-10 opacity-[0.03]">
        <svg viewBox="0 0 100 100" className="w-full h-full fill-primary">
          <path d="M0,0 L100,0 L100,100 C50,100 0,50 0,0 Z" />
        </svg>
      </div>
      
      {/* Bottom Abstract Shape */}
      <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-secondary/5 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-0 left-0 w-32 h-32 -z-10 opacity-[0.02] rotate-180">
        <svg viewBox="0 0 100 100" className="w-full h-full fill-primary">
          <circle cx="50" cy="50" r="50" />
        </svg>
      </div>

      {/* Subtle Grid Pattern */}
      <div className="absolute inset-0 opacity-[0.01] -z-20" 
           style={{ backgroundImage: 'radial-gradient(#000 0.5px, transparent 0.5px)', backgroundSize: '10px 10px' }} 
      />

      {/* Brand Accent Bar */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-primary via-red-500 to-primary/80" />
      
      {/* --- TOP SECTION: BRAND IDENTITY --- */}
      <div className="w-full flex flex-col items-center gap-2 pt-4 relative">
        <div className="relative">
          {/* Logo glow */}
          <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full -z-10" />
          {logo ? (
            <div className="h-16 w-16 rounded-2xl bg-white flex items-center justify-center overflow-hidden border-2 border-white shadow-xl rotate-3">
              <img src={logo} alt={restaurant.name} className="h-full w-full object-cover -rotate-3" />
            </div>
          ) : (
            <div className="h-16 w-16 rounded-2xl bg-gray-50 flex items-center justify-center border-2 border-dashed border-gray-200 rotate-3">
               <Utensils className="h-7 w-7 text-primary/30 -rotate-3" />
            </div>
          )}
        </div>
        <div className="text-center space-y-0.5 mt-2">
          <h2 className="text-xl font-black uppercase tracking-tighter leading-tight text-gray-900">
            {restaurant.name}
          </h2>
          <div className="flex items-center justify-center gap-2">
            <div className="h-[1px] w-4 bg-primary/30" />
            <p className="text-[7px] text-primary font-black uppercase tracking-[0.25em] italic">
              {restaurant.description ? restaurant.description.split(' ').slice(0, 4).join(' ') : "Gourmet Experience"}
            </p>
            <div className="h-[1px] w-4 bg-primary/30" />
          </div>
        </div>
      </div>

      {/* --- MIDDLE SECTION: QR --- */}
      <div className="flex-1 flex flex-col items-center justify-center w-full py-2 relative">
        <div className="relative p-4 bg-white rounded-[2.5rem] shadow-[0_20px_50px_-15px_rgba(0,0,0,0.15)] border border-gray-50 group-hover:scale-105 transition-transform">
           <img 
             src={`https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(qrUrl)}`}
             alt="Menu QR"
             className="h-32 w-32"
           />
           {/* Scan Corner Markers - Stylized */}
           <div className="absolute -top-2 -left-2 w-6 h-6 border-t-[3px] border-l-[3px] border-primary rounded-tl-xl" />
           <div className="absolute -top-2 -right-2 w-6 h-6 border-t-[3px] border-r-[3px] border-primary rounded-tr-xl" />
           <div className="absolute -bottom-2 -left-2 w-6 h-6 border-b-[3px] border-l-[3px] border-primary rounded-bl-xl" />
           <div className="absolute -bottom-2 -right-2 w-6 h-6 border-b-[3px] border-r-[3px] border-primary rounded-br-xl" />
        </div>
        
        <div className="mt-5 flex flex-col items-center">
          <div className="bg-black text-white px-6 py-2 rounded-full shadow-2xl scale-110">
             <p className="text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2">
                <Smartphone className="h-3 w-3 text-primary animate-pulse" />
                Scan for Menu
             </p>
          </div>
          <p className="text-[6px] font-bold text-gray-400 uppercase tracking-[0.3em] mt-3">
            Open camera & point to scan
          </p>
        </div>
      </div>

      {/* --- INFO GRID --- */}
      <div className="w-full bg-white/40 backdrop-blur-sm rounded-3xl p-3.5 border border-white shadow-sm space-y-2">
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2">
             <div className="h-5 w-5 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Globe className="h-3 w-3 text-primary" />
             </div>
             <div className="flex flex-col min-w-0">
                <span className="text-[5.5px] font-black uppercase text-gray-400 tracking-tighter">Powered By</span>
                <span className="text-[7px] font-bold text-gray-800 leading-none truncate overflow-hidden">Agelgil Digital</span>
             </div>
          </div>
          <div className="flex items-center gap-2">
             <div className="h-5 w-5 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Utensils className="h-3 w-3 text-primary" />
             </div>
             <div className="flex flex-col min-w-0">
                <span className="text-[5.5px] font-black uppercase text-gray-400 tracking-tighter">Location</span>
                <span className="text-[7px] font-bold text-gray-800 leading-none truncate italic">
                  {restaurant.address || "Main Branch"}
                </span>
             </div>
          </div>
        </div>
        <p className="text-[6.5px] font-medium text-gray-500 leading-tight text-center border-t border-gray-100 pt-2 px-2">
          Fast, hygiene-first digital menu access. <br/> No physical contact required.
        </p>
      </div>

      {/* --- FOOTER: POWERED BY AGELGIL --- */}
      <div className="w-full pt-3 pb-1 flex flex-col items-center gap-1.5 grayscale-[0.2]">
        <div className="flex items-center gap-3">
          <div className="h-[1px] w-8 bg-gray-200" />
          <a href="https://agelgil.com" className="flex items-center gap-1.5 no-underline">
             {/* Simple Logo Decoration */}
             <div className="h-4 w-4 rounded-md bg-primary flex items-center justify-center rotate-45">
                <span className="text-[8px] text-white font-black -rotate-45">A</span>
             </div>
             <span className="text-[8px] font-black uppercase tracking-[0.2em] text-gray-800">
               www.<span className="text-primary italic">agelgil</span>.com
             </span>
          </a>
          <div className="h-[1px] w-8 bg-gray-200" />
        </div>
        <p className="text-[5px] font-black text-gray-300 uppercase tracking-[0.5em]">Digitalizing Hospitality</p>
      </div>
    </div>
  )
}
