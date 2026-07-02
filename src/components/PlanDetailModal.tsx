import React, { useState } from "react";
import { Plan, User, Message } from "../types";
import { X, Calendar, MapPin, Users, HeartHandshake, Volume2, ShieldCheck, CheckCircle2, UserPlus, Play, Square, Loader2, Clock, Coins } from "lucide-react";
import ChatRoom from "./ChatRoom";
import { motion } from "motion/react";

interface PlanDetailModalProps {
  plan: Plan;
  creator: User | undefined;
  assistants: User[];
  isJoined: boolean;
  onJoin: () => void;
  onLeave: () => void;
  onClose: () => void;
  currentUser: User;
  onSendMessage: (planId: string, message: Message) => void;
  onVerifyAttendance?: (planId: string, attendees: string[]) => void;
}

export default function PlanDetailModal({
  plan,
  creator,
  assistants,
  isJoined,
  onJoin,
  onLeave,
  onClose,
  currentUser,
  onSendMessage,
  onVerifyAttendance
}: PlanDetailModalProps) {
  const [isTtsPlaying, setIsTtsPlaying] = useState(false);
  const [isTtsLoading, setIsTtsLoading] = useState(false);
  const [activeAudioSource, setActiveAudioSource] = useState<any>(null);

  // Attendance verification state
  const [selectedAttendees, setSelectedAttendees] = useState<string[]>(plan.asistentesValidados || plan.asistentesConfirmados);

  // Play PCM 16-bit raw audio on 24kHz sampling rate as returned by Gemini TTS
  const playPcmBase64 = (base64Data: string) => {
    try {
      const binaryString = atob(base64Data);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      const arrayBuffer = bytes.buffer;
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioContextClass({ sampleRate: 24000 });
      
      const numSamples = arrayBuffer.byteLength / 2;
      const audioBuffer = audioCtx.createBuffer(1, numSamples, 24000);
      const channelData = audioBuffer.getChannelData(0);
      const dataView = new DataView(arrayBuffer);
      
      for (let i = 0; i < numSamples; i++) {
        const sample = dataView.getInt16(i * 2, true); // little-endian
        channelData[i] = sample / 32768.0;
      }
      
      const source = audioCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioCtx.destination);
      source.start();
      
      source.onended = () => {
        setIsTtsPlaying(false);
        setActiveAudioSource(null);
      };

      setActiveAudioSource(source);
      setIsTtsPlaying(true);
    } catch (err) {
      console.error("Failed to parse and play raw PCM audio:", err);
      setIsTtsPlaying(false);
    }
  };

  const handleTtsStart = async () => {
    if (isTtsPlaying && activeAudioSource) {
      // Stop currently playing
      try {
        activeAudioSource.stop();
      } catch (e) {}
      setIsTtsPlaying(false);
      setActiveAudioSource(null);
      return;
    }

    setIsTtsLoading(true);
    try {
      const textToRead = `Plan para Gravita: ${plan.title}. Organizado por ${creator?.name.split(" ")[0]}. Ubicación: ${plan.ubicacion}. Detalles del plan: ${plan.description}`;
      
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: textToRead,
          voice: "Kore" // prebuilt voice Kore
        })
      });

      if (!res.ok) throw new Error("TTS failed");
      const data = await res.json();
      
      if (data.audio) {
        playPcmBase64(data.audio);
      } else {
        throw new Error("No audio returned");
      }
    } catch (err) {
      console.error("TTS request error:", err);
      alert("No se pudo iniciar el lector de voz en este momento.");
    } finally {
      setIsTtsLoading(false);
    }
  };

  const currentCount = plan.asistentesConfirmados.length;
  const isFull = currentCount >= plan.maxAsistentes;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" id={`detail-modal-${plan.id}`}>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-xs transition-opacity" onClick={onClose} />

      {/* Modal Alignment Wrapper */}
      <div className="flex min-h-full items-center justify-center p-4 md:p-6 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative transform overflow-hidden rounded-3xl bg-white text-left shadow-xl transition-all w-full max-w-4xl flex flex-col md:flex-row h-[90vh] md:h-[650px]"
        >
          {/* LEFT COLUMN: Image & Description */}
          <div className="w-full md:w-1/2 p-6 md:p-8 overflow-y-auto flex flex-col border-b md:border-b-0 md:border-r border-gray-150">
            {/* Close button inside panel */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 bg-white/90 backdrop-blur-xs hover:bg-gray-100 text-gray-500 hover:text-gray-800 p-2 rounded-full border border-gray-200 transition-colors cursor-pointer z-20 shadow-xs"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Plan Image Header */}
            <div className="relative h-44 rounded-2xl overflow-hidden mb-6 shrink-0 bg-slate-100 border border-gray-100">
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

              {/* TTS Button Affordance */}
              <button
                onClick={handleTtsStart}
                disabled={isTtsLoading}
                className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-xs hover:bg-gray-100 text-gray-700 font-bold text-xs py-1.5 px-3 rounded-full border border-gray-200 transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-70"
              >
                {isTtsLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-500" />
                    <span>Iniciando...</span>
                  </>
                ) : isTtsPlaying ? (
                  <>
                    <Square className="w-3 h-3 text-red-500 fill-red-500" />
                    <span>Detener lector</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-3.5 h-3.5 text-sky-500" />
                    <span>Escuchar Plan con IA</span>
                  </>
                )}
              </button>
            </div>

            {/* Title & Creator */}
            <div className="space-y-4 flex-1">
              <h2 className="text-xl md:text-2xl font-extrabold text-gray-900 leading-tight">
                {plan.title}
              </h2>

              <div className="flex items-center gap-3 bg-gray-50 border border-gray-100 p-3 rounded-2xl">
                <img
                  src={creator?.avatar}
                  alt={creator?.name}
                  className="w-10 h-10 rounded-full object-cover border border-white shadow-xs"
                  referrerPolicy="no-referrer"
                />
                <div className="text-left">
                  <h4 className="text-xs font-bold text-gray-800">{creator?.name} <span className="text-gray-400 font-medium">({creator?.age} años)</span></h4>
                  <p className="text-[10px] text-gray-500 font-semibold">{creator?.profession}</p>
                </div>
              </div>

              {/* Badges / Dates */}
              <div className="grid grid-cols-2 gap-3 text-xs font-medium text-gray-700">
                <div className="bg-sky-50/50 p-2.5 rounded-xl flex items-center gap-2 border border-sky-100/40">
                  <Calendar className="w-4 h-4 text-sky-500 shrink-0" />
                  <span className="truncate">{plan.fecha}</span>
                </div>
                <div className="bg-amber-50/50 p-2.5 rounded-xl flex items-center gap-2 border border-amber-100/40">
                  <MapPin className="w-4 h-4 text-amber-500 shrink-0" />
                  <span className="truncate">{plan.ubicacion}</span>
                </div>
                <div className="bg-indigo-50/50 p-2.5 rounded-xl flex items-center gap-2 border border-indigo-100/40">
                  <Clock className="w-4 h-4 text-indigo-500 shrink-0" />
                  <span className="truncate">{plan.duracion}</span>
                </div>
                <div className="bg-orange-50/50 p-2.5 rounded-xl flex items-center gap-2 border border-orange-100/40">
                  <Coins className="w-4 h-4 text-orange-500 shrink-0" />
                  <span className="truncate font-bold text-orange-700">+{plan.kronoValor} Kronos por asistir</span>
                </div>
              </div>

              {/* Description body */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Acerca de la actividad</h4>
                <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-line bg-gray-50/20 p-3 rounded-2xl border border-gray-100/50">
                  {plan.description}
                </p>
              </div>

              {/* Host bio for trust */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Sobre el anfitrión</h4>
                <p className="text-xs text-gray-500 italic bg-amber-50/10 p-3 rounded-2xl border border-amber-50/50 leading-relaxed">
                  "{creator?.bio}"
                </p>
              </div>
            </div>

            {/* Bottom Join Actions (If user is not joined) */}
            {!isJoined && (
              <div className="pt-6 border-t border-gray-100 mt-6 shrink-0 flex items-center justify-between gap-4">
                <div className="text-left">
                  <span className="text-[10px] text-gray-400 font-semibold uppercase block">Plazas Ocupadas</span>
                  <span className="text-sm font-extrabold text-gray-700">
                    {currentCount} de {plan.maxAsistentes} plazas
                  </span>
                </div>

                <button
                  onClick={onJoin}
                  disabled={isFull}
                  className={`py-3 px-6 rounded-2xl font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer ${
                    isFull
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-sky-500 hover:bg-sky-600 text-white hover:shadow-md"
                  }`}
                >
                  <UserPlus className="w-4 h-4" />
                  <span>{isFull ? "Plazas Agotadas" : "Me Apunto al Plan"}</span>
                </button>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: If Joined -> Coordination Chat & Assistants, If Not Joined -> Guide of Trust */}
          <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col overflow-y-auto">
            {plan.isPast ? (
              <div className="flex flex-col h-full space-y-6">
                <div className="bg-amber-50 p-4 rounded-3xl border border-amber-100 flex flex-col items-center text-center space-y-3 shrink-0">
                  <Clock className="w-10 h-10 text-amber-500" />
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">Actividad Finalizada</h3>
                    <p className="text-xs text-gray-600 mt-1">Este plan ya ha ocurrido.</p>
                  </div>
                </div>

                {plan.creatorId === currentUser.id ? (
                  plan.attendanceVerified ? (
                    <div className="bg-emerald-50 border border-emerald-100 p-5 rounded-3xl text-center space-y-3">
                      <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                      <h4 className="text-sm font-extrabold text-emerald-800">Asistencia verificada</h4>
                      <p className="text-xs text-emerald-700">Has verificado la asistencia de este plan. Los participantes han recibido sus Kronos.</p>
                    </div>
                  ) : (
                    <div className="space-y-4 flex-1">
                      <div>
                        <h4 className="text-sm font-bold text-gray-900 mb-1">Verificar Asistencia</h4>
                        <p className="text-[11px] text-gray-500 leading-relaxed">Selecciona las personas que finalmente asistieron al plan. Se les recompensará con {plan.kronoValor} Kronos a cada uno.</p>
                      </div>
                      
                      <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                        {assistants.map((ast) => (
                          <label key={ast.id} className="flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 border border-gray-150 rounded-xl cursor-pointer transition-colors">
                            <input
                              type="checkbox"
                              checked={selectedAttendees.includes(ast.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedAttendees([...selectedAttendees, ast.id]);
                                } else {
                                  setSelectedAttendees(selectedAttendees.filter(id => id !== ast.id));
                                }
                              }}
                              className="w-4 h-4 text-sky-500 border-gray-300 rounded-sm focus:ring-sky-500"
                            />
                            <div className="flex items-center gap-2">
                              <img src={ast.avatar} alt={ast.name} className="w-8 h-8 rounded-full object-cover" />
                              <div>
                                <div className="text-xs font-bold text-gray-800">{ast.name}</div>
                                <div className="text-[10px] text-gray-500">{ast.id === currentUser.id ? "(Tú)" : "Inscrito"}</div>
                              </div>
                            </div>
                          </label>
                        ))}
                      </div>

                      <div className="pt-2">
                        <button
                          onClick={() => {
                            if (onVerifyAttendance) {
                              onVerifyAttendance(plan.id, selectedAttendees);
                            }
                          }}
                          className="w-full bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs py-3.5 px-4 rounded-xl transition-all cursor-pointer shadow-sm flex items-center justify-center gap-2"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Confirmar Asistencia</span>
                        </button>
                      </div>
                    </div>
                  )
                ) : (
                  <div className="flex-1 flex flex-col justify-center items-center text-center space-y-4">
                    {plan.attendanceVerified ? (
                      plan.asistentesValidados?.includes(currentUser.id) ? (
                        <div className="bg-emerald-50 border border-emerald-100 p-5 rounded-3xl w-full">
                          <Coins className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                          <h4 className="text-sm font-bold text-emerald-800">¡Asistencia confirmada!</h4>
                          <p className="text-xs text-emerald-700 mt-1">El organizador ha verificado tu asistencia. Has recibido {plan.kronoValor} Kronos.</p>
                        </div>
                      ) : (
                        <div className="bg-gray-50 border border-gray-200 p-5 rounded-3xl w-full">
                          <h4 className="text-sm font-bold text-gray-600">Asistencia no confirmada</h4>
                          <p className="text-xs text-gray-500 mt-1">El organizador no confirmó tu asistencia a este plan.</p>
                        </div>
                      )
                    ) : (
                      <p className="text-xs text-gray-500 bg-gray-50 p-4 rounded-2xl w-full">
                        El organizador aún no ha verificado la asistencia de este plan.
                      </p>
                    )}
                  </div>
                )}
              </div>
            ) : isJoined ? (
              // Immersive Experience when joined: Chat + Members
              <div className="flex flex-col h-full space-y-4">
                {/* Header joined */}
                <div className="flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                    <span className="text-sm font-extrabold text-emerald-800">¡Estás inscrito en este plan!</span>
                  </div>
                  <button
                    onClick={onLeave}
                    className="text-[10px] text-red-500 hover:text-red-700 font-bold border border-red-200 bg-red-50/20 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                  >
                    Salir del Plan
                  </button>
                </div>

                {/* Assistants quick list */}
                <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100 shrink-0">
                  <h5 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-sky-500" />
                    <span>Asistentes inscritos ({assistants.length})</span>
                  </h5>
                  <div className="flex flex-wrap gap-2">
                    {assistants.map((ast) => (
                      <div
                        key={ast.id}
                        className="flex items-center gap-1.5 bg-white border border-gray-150 py-1 px-2.5 rounded-full text-[10px] font-semibold text-gray-700 shadow-3xs"
                        title={`${ast.name} (${ast.age} años) - ${ast.profession}`}
                      >
                        <img
                          src={ast.avatar}
                          alt={ast.name}
                          className="w-4 h-4 rounded-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <span>{ast.name.split(" ")[0]}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Chat coordination module */}
                <div className="flex-1 min-h-[300px]">
                  <ChatRoom
                    plan={plan}
                    currentUser={currentUser}
                    onSendMessage={onSendMessage}
                  />
                </div>
              </div>
            ) : (
              // Encouraging non-joined view
              <div className="flex flex-col h-full justify-center items-center text-center p-6 space-y-6">
                <div className="bg-sky-50 p-4 rounded-3xl border border-sky-100 shrink-0">
                  <ShieldCheck className="w-12 h-12 text-sky-500" />
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-gray-900">¿Cómo funciona el encuentro?</h3>
                  <p className="text-xs text-gray-500 leading-relaxed max-w-sm">
                    Gravita promueve una comunidad segura, cordial y estrictamente platónica. 
                    Una vez te apuntes al plan, se activará el chat de esta tarjeta para que hables con el anfitrión, el resto del grupo y nuestra asistente IA.
                  </p>
                </div>

                {/* List of current attendants to entice them */}
                <div className="w-full space-y-3 bg-gray-50 p-4 rounded-2xl border border-gray-150">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                    ¿Quiénes se han apuntado ya?
                  </span>
                  
                  {assistants.length === 0 ? (
                    <span className="text-xs text-gray-400 italic block">¡Sé el primero en sumarte!</span>
                  ) : (
                    <div className="flex items-center justify-center -space-x-2.5 overflow-hidden py-1">
                      {assistants.map((ast) => (
                        <img
                          key={ast.id}
                          className="inline-block h-8 w-8 rounded-full ring-2 ring-white object-cover"
                          src={ast.avatar}
                          alt={ast.name}
                          title={`${ast.name}, ${ast.age} años`}
                          referrerPolicy="no-referrer"
                        />
                      ))}
                    </div>
                  )}
                  <p className="text-[10px] text-gray-400 italic leading-snug">
                    {assistants.length > 0 
                      ? `${assistants.map(a => a.name.split(" ")[0]).join(", ")} te están esperando para pasar un buen rato.`
                      : "Comparte intereses, conversación y risas sin presiones."
                    }
                  </p>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
