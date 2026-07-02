import React from "react";
import { Sponsor, User } from "../types";
import { mockSponsors } from "../mockData";
import SponsorCard from "./SponsorCard";
import { Store, ShieldAlert, Award, Handshake, Coins } from "lucide-react";
import { motion } from "motion/react";

interface SponsorsViewProps {
  claimedCodes: { [key: string]: boolean };
  onClaim: (sponsor: Sponsor) => void;
  currentUser: User;
}

export default function SponsorsView({ claimedCodes, onClaim, currentUser }: SponsorsViewProps) {
  return (
    <div className="space-y-8" id="sponsors-view">
      {/* Header card explaining monetization/partnership */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-amber-600 via-amber-700 to-amber-900 text-white rounded-3xl p-6 md:p-8 shadow-sm flex flex-col md:flex-row gap-6 items-center"
      >
        <div className="space-y-4 flex-1">
          <div className="inline-flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full text-xs font-semibold text-amber-200">
            <Handshake className="w-4 h-4" />
            <span>Alianza de Comercios de Málaga</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Comunidades que orbitan en torno a planes compartidos
          </h2>
          <p className="text-sm md:text-base text-amber-50 leading-relaxed max-w-2xl">
            <strong>Gravita</strong> colabora de forma activa con cafeterías, restaurantes y espacios culturales malagueños. 
            Ayudamos a combatir la soledad uniendo grupos de personas con ofertas exclusivas que puedes canjear usando tus <strong>Kronos</strong>, la moneda de conexión de la plataforma. ¡Organiza planes o únete a ellos para orbitar y acumular Kronos!
          </p>
          <div className="flex flex-wrap gap-4 pt-2 text-xs font-semibold text-amber-100">
            <div className="flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-300" />
              <span>Descuentos para Grupos Platónicos</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Coins className="w-4 h-4 text-amber-300" />
              <span>Sistema de Tokens Kronos Gamificados</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Store className="w-4 h-4 text-amber-300" />
              <span>Comercios 100% Reales y Ficticios de Málaga</span>
            </div>
          </div>
        </div>
        
        {/* Fun visual icon */}
        <div className="bg-white/10 p-5 rounded-2xl border border-white/20 flex flex-col items-center justify-center text-center shrink-0 w-44">
          <Coins className="w-12 h-12 text-amber-300 mb-2 animate-bounce" />
          <span className="text-xl font-bold font-mono">8 Aliados</span>
          <span className="text-[10px] text-amber-200 mt-1 uppercase tracking-widest font-extrabold">Canjes con Kronos</span>
        </div>
      </motion.div>

      {/* Grid of Sponsors */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-gray-900">Nuestros Comercios Amigos</h3>
          <span className="text-xs text-gray-500 font-medium font-mono">Total: 8 Aliados en Málaga</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {mockSponsors.map((sponsor) => (
            <SponsorCard
              key={sponsor.id}
              sponsor={sponsor}
              onClaim={() => onClaim(sponsor)}
              claimedCodes={claimedCodes}
              currentUser={currentUser}
            />
          ))}
        </div>
      </div>

      {/* Disclaimer on sponsor realness */}
      <div className="bg-gray-50 rounded-2xl border border-gray-100 p-4 flex gap-3 text-xs text-gray-500 items-start">
        <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold text-gray-700">Nota sobre Comercios en el Prototipo:</span>
          <p className="leading-relaxed">
            Nuestros patrocinadores destacados estrella (<strong className="text-gray-700 font-semibold">Eva Málaga</strong>, <strong className="text-gray-700 font-semibold">Casa Kiki</strong>, y <strong className="text-gray-700 font-semibold">Waw Cafe</strong>) representan marcas comerciales reales en Málaga con promociones lógicas simuladas para el hackathon. Los otros 5 comercios son ficticios, diseñados con propósitos de demostración técnica del modelo de monetización.
          </p>
        </div>
      </div>
    </div>
  );
}
