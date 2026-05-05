# 🏦 Templates Bank - Nenufar
Version: v1.1

This document centralizes the copy templates for content generation. Instead of generating dynamic text via RAG, the system uses these predefined structures to optimize token consumption and ensure consistency of the (eco-poetic) voice tone.

## 🏷️ Variable Syntax
- `{{product_name}}`: Product name.
- `{{artisan_name}}`: Name of the artisan.
- `{{material}}`: Main material (e.g., iraca palm, arrow cane).
- `{{technique}}`: Weaving technique (e.g., Peyote, Telar).
- `{{price}}`: Price (only if necessary, avoid offer tone).
- `{{day_theme}}`: Theme of the day (e.g., Gratitude, Nature).

---

## 🌸 Template Categories

### 1. Life Stories (Social Focus)
**ID:** `story_artisan_01`
> "En el corazón de cada tejido vive una historia. Hoy celebramos las manos de **{{artisan_name}}**, quien transformó la **{{material}}** en este **{{product_name}}**. No es solo un objeto; es el susurro de la tierra vuelto arte. 🌿✨"

**ID:** `story_artisan_02`
> "Tejer es un acto de resistencia y amor. **{{artisan_name}}** dedica horas a entrelazar sueños en este **{{product_name}}**. Al llevarlo, llevas contigo la herencia de nuestras ancestras. 🌸 #TejidoConPropósito"

### 2. Heritage Narratives (Cultural Focus)
**ID:** `heritage_indigenous_01`
> "Antes de que fuera moda, fue lenguaje. 🍃 Nuestros ancestros indígenas usaban los colores y las formas para contar los secretos del universo. Al llevar este **{{product_name}}**, no solo luces una joya, mantienes vivo un dialecto milenario tejido en **{{material}}**. 🤎"

**ID:** `heritage_indigenous_02`
> "Cada puntada en la técnica **{{technique}}** es un puente hacia el pasado. Nuestras abuelas indígenas nos enseñaron que tejer es meditar. Este **{{product_name}}** es un homenaje a esa sabiduría antigua, creado para las almas que respetan sus raíces. 🌿✨"

### 3. Catalog and Product (Aesthetic Focus)
**ID:** `product_showcase_01`
> "✨ **{{product_name}}** ✨ | Una danza de texturas y colores. Creado con **{{material}}** recolectada de forma sostenible. Una pieza que respira naturaleza. ¿Qué rincón de tu hogar espera por esta belleza? 🌿"

**ID:** `product_showcase_02`
> "La elegancia de lo simple nace en la raíz. Descubre el **{{product_name}}**, una pieza donde la **{{material}}** cobra vida. Piezas únicas para almas que valoran lo auténtico. 🌸"

### 3. Interaction and Engagement
**ID:** `engagement_question_01`
> "Hoy despertamos con el tema: **{{day_theme}}**. 🍃 ¿Cómo se manifiesta esto en tu vida? Nosotras lo vemos en la delicadeza de cada **{{product_name}}**. ¡Te leemos! 👇"

### 4. Fallbacks and Apologies (Error Handling)
**ID:** `fallback_general`
> "La naturaleza tiene sus propios tiempos, y a veces nosotras también. 🌸 Estamos ajustando algunos detalles para brindarte la mejor experiencia. Gracias por tu paciencia, alma bella."

---

## 🛠️ Usage Instructions (n8n)
1. Identify the type of post/message.
2. Select the corresponding template `ID`.
3. Replace the `{{variable}}` with data from `product_catalog.md` or Shirley's input.
4. (Optional) Send to Gemini for a 1-turn "final touch" (few tokens) if minimal variation is required.
