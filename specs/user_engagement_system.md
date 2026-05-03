# Nenufar User Engagement & Community System
Version: v1.1

## Problem Statement
"How to proactively interact with users to increase engagement and build community around Nenufar brand values?"

## Solution: Proactive Engagement Engine

### 🎯 Core Philosophy
- **Nenufar doesn't just sell jewelry** - we build a movement around ancestral art, weaving culture, and women's empowerment.
- **Every interaction** must reflect the brand soul: poetic, educational, close, and respectful.
- **Users are not customers** - they are part of the "Nenúfar Contigo" movement.

---

## 📱 Engagement Theme Library (Daily Strategy)

### 🌅 Theme 1: "Tejiendo Caminos" (Mondays)
**Focus:** Social impact, artisan mothers, and their stories.

**Daily Question Example:**
```
🧵 **Pregunta del Día:**
   
"¿Cuál es la artesania colombiana que más te inspira?
   
A) Tejido en mostacilla
B) Cerámica tradicional  
C) Tejido en palma
D) Hilos de lana
   
Cuéntanos en los comentarios y comparte si has conocido alguna artesana trabajando desde su hogar 🏠✨"
```

### 📖 Theme 2: "Poemas Tejidos" (Tuesdays)
**Focus:** Storytelling, literature, and poetry connection.

**Daily Question Example:**
```
📜 **Poema del Día + Pregunta:**
   
"Cada puntada es un paso hacia la estabilidad de una familia colombiana"
   
💬 **Para ti:** ¿Qué palabra representa tu estilo personal?
   
A) Esperanza 🌟
B) Fuerza 💪
C) Alegría ☀️
D) Amor ❤️
   
"Comenta tu palabra y te recomendamos una pieza que la representa"
```

### 🎨 Theme 3: "Gajes del Oficio" (Wednesdays)
**Focus:** Educational content, weaving techniques, and materials.

**Daily Question Example:**
```
🔍 **¿Sabías qué? + Quiz:**
   
"¿Sabías que la mostacilla checa es el corazón de nuestras creaciones?
   
💡 **Pregunta técnica:** ¿Qué técnica te gustaría aprender?
   
A) Técnica Peyote (punto por punto)
B) Tejido en telar
C) Labores de aguja
D) Tejido en ladrillo
   
"Los votantes ganan un tutorial exclusivo en stories 🎓"
```

### 🧒 Theme 4: "Universo Infantil/Juvenil" (Thursdays)
**Focus:** Kids accessories, cute designs, and the bond between mothers and daughters.

### 🌿 Theme 5: "Naturaleza y Espíritu" (Fridays)
**Focus:** Spirituality, connection with nature, and meaningful designs.

### 🎭 Theme 6: "Cultura en Movimiento" (Saturdays)
**Focus:** Events, museums, cultural activities, and the Cartagena lifestyle.

### 🌈 Theme 7: "Reflexión y Color" (Sundays)
**Focus:** Weekly reflection, color meanings, and energy for the new week.

---

## 🤖 Automated Interaction Workflows

### 📅 Schedule: Daily Engagement Posts
The system uses an `engagement_calendar` table in Supabase to track types of questions, targets, and actual performance.

### 🎯 Workflow: Automatic Daily Engagement
1. **Determine Day & Theme:** Logic to select the appropriate theme template.
2. **Generate Personalized Question:** Luna crafts the question using Gemini 2.5 Flash.
3. **Interactive Elements:** Polls/Quizzes are added with emojis.
4. **Multichannel Posting:** Instagram Stories + Feed via Meta API.
5. **Monitoring & Follow-up:** Analyze engagement after 24h and generate personalized responses.

---

## 💬 Proactive Comment Response System
Luna uses a `comment_patterns` table to classify sentiment (compliment, question, feedback) and respond instantly with the "Eco Poético" voice.

---

## 📊 Success Metrics (KPIs)
- **Short-term:** 50% increase in comments, 30% increase in profile visits.
- **Medium-term:** 100+ active community members, 50+ user-generated content (UGC) pieces.
- **Long-term:** Brand community of 500+ active members, 25% of sales from referrals.
