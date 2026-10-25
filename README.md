# SimonCraft 🟩🐶⚡

Juego educativo para niños, estilo **Minecraft**, con **Simón**, su perro **Snoopy** y **Pokémon**.
Funciona en el celular como **aplicación instalable** (PWA) y también sin internet después de la primera carga.
El ícono de la app es un **Sniffer**.

## ¿Cómo se juega?

| Acción | Celular | Computador |
|---|---|---|
| Caminar | ◀ ▶ | A / D o flechas |
| Saltar | ▲ (además salta solo los escalones) | W o espacio |
| Picar enfrente | Elegir pico, hacha o pala y mantener el botón de la herramienta | F o Enter |
| Picar hacia abajo | ⬇ | S o flecha abajo |
| Poner bloque | Elegir un bloque en la barra y apretar el botón de la herramienta | F o Enter |
| Mesa de crafteo | 🧰 Crear | E |

- La herramienta pica **el bloque que tiene enfrente Simón** (marcado en amarillo; en rojo si falta mejor herramienta).
- **Materiales de herramientas** (nivel de minería): madera → piedra → cobre → oro → hierro → diamante. Se mejoran en la mesa de crafteo con 3 bloques del material + 2 tablas. El hierro y el cobre necesitan piedra o mejor; el oro, cobre o mejor; el diamante, hierro o mejor; la obsidiana, diamante.
- **Modos de juego** (botón 🎮 Modo): Supervivencia (corazones, la lava quema), Creativo (bloques infinitos, vuela, pica al instante), Aventura (solo explorar y atrapar Pokémon), Espectador (vuela y atraviesa paredes) y Modo Simón (súper poderes).
- **Pokémon salvajes** aparecen en el mundo: tócalos y responde una pregunta para atraparlos.
- **Snoopy** te sigue y olfatea minerales cercanos (te marca el bloque con una luz amarilla). Si lo tocas, ladra.
- **El Sniffer** pasea cerca del inicio: tócalo para abrir la tienda.
- Al picar un material por primera vez aparece un **dato curioso** de ciencias.
- Ciclo de **día y noche**, cuevas, minerales (carbón, cobre, hierro, oro, diamante), obsidiana, **lagos de lava** en el fondo y árboles.

### Pruebas (Lenguaje, Matemática y Ciencias)
- Pensado para un niño de **6 años**: el nivel por defecto es **🐣 Fácil (5 y 6 años)**. También hay Medio (7–8), Difícil (9–10) y Experto (11–12).
- Las preguntas y respuestas **se leen en voz alta** (se puede apagar en Ajustes). Usan dibujos (emojis) para quien aún no lee.
- Si se equivoca, **puede intentarlo otra vez**: la opción incorrecta se tacha. Así los Pokémon nunca se escapan.
- 4 preguntas por prueba: **10 💎** a la primera, **5 💎** al reintentar y **10 💎 extra** si acierta todas a la primera.
- **Matemática:** contar, reconocer números, mayor/menor, qué número va antes/después, qué número falta, y **sumas y restas sencillas** con dibujos (hasta 10 en los niveles Fácil y Medio). No hay multiplicaciones ni divisiones.
- Lenguaje y Ciencias están en `js/data.js` → `QUESTIONS` (la primera opción es la correcta).

### Tienda
- **Gratis:** Pack Bienvenida (una vez), Pack Diario de Pokémon y Bloques Básicos (cada día).
- **Con créditos:** packs Fuego, Agua, Planta, Eléctrico, Misterio, Legendario, Bloques Mágicos, estilos de Simón y accesorios para Snoopy.

## Probar en el computador

Los navegadores necesitan un servidor (no basta con abrir el archivo). En Windows, desde esta carpeta:

```bash
powershell -ExecutionPolicy Bypass -File servidor.ps1
```

Luego abre `http://localhost:8080`.

## Publicar con GitHub Pages (gratis)

1. Crea una cuenta en [github.com](https://github.com) y un repositorio nuevo llamado `simoncraft` (público).
2. Sube todos los archivos de esta carpeta (botón **Add file → Upload files**, o con git):
   ```bash
   git init
   git add .
   git commit -m "SimonCraft"
   git branch -M main
   git remote add origin https://github.com/TU-USUARIO/simoncraft.git
   git push -u origin main
   ```
3. En el repositorio: **Settings → Pages → Branch: main / (root) → Save**.
4. En 1–2 minutos el juego queda en `https://TU-USUARIO.github.io/simoncraft/`.

### Instalar en el celular
- **Android (Chrome):** abre el enlace → menú ⋮ → **Instalar aplicación** (o el botón 📲 del menú del juego).
- **iPhone (Safari):** abre el enlace → botón Compartir → **Agregar a pantalla de inicio**.

## Guardar resultados en Google Sheets (Apps Script, opcional)

Sirve para que el profesor vea el avance de cada estudiante y para mostrar un ranking del curso.

1. Abre [script.google.com](https://script.google.com) → **Nuevo proyecto** (o desde una Hoja: **Extensiones → Apps Script**).
2. Pega el contenido de `apps-script/Code.gs` y guarda.
3. Elige la función `configurar` y presiona **Ejecutar** (acepta permisos). Si el proyecto no está dentro de una Hoja, se crea sola una llamada **"SimonCraft - Resultados"** en tu Drive (el enlace aparece en el registro).
4. **Implementar → Nueva implementación → Aplicación web** — Ejecutar como: *Yo*; Acceso: *Cualquier persona*.
5. Copia la URL `/exec` y pégala en **Ajustes** del juego, o comparte un enlace que ya la incluya:
   `https://TU-USUARIO.github.io/simoncraft/?script=URL_EXEC&curso=3B`

La hoja **Jugadores** guarda nombre, curso, créditos, Pokémon atrapados y aciertos por asignatura; **Resultados** guarda cada prueba con fecha.

## Archivos

Todos los archivos del juego van juntos, sin subcarpetas (así se suben fácil a GitHub):

```
index.html              pantallas del juego
style.css               estilo Minecraft
data.js                 bloques, Pokémon, tienda y PREGUNTAS (editar aquí)
world.js                motor: mundo, física, Simón, Snoopy, Sniffer, Pokémon
app.js                  menús, pruebas, tienda, Pokédex, guardado y nube
sw.js                   funcionamiento sin internet
manifest.webmanifest    datos de la app instalable
icon-*.png              ícono del Sniffer
apps-script/Code.gs     backend de Google Sheets (no se sube a GitHub, va en Apps Script)
```

## Aviso

Proyecto educativo **sin fines de lucro**, hecho por fans. Minecraft es marca de Mojang/Microsoft;
Pokémon es marca de Nintendo / Game Freak / The Pokémon Company; Snoopy es un personaje de Peanuts.
Las imágenes de Pokémon se cargan desde [PokeAPI](https://github.com/PokeAPI/sprites). No publicar en tiendas de aplicaciones ni usar con fines comerciales.
