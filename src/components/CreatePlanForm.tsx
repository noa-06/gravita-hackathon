import React, { useState } from "react";
import { Plan, User } from "../types";
import { Image, Sparkles, AlertCircle, HelpCircle, Check, Loader2, Plus, Minus } from "lucide-react";
import { motion } from "motion/react";

interface CreatePlanFormProps {
  currentUser: User;
  onSave: (newPlan: Plan) => void;
  onNavigateToExplore: () => void;
}

export default function CreatePlanForm({ currentUser, onSave, onNavigateToExplore }: CreatePlanFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoria, setCategoria] = useState("Cultura");
  const [fecha, setFecha] = useState("");
  const [duracion, setDuracion] = useState("2 horas");
  const [kronoValor, setKronoValor] = useState(20);
  const [ubicacion, setUbicacion] = useState("");
  const [maxAsistentes, setMaxAsistentes] = useState(6);
  const [bannerUrl, setBannerUrl] = useState("");

  // AI Banner generator state
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiSize, setAiSize] = useState<"1K" | "2K" | "4K">("1K");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleGenerateBanner = async () => {
    if (!aiPrompt.trim()) {
      setErrorMsg("Por favor, introduce una descripción de imagen primero.");
      return;
    }

    setIsGenerating(true);
    setErrorMsg("");
    
    // Simulate steps to reassure the user (video/image generation takes a bit of time)
    const steps = [
      "Iniciando generador inteligente...",
      "Esbozando composición de la escena en Málaga...",
      "Aplicando paleta de colores cálida y acogedora...",
      "Renderizando texturas y pinceladas artísticas...",
      "Ajustando resolución seleccionada (" + aiSize + ")..."
    ];

    let currentStep = 0;
    setGenerationStep(steps[0]);
    const stepInterval = setInterval(() => {
      if (currentStep < steps.length - 1) {
        currentStep++;
        setGenerationStep(steps[currentStep]);
      }
    }, 2500);

    try {
      const res = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: aiPrompt,
          size: aiSize
        })
      });

      if (!res.ok) {
        throw new Error("La generación de imagen falló. Por favor, inténtalo de nuevo.");
      }

      const data = await res.json();
      if (data.imageUrl) {
        setBannerUrl(data.imageUrl);
      } else {
        throw new Error("No se pudo extraer la imagen generada.");
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Error al conectar con el servidor de IA.");
    } finally {
      clearInterval(stepInterval);
      setIsGenerating(false);
      setGenerationStep("");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !fecha || !ubicacion) {
      setErrorMsg("Por favor, rellena todos los campos obligatorios.");
      return;
    }

    const newPlan: Plan = {
      id: `plan-${Date.now()}`,
      creatorId: currentUser.id,
      title,
      description,
      categoria,
      fecha,
      duracion,
      kronoValor,
      ubicacion,
      asistentesConfirmados: [],
      maxAsistentes: Number(maxAsistentes),
      bannerUrl: bannerUrl || "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=800", // fallback
      chatHistory: [
        {
          id: `m-sys-${Date.now()}`,
          role: "system",
          senderName: "Sistema",
          text: `¡Actividad '${title}' creada con éxito! Coordina los detalles con los asistentes aquí.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]
    };

    onSave(newPlan);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8" id="create-plan-form">
      {/* Introduction Banner */}
      <div className="bg-sky-50 rounded-2xl p-6 border border-sky-100 flex items-start gap-4">
        <Sparkles className="w-6 h-6 text-sky-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h3 className="text-base font-bold text-sky-900">¿Qué hace a un plan exitoso?</h3>
          <p className="text-xs text-sky-700 leading-relaxed">
            Los mejores planes en Gravita son específicos, enfocados en actividades (senderismo, café, museos) y con un número reducido de asistentes (6-8 personas) para propiciar que todo el mundo se escuche y participe. Recuerda: ¡es una comunidad platónica de amistad!
          </p>
        </div>
      </div>

      <div className="bg-white border border-gray-150 rounded-3xl p-6 md:p-8 shadow-xs">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="border-b border-gray-100 pb-4 mb-6">
            <h2 className="text-xl font-extrabold text-gray-900">Crear Nueva Actividad</h2>
            <p className="text-xs text-gray-500">Inspira a los demás a unirse proponiendo tu plan ideal</p>
          </div>

          {errorMsg && (
            <div className="bg-red-50 text-red-700 p-3 rounded-xl text-xs flex items-center gap-2 border border-red-100">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Form Inputs Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-bold text-gray-700">Título del Plan *</label>
              <input
                type="text"
                required
                placeholder="Ej. Tarde de Juegos de Mesa y Merienda"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 focus:border-sky-500 focus:bg-white text-xs px-3.5 py-2.5 rounded-xl outline-hidden text-gray-800 transition-colors"
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-bold text-gray-700">Categoría *</label>
              <select
                required
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 focus:border-sky-500 focus:bg-white text-xs px-3.5 py-2.5 rounded-xl outline-hidden text-gray-800 transition-colors"
              >
                {["Deportes", "Gastronomía", "Cultura", "Naturaleza", "Juegos", "Bienestar"].map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-bold text-gray-700">Descripción Completa *</label>
              <textarea
                required
                rows={4}
                placeholder="Describe con detalle la actividad. Qué vais a hacer, si hay que llevar algo especial, y el tono relajado del encuentro..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 focus:border-sky-500 focus:bg-white text-xs px-3.5 py-2.5 rounded-xl outline-hidden text-gray-800 transition-colors leading-relaxed"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700">Fecha y Hora *</label>
              <input
                type="text"
                required
                placeholder="Ej. Este Sábado a las 18:00"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 focus:border-sky-500 focus:bg-white text-xs px-3.5 py-2.5 rounded-xl outline-hidden text-gray-800 transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700">Duración Aproximada *</label>
              <select
                required
                value={duracion}
                onChange={(e) => {
                  setDuracion(e.target.value);
                  const duracionValue = e.target.value;
                  const durationMap: Record<string, number> = {
                    "1 hora": 10,
                    "1.5 horas": 15,
                    "2 horas": 20,
                    "3 horas": 30,
                    "4 horas": 40
                  };
                  setKronoValor(durationMap[duracionValue] || 20);
                }}
                className="w-full bg-gray-50 border border-gray-200 focus:border-sky-500 focus:bg-white text-xs px-3.5 py-2.5 rounded-xl outline-hidden text-gray-800 transition-colors"
              >
                <option value="1 hora">1 hora (10 Kronos)</option>
                <option value="1.5 horas">1.5 horas (15 Kronos)</option>
                <option value="2 horas">2 horas (20 Kronos)</option>
                <option value="3 horas">3 horas (30 Kronos)</option>
                <option value="4 horas">4 horas (40 Kronos)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700">Lugar del Encuentro (Punto exacto) *</label>
              <input
                type="text"
                required
                placeholder="Ej. Puerta de las Oficinas de Correos del Soho"
                value={ubicacion}
                onChange={(e) => setUbicacion(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 focus:border-sky-500 focus:bg-white text-xs px-3.5 py-2.5 rounded-xl outline-hidden text-gray-800 transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700">Límite de Plazas (Incluyéndote a ti)</label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setMaxAsistentes(prev => Math.max(2, prev - 1))}
                  className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 active:bg-gray-100 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={maxAsistentes <= 2}
                >
                  <Minus className="w-4 h-4" />
                </button>
                <input
                  type="number"
                  min="2"
                  max="20"
                  value={maxAsistentes}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    if (!isNaN(val)) {
                      setMaxAsistentes(Math.min(20, Math.max(2, val)));
                    } else if (e.target.value === "") {
                      // Allow clearing the input temporarily to type a new number
                      setMaxAsistentes(0 as any); // Type cast since it's a number, will be fixed on blur/submit, but better just allow string for empty or handle via state if strict. Actually, if they type, setting to 0 or something is fine, or we can use string state, but let's just let it be. If empty, NaN, set 2.
                    }
                  }}
                  onBlur={() => {
                    if (maxAsistentes < 2) setMaxAsistentes(2);
                    if (maxAsistentes > 20) setMaxAsistentes(20);
                  }}
                  className="w-16 text-center bg-gray-50 border border-gray-200 focus:border-sky-500 focus:bg-white rounded-xl h-10 text-sm font-bold text-gray-800 outline-none transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <button
                  type="button"
                  onClick={() => setMaxAsistentes(prev => Math.min(20, prev + 1))}
                  className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 active:bg-gray-100 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={maxAsistentes >= 20}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Predefined custom banner link input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700">URL del Banner (Opcional)</label>
              <input
                type="url"
                placeholder="Introduce link de Unsplash o usa el Generador IA de abajo"
                value={bannerUrl}
                onChange={(e) => setBannerUrl(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 focus:border-sky-500 focus:bg-white text-xs px-3.5 py-2.5 rounded-xl outline-hidden text-gray-800 transition-colors"
              />
            </div>
          </div>

          {/* GEMINI IMAGE GENERATION FIELDSET */}
          <div className="border-t border-dashed border-gray-150 pt-6 mt-6 space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <div>
                <h4 className="text-sm font-bold text-gray-800">Generar Banner Artístico con Gemini IA</h4>
                <p className="text-[10px] text-gray-500 font-medium">Inserta una ilustración o pintura a medida usando gemini-3-pro-image-preview</p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-150 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-600">Descripción de la Ilustración (Prompt)</label>
                <textarea
                  rows={2}
                  placeholder="Ej. An oil painting of a cozy beach picnic under Malaga warm sunset light, flat style, inviting atmosphere"
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  className="w-full bg-white border border-gray-200 focus:border-amber-500 text-xs px-3 py-2 rounded-xl outline-hidden text-gray-800 transition-colors"
                />
              </div>

              {/* Resolution options with sizes 1K, 2K, 4K as requested */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-gray-600 block">Resolución de la Imagen</span>
                  <div className="flex gap-2">
                    {(["1K", "2K", "4K"] as const).map((size) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => setAiSize(size)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                          aiSize === size
                            ? "bg-amber-500 border-amber-600 text-white"
                            : "bg-white border-gray-200 text-gray-600 hover:bg-gray-100"
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  disabled={isGenerating || !aiPrompt.trim()}
                  onClick={handleGenerateBanner}
                  className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-2 shrink-0 shadow-xs disabled:opacity-50"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Generando...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-white" />
                      <span>Generar con IA</span>
                    </>
                  )}
                </button>
              </div>

              {/* Progress step message */}
              {isGenerating && (
                <div className="text-center py-2">
                  <p className="text-xs text-amber-600 font-semibold animate-pulse">{generationStep}</p>
                </div>
              )}

              {/* Preview of the generated Banner */}
              {bannerUrl && (
                <div className="border border-gray-100 rounded-xl overflow-hidden mt-3 shadow-3xs">
                  <div className="bg-gray-100 px-3 py-1.5 text-[10px] font-bold text-gray-500 flex justify-between items-center border-b border-gray-100">
                    <span>Vista previa del Banner generado ({aiSize})</span>
                    <span className="bg-emerald-100 text-emerald-800 text-[8px] font-extrabold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                      <Check className="w-3 h-3" /> Aplicado con éxito
                    </span>
                  </div>
                  <img
                    src={bannerUrl}
                    alt="Generated Banner"
                    className="w-full h-44 object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onNavigateToExplore}
              className="px-5 py-2.5 rounded-xl border border-gray-250 text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="bg-sky-500 hover:bg-sky-600 text-white font-extrabold text-xs px-6 py-2.5 rounded-xl transition-all shadow-xs hover:shadow-sm cursor-pointer"
            >
              Publicar Actividad y Unirse
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
