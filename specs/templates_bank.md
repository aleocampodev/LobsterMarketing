# 🏦 Templates Bank - Nenufar
Version: v1.2

This document centralizes the boutique copy templates for content generation. The system uses these 15 predefined structures to optimize token consumption and ensure consistency of the (eco-poetic) voice tone across different formats.

## 🏷️ Variable Syntax
- `{{product_name}}`: Product name.
- `{{artisan_name}}`: Name of the artisan.
- `{{material}}`: Main material (e.g., mostacilla, hilo apta).
- `{{technique}}`: Weaving technique (e.g., Peyote, Telar, Ladrillo).
- `{{day_theme}}`: Theme of the day (e.g., Gratitud, Naturaleza).

---

## 🌸 Template Categories

### 1. Reels (Video Focus)
**ID:** `reel_process_01`
> "El secreto de nuestra joyería índigo que pocos conocen... 🤫👇 No es solo la calidad de la **{{material}}**; es la paciencia en la técnica de **{{technique}}**. En un mundo rápido, nosotras nos detenemos a crear arte. Dale ▶️ y cuéntanos: ¿crees que lo hecho a mano tiene otra energía? 📌🌸"

**ID:** `reel_artisan_01`
> "¿Te has preguntado quién está detrás de este accesorio? ⏱️👇 Quédate un segundo en el taller con **{{artisan_name}}**. Mientras teje este **{{product_name}}**, también construye el futuro de su familia. Guarda este video si también apoyas el trabajo de las madres cabeza de hogar. 🤎🌿"

**ID:** `reel_materials_01`
> "De la tierra a tus manos. 🌎 ¿Sabías que esta **{{material}}** tiene una historia de sostenibilidad? Mira cómo brilla bajo el sol. No es solo joyería, es conciencia tejida. Dale amor si valoras lo natural. 🌿"

**ID:** `reel_transformation_01`
> "No es magia, es paciencia. ✨ Mira cómo un puñado de **{{material}}** se transforma en un **{{product_name}}** mediante la técnica de **{{technique}}**. Un proceso lento para un resultado eterno. Guarda este video para inspirar tu día. ⏱️🌸"

### 2. Photos (Aesthetic & Sales Focus)
**ID:** `photo_exclusive_01`
> "✨ **{{product_name}}** ✨ | No creamos para las masas; creamos para quienes entienden que el verdadero lujo está en lo irrepetible. Esta pieza de **{{material}}** fue concebida para respirar naturaleza. Hacemos muy pocas a la semana. Si sientes que debe ser tuya, escríbenos por DM para separarla en el taller. 🌿"

**ID:** `photo_heritage_01`
> "Antes de que fuera moda, fue lenguaje. 🍃 Cuando tejemos con **{{technique}}**, recordamos que nuestros ancestros usaban el color para hablar. Este **{{product_name}}** no es un adorno; es un dialecto milenario vivo que mantienes vivo al llevarlo contigo. 🤎"

**ID:** `photo_gift_01`
> "Regala algo que no se pueda repetir. 🎁 El **{{product_name}}** es el mensaje perfecto para decir te quiero con arte. Piezas únicas para personas que dejan huella. Escríbenos y te ayudamos a elegir el empaque ideal. 🎀"

**ID:** `photo_local_01`
> "Desde el corazón de Cartagena para el mundo. 🌴 Nuestro **{{product_name}}** lleva la brisa y el color de nuestra tierra en cada puntada de **{{technique}}**. ¿Desde qué ciudad nos lees hoy? 📍🌻"

### 3. Stories (Ephemeral & Interaction)
**ID:** `story_bts_01`
> "Puntada a puntada... ⏱️ Así luce nuestro taller hoy creando sus pedidos. La técnica de **{{technique}}** requiere toda nuestra presencia. ¡Feliz día, tribu! ☕🌿"

**ID:** `story_last_units_01`
> "¡Quedan muy pocas unidades disponibles! 🏃‍♀ El **{{product_name}}** en **{{material}}** está volando. Si lo tenías en la mira, este es el momento. Toca el link en la bio o escríbenos al DM. 🔥"

**ID:** `story_client_love_01`
> "Almas felices luciendo Nenufar. ✨ Gracias por elegir nuestra técnica de **{{technique}}** para acompañar sus momentos especiales. Etiquétanos en tu foto para saludarte. 📸🌸"

**ID:** `story_interactive_01`
> "¿A o B? 🤔 En el taller estamos indecisas con este diseño de **{{product_name}}**. ¿Te gusta más en tonos tierra o vibrantes? Reacciona o escríbenos. 👇✨"

### 4. Questions (Engagement Focus)
**ID:** `post_question_01`
> "Hoy en el taller hablábamos sobre **{{day_theme}}** y quería preguntarles algo a ustedes, nuestra tribu. 🤎 Cuando se ponen sus piezas favoritas de Nenufar, ¿qué buscan sentir? ¿Seguridad, paz o conexión con lo natural? Las leo aquí abajo. 👇✨"

**ID:** `post_poll_01`
> "¡Necesitamos su ayuda en el taller! 🤔🍃 Estamos creando nuevos **{{product_name}}** con **{{material}}** y queremos saber: para sus días más importantes, ¿prefieren tonos dorados (Poder) o amarillos (Alegría)? Déjennos su voto abajo. 👇🌸"

**ID:** `post_cocreate_01`
> "¿Qué soñamos después? ✨ Queremos crear una nueva colección con **{{material}}** y queremos que tú seas parte del diseño. ¿Qué accesorio te gustaría que tejiéramos esta semana? Las leo con mucha ilusión. 👇🤎"

---

## 🛠️ Usage Instructions (n8n)
1. Identify the media type (Reel, Photo, Story).
2. Select a `template_id` ensuring rotation (avoid using the same ID twice in 7 days).
3. Replace the `{{variable}}` with data from `product_catalog.md` or user input.
4. Record the used `template_id` in `nenufar.processed_files.template_used`.
