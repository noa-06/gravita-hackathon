import React, { useState, useEffect } from "react";
import { User, Plan, Sponsor, Message } from "./types";
import { mockUsers, mockPlans, mockSponsors } from "./mockData";
import PlanCard from "./components/PlanCard";
import SponsorCard from "./components/SponsorCard";
import SponsorsView from "./components/SponsorsView";
import CreatePlanForm from "./components/CreatePlanForm";
import PlanDetailModal from "./components/PlanDetailModal";
import {
  HeartHandshake,
  Search,
  Compass,
  CalendarDays,
  PlusCircle,
  Store,
  ChevronRight,
  Gift,
  CheckCircle,
  Users,
  Smile,
  LogOut,
  MapPin,
  Menu,
  X,
  HelpCircle,
  Coins,
  Lock,
  Sparkles
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState<"explore" | "my-activities" | "create" | "sponsors">("explore");
  const [myActivitiesTab, setMyActivitiesTab] = useState<"upcoming" | "past">("upcoming");
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  // Core App State (backed by localStorage for persistence)
  const [plans, setPlans] = useState<Plan[]>(() => {
    const saved = localStorage.getItem("gravita_plans_v6");
    let initialPlans = saved ? JSON.parse(saved) : mockPlans;
    // Migración para añadir datos de duración a los planes antiguos guardados en localStorage
    initialPlans = initialPlans.map((p: any) => ({
      ...p,
      duracion: p.duracion || "2 horas",
      kronoValor: p.kronoValor || 20
    }));
    return initialPlans;
  });

  const [currentUser, setCurrentUser] = useState<User>(() => {
    const saved = localStorage.getItem("gravita_user_v1");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (typeof parsed.kronos === "number") {
          return parsed;
        }
      } catch (e) {}
    }
    // Default to the first mock user (Sofía Ruiz) which has 120 Kronos
    return mockUsers[0];
  });

  // Coupon claiming codes
  const [claimedCodes, setClaimedCodes] = useState<{ [key: string]: boolean }>(() => {
    const saved = localStorage.getItem("gravita_claimed_v1");
    return saved ? JSON.parse(saved) : {};
  });

  // Filtering states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoria, setSelectedCategoria] = useState("Todos");
  const [selectedFecha, setSelectedFecha] = useState("Todas");
  const [selectedUbicacion, setSelectedUbicacion] = useState("Todas");
  const [selectedAsistentes, setSelectedAsistentes] = useState("Todos");

  // Mobile menu state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Claim code modal details
  const [claimedSponsor, setClaimedSponsor] = useState<Sponsor | null>(null);
  
  // Insufficient Kronos warning modal
  const [insufficientKronoSponsor, setInsufficientKronoSponsor] = useState<Sponsor | null>(null);

  // Krono toast notification state
  const [kronoToast, setKronoToast] = useState<{ message: string; amount: number; isNegative?: boolean } | null>(null);

  // Sync state to localStorage
  useEffect(() => {
    localStorage.setItem("gravita_plans_v6", JSON.stringify(plans));
  }, [plans]);

  useEffect(() => {
    localStorage.setItem("gravita_user_v1", JSON.stringify(currentUser));
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem("gravita_claimed_v1", JSON.stringify(claimedCodes));
  }, [claimedCodes]);

  // Dismiss Krono toast automatically
  useEffect(() => {
    if (kronoToast) {
      const timer = setTimeout(() => {
        setKronoToast(null);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [kronoToast]);

  const triggerKronoToast = (message: string, amount: number, isNegative?: boolean) => {
    setKronoToast({ message, amount, isNegative });
  };

  // Handler for joining a plan
  const handleJoinPlan = (planId: string) => {
    let joinedNow = false;
    let earnedKronos = 10;
    setPlans(prevPlans =>
      prevPlans.map(plan => {
        if (plan.id === planId) {
          if (!plan.asistentesConfirmados.includes(currentUser.id)) {
            joinedNow = true;
            earnedKronos = plan.kronoValor;
            // Add user and add system chat notification
            const systemMsg: Message = {
              id: `sys-join-${Date.now()}`,
              role: "system",
              senderName: "Sistema",
              text: `¡${currentUser.name} se ha unido al plan!`,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            return {
              ...plan,
              asistentesConfirmados: [...plan.asistentesConfirmados, currentUser.id],
              chatHistory: [...plan.chatHistory, systemMsg]
            };
          }
        }
        return plan;
      })
    );

    if (joinedNow) {
      // Award Kronos!
      setCurrentUser(prev => ({ ...prev, kronos: prev.kronos + earnedKronos }));
      triggerKronoToast("¡Por unirte a una actividad!", earnedKronos);
    }
  };

  // Handler for leaving a plan
  const handleLeavePlan = (planId: string) => {
    setPlans(prevPlans =>
      prevPlans.map(plan => {
        if (plan.id === planId) {
          if (plan.asistentesConfirmados.includes(currentUser.id)) {
            const systemMsg: Message = {
              id: `sys-leave-${Date.now()}`,
              role: "system",
              senderName: "Sistema",
              text: `¡${currentUser.name} ha dejado el plan!`,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            return {
              ...plan,
              asistentesConfirmados: plan.asistentesConfirmados.filter(id => id !== currentUser.id),
              chatHistory: [...plan.chatHistory, systemMsg]
            };
          }
        }
        return plan;
      })
    );
  };

  // Handler for saving a newly created plan
  const handleCreatePlan = (newPlan: Plan) => {
    // Automatically make the creator a joined assistant
    const completedPlan = {
      ...newPlan,
      asistentesConfirmados: [currentUser.id]
    };
    setPlans(prevPlans => [completedPlan, ...prevPlans]);

    // Award +20 Kronos!
    setCurrentUser(prev => ({ ...prev, kronos: prev.kronos + 20 }));
    triggerKronoToast("¡Por proponer una nueva actividad!", 20);

    setActiveTab("my-activities");
    // Open detail of new plan immediately
    setSelectedPlanId(completedPlan.id);
  };

  // Handler for sending messages inside a plan coordination chat
  const handleSendChatMessage = (planId: string, message: Message) => {
    setPlans(prevPlans =>
      prevPlans.map(plan => {
        if (plan.id === planId) {
          const hasSentBefore = plan.chatHistory.some(m => m.senderId === currentUser.id);
          
          // Award +5 Kronos on their first message in a coordination chat!
          if (!hasSentBefore && message.role === "user") {
            setTimeout(() => {
              setCurrentUser(prev => ({ ...prev, kronos: prev.kronos + 5 }));
              triggerKronoToast("¡Primer mensaje de coordinación!", 5);
            }, 100);
          }

          return {
            ...plan,
            chatHistory: [...plan.chatHistory, message]
          };
        }
        return plan;
      })
    );
  };

  const handleVerifyAttendance = (planId: string, attendees: string[]) => {
    setPlans(prevPlans =>
      prevPlans.map(plan => {
        if (plan.id === planId) {
          if (attendees.includes(currentUser.id)) {
            setCurrentUser(prev => ({ ...prev, kronos: prev.kronos + plan.kronoValor }));
            triggerKronoToast("¡Por asistir al plan!", plan.kronoValor);
          }
          
          return {
            ...plan,
            attendanceVerified: true,
            asistentesValidados: attendees
          };
        }
        return plan;
      })
    );
  };

  // Handler for claiming sponsor promo code
  const handleClaimSponsor = (sponsor: Sponsor) => {
    if (currentUser.kronos < sponsor.kronoCost) {
      setInsufficientKronoSponsor(sponsor);
      return;
    }

    // Deduct Kronos
    setCurrentUser(prev => ({ ...prev, kronos: Math.max(0, prev.kronos - sponsor.kronoCost) }));
    triggerKronoToast(`Desbloqueado: ${sponsor.name}`, sponsor.kronoCost, true);

    setClaimedCodes(prev => ({
      ...prev,
      [sponsor.id]: true
    }));
    setClaimedSponsor(sponsor);
  };

  // Get active detailed plan details
  const selectedPlan = plans.find(p => p.id === selectedPlanId);
  const selectedPlanCreator = selectedPlan
    ? mockUsers.find(u => u.id === selectedPlan.creatorId) || currentUser
    : undefined;
  
  const selectedPlanAssistants = selectedPlan
    ? [
        ...mockUsers.filter(u => selectedPlan.asistentesConfirmados.includes(u.id)),
        ...(selectedPlan.asistentesConfirmados.includes(currentUser.id) &&
        !mockUsers.some(u => u.id === currentUser.id)
          ? [currentUser]
          : [])
      ].reduce((acc: User[], curr) => {
        if (!acc.some(u => u.id === curr.id)) acc.push(curr);
        return acc;
      }, [])
    : [];

  // Filter criteria logic
  const filteredPlans = plans.filter(plan => {
    const matchesSearch =
      plan.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      plan.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      plan.ubicacion.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategoria = selectedCategoria === "Todos" || plan.categoria === selectedCategoria;
    const matchesFecha = selectedFecha === "Todas" || plan.fecha === selectedFecha;
    const matchesUbicacion = selectedUbicacion === "Todas" || plan.ubicacion === selectedUbicacion;
    
    let matchesAsistentes = true;
    if (selectedAsistentes === "Menos de 6") {
      matchesAsistentes = plan.maxAsistentes < 6;
    } else if (selectedAsistentes === "6 a 10") {
      matchesAsistentes = plan.maxAsistentes >= 6 && plan.maxAsistentes <= 10;
    } else if (selectedAsistentes === "Más de 10") {
      matchesAsistentes = plan.maxAsistentes > 10;
    }

    return matchesSearch && matchesCategoria && matchesFecha && matchesUbicacion && matchesAsistentes;
  });

  // Simulated User Selector Handler (perfect for showcase/hackathon testing)
  const handleUserSwitch = (userId: string) => {
    const nextUser = mockUsers.find(u => u.id === userId);
    if (nextUser) {
      setCurrentUser(nextUser);
    }
  };

  // Interleaving Sponsors Algorithm: every 4 plans, inject a local Malaga sponsor
  const renderPlansWithSponsors = () => {
    if (filteredPlans.length === 0) {
      return (
        <div className="col-span-full py-16 text-center space-y-4">
          <Smile className="w-16 h-16 text-gray-300 mx-auto" />
          <h4 className="text-base font-bold text-gray-800">No se encontraron actividades</h4>
          <p className="text-xs text-gray-400 max-w-sm mx-auto leading-relaxed">
            Intenta cambiar los filtros de búsqueda o sé tú el primero en proponer una actividad para reunir al grupo.
          </p>
        </div>
      );
    }

    const items = [];
    let planIndex = 0;

    while (planIndex < filteredPlans.length) {
      // Inject current plan
      const plan = filteredPlans[planIndex];
      const creator = mockUsers.find(u => u.id === plan.creatorId) || currentUser;
      const isJoined = plan.asistentesConfirmados.includes(currentUser.id);

      items.push(
        <PlanCard
          key={`plan-${plan.id}`}
          plan={plan}
          creator={creator}
          onSelect={() => setSelectedPlanId(plan.id)}
          isJoined={isJoined}
        />
      );

      planIndex++;

      // Every 4th item, inject a Malaga Sponsor
      if (planIndex > 0 && planIndex % 4 === 0) {
        // Use sponsor index based on plan index to keep it consistent
        const sponsorIndex = Math.floor(planIndex / 4) - 1;
        const sponsor = mockSponsors[sponsorIndex % mockSponsors.length];

        items.push(
          <SponsorCard
            key={`sponsor-interleaved-${sponsor.id}-${planIndex}`}
            sponsor={sponsor}
            onClaim={() => handleClaimSponsor(sponsor)}
            claimedCodes={claimedCodes}
            currentUser={currentUser}
          />
        );
      }
    }

    return items;
  };

  // Count user's active/joined activities
  const joinedPlansCount = plans.filter(p => p.asistentesConfirmados.includes(currentUser.id) && !p.isPast).length;
  const pastPlansCount = plans.filter(p => p.asistentesConfirmados.includes(currentUser.id) && p.isPast).length;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans antialiased text-gray-800" id="app-root">
      {/* GLOBAL HEADER */}
      <header className="bg-white border-b border-gray-150 sticky top-0 z-30 shadow-3xs" id="app-header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-2 rounded-xl text-white shadow-xs">
              <HeartHandshake className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-base font-extrabold text-gray-900 tracking-tight leading-none">Gravita</h1>
              <span className="text-[9px] uppercase tracking-wider text-amber-600 font-extrabold">Planes Platónicos</span>
            </div>
          </div>

          {/* Simulated User Profile Selector & Switcher (Crucial for testing the Chat coordination/multiusers) */}
          <div className="flex items-center gap-3 sm:gap-4">
            
            {/* Kronos Wallet Indicator */}
            <div className="flex items-center gap-1.5 bg-amber-50/60 border border-amber-100 rounded-full p-1 shadow-3xs">
              <div className="flex items-center gap-1 px-2 py-0.5" title="Tu saldo de Kronos">
                <Coins className="w-4 h-4 text-amber-600 animate-spin-slow" />
                <span className="text-xs font-extrabold text-amber-800">{currentUser.kronos}</span>
                <span className="text-[9px] text-amber-600 font-extrabold uppercase">K</span>
              </div>
            </div>

            {/* Desktop Quick Sim Switch */}
            <div className="hidden sm:flex items-center gap-2 bg-gray-50 border border-gray-150 py-1.5 px-3 rounded-full">
              <span className="text-[10px] text-gray-400 font-bold uppercase shrink-0">Simular:</span>
              <select
                value={currentUser.id}
                onChange={(e) => handleUserSwitch(e.target.value)}
                className="bg-transparent border-none text-xs font-bold text-gray-700 focus:outline-hidden outline-hidden cursor-pointer"
              >
                {mockUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.age} años)
                  </option>
                ))}
              </select>
            </div>

            {/* Current Active User Profile Badge */}
            <div className="flex items-center gap-2">
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-9 h-9 rounded-full object-cover border-2 border-amber-400 shadow-3xs"
                referrerPolicy="no-referrer"
              />
              <div className="hidden md:block text-left">
                <span className="text-xs font-bold text-gray-800 block leading-tight">{currentUser.name}</span>
                <span className="text-[10px] text-gray-400 font-medium leading-none block">{currentUser.profession}</span>
              </div>
            </div>

            {/* Mobile menu trigger */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="sm:hidden text-gray-500 p-1.5 rounded-lg hover:bg-gray-100 cursor-pointer"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* MOBILE SWITCH OVERLAY */}
      {isMobileMenuOpen && (
        <div className="sm:hidden bg-white border-b border-gray-150 p-4 space-y-4 shadow-sm relative z-20">
          <div className="space-y-1">
            <span className="text-[10px] text-gray-400 font-bold uppercase block">Simulador de Perspectiva (Hackathon)</span>
            <select
              value={currentUser.id}
              onChange={(e) => {
                handleUserSwitch(e.target.value);
                setIsMobileMenuOpen(false);
              }}
              className="w-full bg-gray-50 border border-gray-250 text-xs font-bold text-gray-700 p-2 rounded-xl outline-hidden"
            >
              {mockUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.age} años) - {u.profession}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2 text-center">
            <button
              onClick={() => { setActiveTab("explore"); setIsMobileMenuOpen(false); }}
              className={`p-2.5 rounded-xl font-bold text-xs flex flex-col items-center gap-1 ${activeTab === 'explore' ? 'bg-sky-50 text-sky-600' : 'text-gray-600'}`}
            >
              <Compass className="w-4 h-4" />
              <span>Explorar</span>
            </button>
            <button
              onClick={() => { setActiveTab("my-activities"); setIsMobileMenuOpen(false); }}
              className={`p-2.5 rounded-xl font-bold text-xs flex flex-col items-center gap-1 relative ${activeTab === 'my-activities' ? 'bg-sky-50 text-sky-600' : 'text-gray-600'}`}
            >
              <CalendarDays className="w-4 h-4" />
              <span>Mis Planes</span>
              {joinedPlansCount > 0 && (
                <span className="absolute top-1 right-3 bg-sky-500 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                  {joinedPlansCount}
                </span>
              )}
            </button>
            <button
              onClick={() => { setActiveTab("create"); setIsMobileMenuOpen(false); }}
              className={`p-2.5 rounded-xl font-bold text-xs flex flex-col items-center gap-1 ${activeTab === 'create' ? 'bg-sky-50 text-sky-600' : 'text-gray-600'}`}
            >
              <PlusCircle className="w-4 h-4" />
              <span>Crear Plan</span>
            </button>
            <button
              onClick={() => { setActiveTab("sponsors"); setIsMobileMenuOpen(false); }}
              className={`p-2.5 rounded-xl font-bold text-xs flex flex-col items-center gap-1 ${activeTab === 'sponsors' ? 'bg-sky-50 text-sky-600' : 'text-gray-600'}`}
            >
              <Store className="w-4 h-4" />
              <span>Aliados</span>
            </button>
          </div>
        </div>
      )}

      {/* CORE LAYOUT INNER */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 flex flex-col md:flex-row gap-8 w-full">
        
        {/* DESKTOP NAVIGATION SIDEBAR */}
        <aside className="hidden sm:flex flex-col gap-2 w-60 shrink-0" id="desktop-sidebar">
          
          <button
            onClick={() => setActiveTab("explore")}
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all border cursor-pointer ${
              activeTab === "explore"
                ? "bg-sky-500 text-white border-sky-600 shadow-xs"
                : "bg-white border-gray-100 text-gray-600 hover:bg-gray-100 hover:text-gray-900 shadow-3xs"
            }`}
          >
            <Compass className="w-4.5 h-4.5" />
            <span>Explorar Actividades</span>
          </button>

          <button
            onClick={() => setActiveTab("my-activities")}
            className={`flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold transition-all border cursor-pointer ${
              activeTab === "my-activities"
                ? "bg-sky-500 text-white border-sky-600 shadow-xs"
                : "bg-white border-gray-100 text-gray-600 hover:bg-gray-100 hover:text-gray-900 shadow-3xs"
            }`}
          >
            <div className="flex items-center gap-3">
              <CalendarDays className="w-4.5 h-4.5" />
              <span>Mis Actividades</span>
            </div>
            {joinedPlansCount > 0 && (
              <span className={`text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold ${activeTab === 'my-activities' ? 'bg-white text-sky-600' : 'bg-sky-500 text-white'}`}>
                {joinedPlansCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("create")}
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all border cursor-pointer ${
              activeTab === "create"
                ? "bg-sky-500 text-white border-sky-600 shadow-xs"
                : "bg-white border-gray-100 text-gray-600 hover:bg-gray-100 hover:text-gray-900 shadow-3xs"
            }`}
          >
            <PlusCircle className="w-4.5 h-4.5" />
            <span>Proponer Actividad</span>
          </button>

          <button
            onClick={() => setActiveTab("sponsors")}
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all border cursor-pointer ${
              activeTab === "sponsors"
                ? "bg-sky-500 text-white border-sky-600 shadow-xs"
                : "bg-white border-gray-100 text-gray-600 hover:bg-gray-100 hover:text-gray-900 shadow-3xs"
            }`}
          >
            <Store className="w-4.5 h-4.5" />
            <span>Comercios Socios</span>
          </button>

          {/* Trust box platonic */}
          <div className="mt-8 bg-amber-50/20 border border-amber-100 p-4 rounded-2xl space-y-2.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800">
              <Smile className="w-4 h-4 text-amber-600 animate-pulse" />
              <span>Espacio Platónico & Gamificado</span>
            </div>
            <p className="text-[10px] text-gray-500 leading-relaxed">
              <strong>Gravita</strong> está diseñada estrictamente para fomentar amistades genuinas e intereses compartidos. Está prohibido el romance o swipes físicos. 
              ¡Usa tus <strong>Kronos</strong> para canjear beneficios grupales en comercios reales y coordinar actividades increíbles!
            </p>
          </div>
        </aside>

        {/* ACTIVE TAB VIEW CONTENT */}
        <main className="flex-1 min-w-0" id="main-content-panel">
          
          {/* TAB: EXPLORE / BOARD */}
          {activeTab === "explore" && (
            <div className="space-y-6">
              
              {/* Filter controls */}
              <div className="bg-white border border-gray-150 rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between shadow-3xs">
                
                {/* Search box */}
                <div className="relative w-full md:w-80">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Buscar planes"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 focus:border-sky-500 focus:bg-white text-xs pl-10 pr-4 py-2.5 rounded-xl outline-hidden text-gray-800 transition-colors"
                  />
                </div>

                {/* Desktop categories */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 w-full md:w-auto pb-1 md:pb-0">
                  <select
                    value={selectedFecha}
                    onChange={(e) => setSelectedFecha(e.target.value)}
                    className="w-full bg-white border border-gray-200 text-xs px-3 py-2.5 rounded-xl outline-hidden text-gray-800 transition-colors cursor-pointer"
                  >
                    {["Todas", ...Array.from(new Set(plans.map(p => p.fecha)))].map(fecha => (
                      <option key={fecha} value={fecha}>{fecha === "Todas" ? "Cualquier Fecha" : fecha}</option>
                    ))}
                  </select>

                  <select
                    value={selectedUbicacion}
                    onChange={(e) => setSelectedUbicacion(e.target.value)}
                    className="w-full bg-white border border-gray-200 text-xs px-3 py-2.5 rounded-xl outline-hidden text-gray-800 transition-colors cursor-pointer"
                  >
                    {["Todas", ...Array.from(new Set(plans.map(p => p.ubicacion)))].map(ubi => (
                      <option key={ubi} value={ubi}>{ubi === "Todas" ? "Cualquier Ubicación" : ubi}</option>
                    ))}
                  </select>

                  <select
                    value={selectedAsistentes}
                    onChange={(e) => setSelectedAsistentes(e.target.value)}
                    className="w-full bg-white border border-gray-200 text-xs px-3 py-2.5 rounded-xl outline-hidden text-gray-800 transition-colors cursor-pointer"
                  >
                    {["Todos", "Menos de 6", "6 a 10", "Más de 10"].map(opt => (
                      <option key={opt} value={opt}>{opt === "Todos" ? "Cualquier aforo" : opt}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Feed Grid (Activities interleaved with sponsors) */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {renderPlansWithSponsors()}
              </div>
            </div>
          )}

          {/* TAB: MY ACTIVITIES & COMMUNITY */}
          {activeTab === "my-activities" && (
            <div className="space-y-6" id="my-activities-view">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-extrabold text-gray-900">Mis Planes y Actividades</h2>
                  <p className="text-xs text-gray-500">Aquí verás los planes a los que te has apuntado y tu historial</p>
                </div>
                <div className="flex bg-gray-100 p-1 rounded-xl w-full md:w-auto">
                  <button
                    onClick={() => setMyActivitiesTab("upcoming")}
                    className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                      myActivitiesTab === "upcoming" ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    Próximos ({joinedPlansCount})
                  </button>
                  <button
                    onClick={() => setMyActivitiesTab("past")}
                    className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                      myActivitiesTab === "past" ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    Historial ({pastPlansCount})
                  </button>
                </div>
              </div>

              {myActivitiesTab === "upcoming" ? (
                joinedPlansCount === 0 ? (
                  <div className="bg-white border border-gray-150 rounded-3xl p-12 text-center max-w-md mx-auto space-y-4">
                    <CalendarDays className="w-16 h-16 text-gray-300 mx-auto" />
                    <h4 className="text-base font-bold text-gray-800">Aún no te has apuntado a ningún plan</h4>
                    <p className="text-xs text-gray-400 leading-relaxed">
                      Navega por la pestaña **Explorar Actividades** y pulsa "Me apunto" en cualquier plan que te guste para abrir el chat de grupo y coordinaros.
                    </p>
                    <button
                      onClick={() => setActiveTab("explore")}
                      className="bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs py-2.5 px-5 rounded-xl transition-all cursor-pointer inline-block shadow-xs"
                    >
                      Explorar Actividades
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {plans
                      .filter(p => p.asistentesConfirmados.includes(currentUser.id) && !p.isPast)
                      .map(plan => {
                        const creator = mockUsers.find(u => u.id === plan.creatorId) || currentUser;
                        return (
                          <PlanCard
                            key={`my-plan-${plan.id}`}
                            plan={plan}
                            creator={creator}
                            onSelect={() => setSelectedPlanId(plan.id)}
                            isJoined={true}
                          />
                        );
                      })}
                  </div>
                )
              ) : (
                pastPlansCount === 0 ? (
                  <div className="bg-white border border-gray-150 rounded-3xl p-12 text-center max-w-md mx-auto space-y-4">
                    <CalendarDays className="w-16 h-16 text-gray-300 mx-auto" />
                    <h4 className="text-base font-bold text-gray-800">Aún no tienes planes pasados</h4>
                    <p className="text-xs text-gray-400 leading-relaxed">
                      Cuando participes en planes y se completen, aparecerán aquí para tu historial.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {plans
                      .filter(p => p.asistentesConfirmados.includes(currentUser.id) && p.isPast)
                      .map(plan => {
                        const creator = mockUsers.find(u => u.id === plan.creatorId) || currentUser;
                        return (
                          <PlanCard
                            key={`past-plan-${plan.id}`}
                            plan={plan}
                            creator={creator}
                            onSelect={() => setSelectedPlanId(plan.id)}
                            isJoined={true}
                          />
                        );
                      })}
                  </div>
                )
              )}
            </div>
          )}

          {/* TAB: CREATE PLAN FORM */}
          {activeTab === "create" && (
            <CreatePlanForm
              currentUser={currentUser}
              onSave={handleCreatePlan}
              onNavigateToExplore={() => setActiveTab("explore")}
            />
          )}

          {/* TAB: ALL PARTNERS & SPONSORS */}
          {activeTab === "sponsors" && (
            <SponsorsView
              claimedCodes={claimedCodes}
              onClaim={handleClaimSponsor}
              currentUser={currentUser}
            />
          )}
        </main>
      </div>

      {/* MODAL: DETAIL OF THE ACTIVITY (Double Column: Details + Chat coordination when joined) */}
      <AnimatePresence>
        {selectedPlanId && selectedPlan && (
          <PlanDetailModal
            plan={selectedPlan}
            creator={selectedPlanCreator}
            assistants={selectedPlanAssistants}
            isJoined={selectedPlan.asistentesConfirmados.includes(currentUser.id)}
            onJoin={() => handleJoinPlan(selectedPlan.id)}
            onLeave={() => handleLeavePlan(selectedPlan.id)}
            onClose={() => setSelectedPlanId(null)}
            currentUser={currentUser}
            onSendMessage={handleSendChatMessage}
            onVerifyAttendance={handleVerifyAttendance}
          />
        )}
      </AnimatePresence>

      {/* MODAL: COUPON CLAIM SUCCESS MODAL FOR THE SPONSORS */}
      <AnimatePresence>
        {claimedSponsor && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-3xs" onClick={() => setClaimedSponsor(null)} />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl border border-gray-150 p-6 md:p-8 max-w-md w-full text-center relative z-10 shadow-xl space-y-6"
            >
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto border-2 border-emerald-50 text-emerald-600 shadow-xs">
                <Gift className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <span className="text-[10px] text-emerald-600 font-extrabold uppercase tracking-widest block">Beneficio de Grupo Reclamado</span>
                <h3 className="text-xl font-black text-gray-900">{claimedSponsor.name}</h3>
                <p className="text-xs text-emerald-700 font-bold bg-emerald-50 py-1.5 px-4 rounded-xl inline-block">
                  {claimedSponsor.offer}
                </p>
              </div>

              <div className="space-y-4 text-left">
                <p className="text-xs text-gray-600 leading-relaxed bg-gray-50 p-4 rounded-2xl border border-gray-100">
                  Presenta este código grupal en el establecimiento al llegar con tus compañeros de plan para desbloquear tu oferta exclusiva.
                </p>

                <div className="flex items-center justify-between bg-gray-100 p-3.5 rounded-2xl border border-gray-150">
                  <span className="text-xs text-gray-500 font-bold">Código Promocional:</span>
                  <span className="font-mono font-extrabold text-sm text-gray-900 bg-white border border-gray-200 px-3 py-1 rounded-lg">
                    {claimedSponsor.promoCode}
                  </span>
                </div>

                <div className="flex items-start gap-2 text-[10px] text-gray-500">
                  <MapPin className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>{claimedSponsor.location}</span>
                </div>
              </div>

              <button
                onClick={() => setClaimedSponsor(null)}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-3 rounded-xl transition-all cursor-pointer shadow-xs"
              >
                ¡Listo! Guardar Código
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: INSUFFICIENT KRONOS WARNING & GUIDE */}
      <AnimatePresence>
        {insufficientKronoSponsor && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-3xs" onClick={() => setInsufficientKronoSponsor(null)} />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl border border-gray-150 p-6 md:p-8 max-w-sm w-full text-center relative z-10 shadow-xl space-y-6"
            >
              <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto border-2 border-amber-100 text-amber-600 shadow-xs">
                <Lock className="w-7 h-7 text-amber-600" />
              </div>

              <div className="space-y-2">
                <span className="text-[10px] text-amber-600 font-extrabold uppercase tracking-widest block">Saldo Insuficiente</span>
                <h3 className="text-xl font-black text-gray-900">Necesitas más Kronos</h3>
                <p className="text-xs text-gray-500 leading-relaxed max-w-sm mx-auto">
                  La oferta de <strong className="text-gray-700">{insufficientKronoSponsor.name}</strong> requiere <strong className="text-amber-700 font-bold">{insufficientKronoSponsor.kronoCost} Kronos</strong>. Tu saldo es de <strong className="text-amber-700 font-bold">{currentUser.kronos} Kronos</strong>.
                </p>
              </div>

              <div className="bg-amber-50/40 border border-amber-100 p-4 rounded-2xl text-left space-y-3">
                <h4 className="text-[11px] font-black text-amber-900 uppercase tracking-wider">¿Cómo conseguir Kronos?</h4>
                <ul className="text-xs text-gray-600 space-y-2 font-medium">
                  <li className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-[9px] shrink-0">1</span>
                    <span><strong>Únete (+10 a 40 K)</strong>: Apúntate a cualquier plan, ganas Kronos según la duración.</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-[9px] shrink-0">2</span>
                    <span><strong>Propón (+20 K)</strong>: Crea una actividad para el grupo.</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-[9px] shrink-0">4</span>
                    <span><strong>Coordina (+5 K)</strong>: Escribe tu primer mensaje en el chat.</span>
                  </li>
                </ul>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setInsufficientKronoSponsor(null)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs py-3 rounded-xl transition-all cursor-pointer"
                >
                  Volver
                </button>
                <button
                  onClick={() => {
                    setInsufficientKronoSponsor(null);
                    setActiveTab("explore");
                  }}
                  className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs py-3 rounded-xl transition-all cursor-pointer shadow-xs"
                >
                  Buscar Planes
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* KRONO TRANSACT FEEDBACK TOAST */}
      <AnimatePresence>
        {kronoToast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="fixed top-20 right-4 z-50 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-2xl px-4 py-3 shadow-lg flex items-center gap-3 border border-amber-400 font-sans"
          >
            <div className="bg-white/20 p-1.5 rounded-xl">
              <Coins className="w-5 h-5 text-amber-100" />
            </div>
            <div className="text-left">
              <p className="text-[10px] text-amber-100 font-bold uppercase tracking-wider leading-none">Transacción Krono</p>
              <h5 className="text-xs font-bold leading-tight">{kronoToast.message}</h5>
            </div>
            <span className={`text-xs font-black px-2 py-0.5 rounded-lg ${kronoToast.isNegative ? 'bg-red-500/30 text-red-100' : 'bg-emerald-500/30 text-emerald-100'}`}>
              {kronoToast.isNegative ? "-" : "+"}{kronoToast.amount}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FOOTER */}
      <footer className="bg-white border-t border-gray-150 py-6 mt-16 text-center" id="app-footer">
        <p className="text-[11px] text-gray-400 font-semibold font-mono uppercase tracking-wider">
          Gravita • Hackathon MVP • Diseñado para la Conexión Humana Platónica con Kronos
        </p>
      </footer>
    </div>
  );
}
