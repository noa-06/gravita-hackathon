import React from "react";
import { Sponsor, User } from "../types";
import { Gift, MapPin, CheckCircle, Store, Coins, Lock } from "lucide-react";
import { motion } from "motion/react";

interface SponsorCardProps {
  key?: string;
  sponsor: Sponsor;
  onClaim: () => void;
  claimedCodes: { [key: string]: boolean };
  currentUser: User;
}

export default function SponsorCard({ sponsor, onClaim, claimedCodes, currentUser }: SponsorCardProps) {
  const isClaimed = claimedCodes[sponsor.id];
  const hasEnoughKronos = currentUser.kronos >= sponsor.kronoCost;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, transition: { duration: 0.15 } }}
      className={`bg-white rounded-2xl border-2 ${
        isClaimed 
          ? "border-emerald-200 bg-emerald-50/10" 
          : !hasEnoughKronos 
            ? "border-gray-200" 
            : "border-amber-100 hover:border-amber-200"
      } overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col h-full relative`}
      id={`sponsor-card-${sponsor.id}`}
    >
      {/* Badge indicating Sponsor */}
      <div className="absolute top-3 left-3 bg-emerald-600 text-white text-[10px] uppercase tracking-wider font-extrabold px-2.5 py-1 rounded-full shadow-xs flex items-center gap-1 z-10">
        <Store className="w-3 h-3" />
        <span>Patrocinio Local {sponsor.isReal ? "✓ Real" : ""}</span>
      </div>

      {/* Kronos Cost Badge */}
      <div className={`absolute top-3 right-3 ${
        isClaimed
          ? "bg-gray-100 text-gray-400 border-gray-200"
          : !hasEnoughKronos
            ? "bg-amber-50 text-amber-700 border-amber-200"
            : "bg-amber-500 text-white border-amber-600"
      } text-[11px] font-extrabold px-2.5 py-1 rounded-full shadow-xs flex items-center gap-1.5 z-10 border`}>
        <Coins className="w-3.5 h-3.5" />
        <span>{sponsor.kronoCost} Kronos</span>
      </div>

      {/* Banner */}
      <div className="relative h-44 w-full bg-slate-100 overflow-hidden">
        <img
          src={sponsor.bannerUrl}
          alt={sponsor.name}
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <div className="absolute bottom-3 left-3 flex items-center gap-2.5">
          <img
            src={sponsor.logoUrl}
            alt={sponsor.name}
            className="w-10 h-10 rounded-xl border border-white shadow-xs object-cover bg-white"
            referrerPolicy="no-referrer"
          />
          <div>
            <h4 className="text-white font-bold text-base shadow-sm drop-shadow-xs">{sponsor.name}</h4>
            <p className="text-amber-300 text-xs font-semibold">{sponsor.offer}</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-1">
        {/* Description */}
        <p className="text-xs text-gray-600 leading-relaxed mb-5 flex-1 line-clamp-4">
          {sponsor.description}
        </p>

        {/* Location */}
        <div className="flex items-center gap-1.5 text-[11px] text-gray-500 mb-4 font-medium">
          <MapPin className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
          <span className="truncate">{sponsor.location}</span>
        </div>

        {/* Action Button */}
        <div className="mt-auto">
          {isClaimed ? (
            <div className="bg-emerald-50 text-emerald-700 border border-emerald-200 py-2.5 px-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>Código: <strong className="font-mono bg-white px-2 py-0.5 rounded border border-emerald-100">{sponsor.promoCode}</strong></span>
            </div>
          ) : !hasEnoughKronos ? (
            <button
              onClick={onClaim} // We will handle showing the warning modal upon clicking anyway! This is very proactive and helpful
              className="w-full py-2.5 px-4 rounded-xl font-bold text-sm bg-gray-100 hover:bg-gray-200 text-gray-500 border border-gray-200 transition-all duration-200 cursor-pointer text-center flex items-center justify-center gap-2 shadow-3xs"
            >
              <Lock className="w-4 h-4 text-amber-500" />
              <span>Cuesta {sponsor.kronoCost} Kronos (Insuficiente)</span>
            </button>
          ) : (
            <button
              onClick={onClaim}
              className="w-full py-2.5 px-4 rounded-xl font-bold text-sm bg-amber-500 hover:bg-amber-600 active:scale-98 text-white transition-all duration-200 cursor-pointer text-center flex items-center justify-center gap-2 shadow-xs"
            >
              <Gift className="w-4 h-4" />
              <span>Canjear por {sponsor.kronoCost} Kronos</span>
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
