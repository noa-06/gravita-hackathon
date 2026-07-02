import React, { useState, useRef, useEffect } from "react";
import { Message, User, Plan } from "../types";
import { Send, Bot, Sparkles, UserCheck, HelpCircle, Loader2 } from "lucide-react";
import { motion } from "motion/react";

interface ChatRoomProps {
  plan: Plan;
  currentUser: User;
  onSendMessage: (planId: string, message: Message) => void;
}

export default function ChatRoom({ plan, currentUser, onSendMessage }: ChatRoomProps) {
  const [inputText, setInputText] = useState("");
  const [isAiReplying, setIsAiReplying] = useState(false);
  const [autoAiResponse, setAutoAiResponse] = useState(true);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom whenever messages list changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [plan.chatHistory]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const userMsgText = inputText.trim();
    setInputText("");

    // 1. Create and send user message
    const userMessage: Message = {
      id: `m-usr-${Date.now()}`,
      role: "user",
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderAvatar: currentUser.avatar,
      text: userMsgText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    onSendMessage(plan.id, userMessage);

    // 2. Proactive AI Response triggered either automatically or by typing @ai or mentioning help
    const shouldAiReply = autoAiResponse || userMsgText.toLowerCase().includes("@ai") || userMsgText.toLowerCase().includes("ayuda") || userMsgText.toLowerCase().includes("coordinar");

    if (shouldAiReply) {
      setIsAiReplying(true);
      try {
        // Collect chat history, skipping system messages
        const relevantHistory = plan.chatHistory
          .filter(m => m.role !== "system")
          .map(m => ({
            role: m.role,
            text: `${m.senderName}: ${m.text}`
          }));

        // Append the current message
        relevantHistory.push({
          role: "user",
          text: `${currentUser.name}: ${userMsgText}`
        });

        // Prompt or System Instruction setup
        const systemInstruction = `Eres 'Gravita AI', una asistente virtual y coordinadora de planes comunitarios súper cálida, acogedora y simpática.
Tu único objetivo es fomentar la amistad genuina y platónica, combatiendo la soledad de manera empática. 
Estamos en el chat grupal para la actividad: '${plan.title}'. Descripción: '${plan.description}'. 
Debes dar consejos útiles de coordinación (ej. transporte, clima de Málaga, sugerir puntos de encuentro), proponer preguntas divertidas rompehielos para cuando se encuentren, y recordarles descuentos especiales de comercios locales si encajan de manera natural (ej. Casa Kiki si van a merendar, Waw Cafe si van a tomar café, Eva Málaga si es un plan artístico).
Mantén un tono andaluz cálido, alegre y muy cercano. Responde en español de forma concisa y amigable (máximo 4-5 líneas de texto).`;

        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: relevantHistory,
            systemInstruction
          })
        });

        if (!response.ok) {
          throw new Error("Chat call failed");
        }

        const data = await response.json();
        
        // Add AI message to the plan's chat history
        const aiMessage: Message = {
          id: `m-ai-${Date.now()}`,
          role: "assistant",
          senderName: "Gravita AI",
          text: data.text,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        onSendMessage(plan.id, aiMessage);
      } catch (err) {
        console.error("Failed to get AI assistant chat reply:", err);
      } finally {
        setIsAiReplying(false);
      }
    }
  };

  const triggerDirectAiAdvice = async () => {
    setIsAiReplying(true);
    try {
      const promptText = "Gravita AI, ¿podrías darnos un rompehielos divertido y un consejo rápido para coordinar esta actividad?";
      
      const relevantHistory = plan.chatHistory
        .filter(m => m.role !== "system")
        .map(m => ({
          role: m.role,
          text: `${m.senderName}: ${m.text}`
        }));

      relevantHistory.push({
        role: "user",
        text: promptText
      });

      const systemInstruction = `Eres 'Gravita AI', asistente virtual de planes comunitarios de Málaga. 
Estamos coordinando el plan '${plan.title}'. Sugiere una pregunta rompehielos creativa y alegre para romper el hielo cuando las personas se conozcan en persona, y un consejo de coordinación en Málaga. Sé breve y muy entusiasta.`;

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: relevantHistory,
          systemInstruction
        })
      });

      if (!response.ok) throw new Error("Advice failed");
      const data = await response.json();

      const aiMessage: Message = {
        id: `m-ai-adv-${Date.now()}`,
        role: "assistant",
        senderName: "Gravita AI",
        text: data.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      onSendMessage(plan.id, aiMessage);
    } catch (err) {
      console.error("Advice request failed:", err);
    } finally {
      setIsAiReplying(false);
    }
  };

  return (
    <div className="flex flex-col h-[520px] bg-gray-50 rounded-2xl border border-gray-150 overflow-hidden" id="chat-room">
      {/* Chat header */}
      <div className="bg-white px-4 py-3 border-b border-gray-150 flex items-center justify-between shadow-3xs shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <div>
            <h4 className="text-sm font-bold text-gray-800">Coordinación de Grupo</h4>
            <p className="text-[10px] text-gray-500 font-medium">Pregunta libremente o coordina con el grupo</p>
          </div>
        </div>

        {/* AI Action button */}
        <button
          onClick={triggerDirectAiAdvice}
          disabled={isAiReplying}
          className="text-xs bg-sky-50 hover:bg-sky-100 text-sky-700 font-bold px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition-all border border-sky-100 cursor-pointer disabled:opacity-50"
        >
          <Sparkles className="w-3.5 h-3.5 text-sky-500" />
          <span>Rompehielos IA</span>
        </button>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
        {plan.chatHistory.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-400">
            <Bot className="w-12 h-12 text-gray-300 mb-2.5" />
            <span className="text-xs font-semibold text-gray-500">¿Tienes dudas sobre el punto de encuentro?</span>
            <p className="text-[11px] text-gray-400 mt-1 max-w-[240px]">
              Escribe un mensaje abajo y deja que el grupo y nuestra coordinadora IA te asistan.
            </p>
          </div>
        ) : (
          plan.chatHistory.map((msg) => {
            const isMe = msg.senderId === currentUser.id;
            const isAi = msg.role === "assistant";
            const isSys = msg.role === "system";

            if (isSys) {
              return (
                <div key={msg.id} className="flex justify-center my-1.5">
                  <span className="bg-gray-150/60 text-gray-500 text-[10px] px-3 py-1 rounded-full font-semibold border border-gray-200">
                    {msg.text}
                  </span>
                </div>
              );
            }

            return (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${isMe ? "flex-row-reverse" : "flex-row"}`}
              >
                {/* Avatar */}
                {!isMe && (
                  <img
                    src={msg.senderAvatar || (isAi ? "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=60" : "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=60")}
                    alt={msg.senderName}
                    className={`w-7 h-7 rounded-full object-cover shrink-0 border ${
                      isAi ? "border-sky-300 bg-sky-50 p-0.5" : "border-gray-200"
                    }`}
                    referrerPolicy="no-referrer"
                  />
                )}

                {/* Message bubble wrapper */}
                <div className={`max-w-[80%] flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                  {/* Sender Name */}
                  <span className="text-[10px] font-bold text-gray-500 mb-0.5 px-1 flex items-center gap-1">
                    {msg.senderName}
                    {isAi && (
                      <span className="bg-sky-100 text-sky-800 text-[8px] font-extrabold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                        <Bot className="w-2.5 h-2.5" /> IA
                      </span>
                    )}
                  </span>

                  {/* Bubble content */}
                  <div
                    className={`p-3 rounded-2xl text-xs leading-relaxed ${
                      isMe
                        ? "bg-sky-500 text-white rounded-tr-none shadow-3xs"
                        : isAi
                        ? "bg-sky-50 border border-sky-100 text-sky-900 rounded-tl-none shadow-3xs"
                        : "bg-white border border-gray-150 text-gray-800 rounded-tl-none shadow-3xs"
                    }`}
                  >
                    {msg.text}
                  </div>

                  {/* Timestamp */}
                  <span className="text-[9px] text-gray-400 mt-0.5 px-1 font-mono font-medium">
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            );
          })
        )}

        {/* AI Typing state indicator */}
        {isAiReplying && (
          <div className="flex gap-2.5 items-start">
            <div className="w-7 h-7 rounded-full bg-sky-50 border border-sky-200 flex items-center justify-center shrink-0">
              <Loader2 className="w-4 h-4 text-sky-500 animate-spin" />
            </div>
            <div className="bg-sky-50/50 border border-sky-100 p-3 rounded-2xl rounded-tl-none max-w-[60%] shadow-3xs">
              <div className="flex gap-1.5 items-center">
                <span className="text-[10px] font-bold text-sky-600">Gravita AI</span>
                <span className="text-[9px] text-sky-400 animate-pulse">pensando...</span>
              </div>
              <div className="flex gap-1 mt-2">
                <span className="w-1.5 h-1.5 bg-sky-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-sky-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-sky-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input panel */}
      <form onSubmit={handleSend} className="p-3 bg-white border-t border-gray-150 flex flex-col gap-2 shrink-0">
        {/* Toggle option for automatic AI assistant response */}
        <div className="flex items-center justify-between text-[10px] text-gray-500 font-medium px-1">
          <label className="flex items-center gap-1.5 cursor-pointer hover:text-sky-600 transition-colors">
            <input
              type="checkbox"
              checked={autoAiResponse}
              onChange={(e) => setAutoAiResponse(e.target.value === "on" || e.target.checked)}
              className="rounded border-gray-300 text-sky-500 focus:ring-sky-400 w-3.5 h-3.5"
            />
            <span className="flex items-center gap-1">
              <Bot className="w-3.5 h-3.5 text-sky-500" />
              Coordinadora IA responde automáticamente
            </span>
          </label>
          <span className="text-gray-400 font-mono">Prueba a escribir "@ai"</span>
        </div>

        {/* Input box */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Escribe un mensaje para coordinar..."
            className="flex-1 bg-gray-50 border border-gray-200 focus:border-sky-500 focus:bg-white text-xs px-3.5 py-2.5 rounded-xl outline-hidden text-gray-800 transition-colors"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isAiReplying}
            className="bg-sky-500 hover:bg-sky-600 text-white p-2.5 rounded-xl transition-all duration-150 cursor-pointer flex items-center justify-center shrink-0 shadow-xs hover:shadow-sm disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
