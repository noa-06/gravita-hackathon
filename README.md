# 🪐 Gravita

🏆 **4º Puesto en el Hackathon Espet-up (Málaga, 1 de julio)**

Gravita es una plataforma web gamificada diseñada para combatir el aislamiento social y la soledad no deseada en jóvenes y estudiantes universitarios. A través de nuestra "economía del tiempo", los usuarios intercambian *Kronos* (nuestro token nativo) por participar en actividades locales basadas en intereses comunes, fomentando las conexiones orgánicas y alejándonos de la superficialidad de las citas a ciegas.

<img width="833" height="457" alt="Captura de pantalla 2026-07-01 165352" src="https://github.com/user-attachments/assets/e26c5319-7180-46f3-94c9-da02aea86e40" />


## ✨ Características Principales
*   **Match por Aficiones:** Conexiones basadas puramente en intereses y *hobbies* compartidos.
*   **Economía del Tiempo (Kronos):** Gamificación de las interacciones para evitar el *ghosting* y premiar la participación activa.
*   **Integración Local:** Ecosistema B2B2C con comercios patrocinadores reales.

## 🚀 Tecnologías Utilizadas
*   **Frontend:** React, TypeScript, Vite
*   **Inteligencia Artificial:** Google AI Studio (Gemini API) para la lógica de emparejamiento y recomendaciones de planes.
*   **Estilos:** CSS / Tailwind

## ⚙️ Instalación y Uso Local

Para levantar este prototipo en tu propia máquina, sigue estos pasos:

1. **Clona el repositorio:**
   ```bash
   git clone [https://github.com/TuUsuario/gravita-hackathon.git](https://github.com/TuUsuario/gravita-hackathon.git)
   cd gravita-hackathon
2. **Instala las dependencias:**
   ```bash
    npm install
3. **Configura las variables de entorno:**
Crea un archivo .env en la raíz del proyecto basándote en el archivo .env.example proporcionado, y añade tu API Key de Gemini:

   ```bash
   Fragmento de código
    GEMINI_API_KEY="tu_api_key_aqui"
4. **Inicia el servidor de desarrollo:**
   ```bash
    npm run dev

La aplicación estará disponible en http://localhost:5173
