import React from "react";
import { Plan, User } from "../types";
import { Calendar, MapPin, Users, HeartHandshake, Clock, Coins } from "lucide-react";
import { motion } from "motion/react";

interface PlanCardProps {
  key?: string;
  plan: Plan;
  creator: User | undefined;
  onSelect: () => void;
  isJoined: boolean;
}

export default function PlanCard({ plan, creator, onSelect, isJoined }: PlanCardProps) {
  const currentCount = plan.asistentesConfirmados.length;
  const isFull = currentCount >= plan.maxAsistentes;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, transition: { duration: 0.15 } }}
      className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col h-full"
      id={`plan-card-${plan.id}`}
    >
      {/* Plan Banner */}
      <div className="relative h-44 w-full bg-slate-100 overflow-hidden">
        {plan.bannerUrl ? (
          <img
            src={plan.bannerUrl}
            alt={plan.title}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-tr from-sky-100 to-amber-100 flex items-center justify-center">
            <HeartHandshake className="w-12 h-12 text-sky-400 opacity-60" />
          </div>
        )}
        
        {/* Spot availability badge */}
        <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-xs px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 shadow-xs text-gray-700">
          <Users className="w-3.5 h-3.5 text-sky-500" />
          <span>
            {currentCount}/{plan.maxAsistentes} plazas
          </span>
        </div>

        {isJoined && (
          <div className="absolute top-3 left-3 bg-emerald-500 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-xs">
            Me apunto
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-1">
        {/* Creator Info */}
        <div className="flex items-center gap-2.5 mb-3">
          <img
            src={creator?.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=60"}
            alt={creator?.name || "Organizador"}
            className="w-7 h-7 rounded-full border border-white shadow-xs object-cover"
            referrerPolicy="no-referrer"
          />
          <span className="text-xs font-medium text-gray-500">
            Organiza <strong className="text-gray-700 font-semibold">{creator?.name.split(" ")[0]}</strong>
          </span>
        </div>

        {/* Title */}
        <h3 className="text-lg font-bold text-gray-900 leading-snug mb-3 hover:text-sky-600 transition-colors flex-1 line-clamp-2">
          {plan.title}
        </h3>

        {/* Info list */}
        <div className="space-y-2 mb-5 text-xs text-gray-600">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-sky-500 shrink-0" />
            <span className="truncate">{plan.fecha}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-amber-500 shrink-0" />
            <span className="truncate">{plan.ubicacion}</span>
          </div>
          <div className="flex items-center justify-between mt-1">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-500 shrink-0" />
              <span className="truncate">{plan.duracion}</span>
            </div>
            <div className="flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
              <Coins className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-xs font-bold text-amber-700">+{plan.kronoValor} K</span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-auto">
          <button
            onClick={onSelect}
            className={`w-full py-2.5 px-4 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer text-center ${
              isJoined
                ? "bg-emerald-50 text-emerald-700 border border-emerald-100 hover:bg-emerald-100"
                : isFull
                ? "bg-gray-100 text-gray-400 border border-transparent cursor-not-allowed"
                : "bg-sky-500 hover:bg-sky-600 text-white shadow-xs hover:shadow-sm"
            }`}
          >
            {isJoined ? "Ver mi Plan" : isFull ? "Plazas Agotadas" : "Me interesa / Ver Detalles"}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
