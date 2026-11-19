# Overlay GTA VI · el_chachocanario (fuentes de navegador para OBS)

| Escena | Archivo | Notas |
|---|---|---|
| En partida | `ingame.html` | Transparente. Webcam a la **izquierda**, como una tarjeta del minimapa de GTA VI (336×189 en x=32, y=600, justo encima de donde el juego pinta el minimapa), con una etiqueta tipo navegador (canal + tiempo en directo). Encima, el chat de Twitch como **burbujas de mensajes del móvil**: aparece al llegar mensajes y se oculta tras `chat.idleHide` segundos sin actividad (25 por defecto, en `config.js`); `?chat=0` lo quita, `?test=1` muestra mensajes de prueba. `?hud=1` muestra juego / hora / en directo arriba a la derecha, `?news=1` las Noticias de Leonida como notificación del móvil (abajo a la derecha), `?preview=1` pone un fondo de prueba. |
| Empezamos en breve | `starting-soon.html` | Fondo **álbum automático** (5 fotos, transiciones: zoom cruzado, barrido neón, persianas, iris, empuje). Cuenta atrás `HH:MM:SS` hasta las `00:00:00` (Europe/Madrid), configurable en `config.js` (`countdownTo`, `countdownZone`) o con `?at=21:30:00`; `?minutes=10` fuerza una duración fija. |
| Empezamos en breve (cámara) | `starting-soon-cam.html` | La misma pantalla con un hueco transparente para la webcam en lugar de la tarjeta de subs (560×315 en x=1300, y=589, marco neón como en partida); el chat ocupa la parte superior de la columna. Redirige a `starting-soon.html?cam=1`; la webcam va **debajo** de esta fuente. |
| Vuelvo enseguida | `brb.html` | Contador "Ausente". |
| Fin del directo | `stream-ending.html` | Próximo directo + últimos 5 subs. |
| Chat | `chat.html` | Transparente. Chat de Twitch de el_chachocanario suelto, para añadirlo a mano donde quieras (no va en ninguna escena; "Empezamos en breve" ya trae el suyo). Solo lectura, sin token. Oculta bots y comandos `!`, respeta los mensajes borrados por moderadores. `?test=1` mensajes de prueba. |
| Alertas Twitch | `alerts.html` | Transparente. Sub nueva, resub, subs regaladas y bits como **notificación del móvil** arriba en el centro (confeti solo en las grandes) y sonido (`assets/sounds/alert_sound.mp3`; cámbialo o ajusta el volumen en `config.js` → `subs.alertSound` / `subs.alertVolume`). `?test=1` lanza alertas de prueba, `?mute=1` sin sonido. |

Las tres pantallas completas abren con la **intro en canvas** (~4 s). `?intro=0` la salta.

## Estilo
Inspirado en la interfaz de GTA VI: las pantallas completas imitan el **menú de pausa** (barra superior con pestañas L1/R1, lista de filas con separadores finos y tinte violeta), y el chat, las alertas y las noticias usan tarjetas **estilo iPhone** del móvil del juego. Fuentes: Barlow Condensed (rótulos HUD), Inter (tarjetas del móvil) y GTA Art Deco (solo títulos grandes).

## Personalizar
**La forma fácil:** abre `settings.html` con doble clic (Chrome o Edge). Ahí cambias el canal, las redes, la cuenta atrás, las fotos del álbum, el ticker, el objetivo de subs, el tamaño y el sonido de las alertas, el chat y las conexiones con Twitch y OBS. Pulsa **Guardar config.js** (o Ctrl+S). La primera vez te pide elegir `config.js` (en la carpeta del overlay) y luego se acuerda. En otros navegadores el archivo se descarga y lo copias a esa carpeta. Después, en OBS, pulsa **Actualizar** en las fuentes de navegador. Abajo del todo hay enlaces para probar cada escena.

| Archivo | Qué es |
|---|---|
| `config.js` | **Tus ajustes** (lo escribe `settings.html`). No se sube a git porque lleva el token. Basta con poner lo que cambies. |
| `config.defaults.js` | Valores por defecto: lo que falte en `config.js` se toma de aquí. No lo edites. |
| `demo-data.js` | Datos de ejemplo, no ajustes: últimos subs hasta conectar con Twitch, mensajes del chat y alertas de `?test=1`, y nombres al azar del panel de alertas. |
| `install.html` | Genera la colección de escenas de OBS / Streamlabs con la ruta de **tu** carpeta (ver abajo). |
| `collection.js` | El diseño de las escenas (fuentes, posiciones, transición) que usa `install.html`. |
| `ui.css` | Estilo compartido de `settings.html`, `install.html`, `stingers.html` y `control.html`. |
| `stingers.html` / `fx.js` | Generador de las transiciones animadas / efectos compartidos con el álbum. |

En "Empezamos en breve" y "Vuelvo enseguida" se ven el objetivo de subs y los **5 últimos subs** (en "Empezamos en breve", arriba a la derecha con el chat de Twitch debajo; `?test=1` muestra mensajes de prueba); en "Fin del directo", los 5 últimos subs. Twitch no indica si una sub es de Prime (llega como Nivel 1), así que se muestran todas igual.

## Añadir a OBS
1. Fuentes → **+** → **Navegador** → marca **Archivo local** → elige el HTML.
2. Ancho **1920**, alto **1080** (si usas otro tamaño, el overlay se escala solo y se centra).
3. Marca **Actualizar navegador cuando la escena se active** (repite la intro y reinicia los contadores).
4. Alertas: añade `alerts.html` encima de tus escenas.
5. Marca **Apagar fuente cuando no sea visible** en cada fuente: Twitch permite 3 conexiones a la vez y así solo conectan la escena activa y las alertas.

Fuentes: GTA Art Deco (local, `assets/fonts`), Barlow Condensed e Inter (Google Fonts; sin internet usan fuentes del sistema).
Las imágenes de fondo usan copias de 1920×1080 en `img` (unas 5 veces más ligeras que las 4K) para que carguen rápido.

## Conectar con Twitch en directo (subs, bits y objetivo reales)
Sin esto, todo funciona con los datos de ejemplo de `demo-data.js`.
1. Entra en https://dev.twitch.tv/console → **Registrar aplicación**. URL de redirección: `http://localhost`. Copia el **Client ID**.
2. Con la sesión de el_chachocanario iniciada, abre (cambiando TU_CLIENT_ID):
   `https://id.twitch.tv/oauth2/authorize?response_type=token&client_id=TU_CLIENT_ID&redirect_uri=http://localhost&scope=channel:read:subscriptions+bits:read+channel:read:goals`
3. Acepta. La página de localhost no cargará, es normal: copia de la barra de direcciones el valor entre `access_token=` y `&`.
4. Pega ambos en `settings.html` → **Conexión con Twitch** (el enlace «Obtener token» ya lleva tu Client ID) y guarda. ⚠️ El token es privado: no compartas `config.js` ni lo subas a internet.
5. Opcional: crea un **objetivo de subs** en el Panel de creador de Twitch → Objetivos; el overlay usa ese en vez del de `config.js`.

El token caduca al cabo de un tiempo; si las alertas dejan de llegar, repite los pasos 2–4. Con el token puesto, al cargar cada escena los ejemplos de `demo-data.js` se sustituyen por tus **suscriptores reales** (Twitch no da la fecha de cada sub, así que salen en el orden de Twitch; las subs que llegan en directo van siempre primero). Si no tienes suscriptores, la lista se oculta. Los últimos 5 subs se guardan y se comparten entre escenas; `?reset=1` vuelve a los de `demo-data.js`. El juego que aparece en "Jugando a" y en "Empezamos en breve" es la **categoría puesta en Twitch** (se actualiza al momento si la cambias durante el directo); sin token o sin categoría se usa `game` de `config.js`.

## Panel de alertas en OBS (lanzar alertas a mano)
`control.html` es un panel con botones (Sub / Nivel 2 / Nivel 3, Resub con meses, Regalo con nº de subs, Bits) que lanza las alertas en `alerts.html`. No necesita token de Twitch.
1. OBS → **Herramientas → Ajustes del servidor WebSocket** → marca **Activar servidor WebSocket**. Pulsa **Mostrar información de conexión** y copia la contraseña.
2. OBS → **Docks → Docks de navegador personalizados**. Nombre: `Alertas`, URL: la que muestra `install.html` → **Panel de alertas** (botón **Copiar**; p. ej. `file:///D:/obs/gtavi/control.html`) → **Aplicar**.
3. En el panel abre **Conexión con OBS**, pega la contraseña y pulsa **Guardar y conectar** (o ponla en `settings.html` → **OBS WebSocket**). Debe salir **Conectado** en verde.
4. Escribe un nombre (vacío = aleatorio) y un mensaje si quieres, y pulsa un botón.

**Sonido**: en la colección de OBS la fuente "Alertas Twitch (overlay)" tiene **Controlar audio mediante OBS** activado, así que sale en el mezclador, va al directo y la oyes por **Monitorizar y emitir**. Si tu monitorización va al mismo dispositivo que capturas como "Audio del escritorio", se oirá doble en el directo: cambia la fuente a **Solo emitir** (Propiedades avanzadas de audio).

**Contar en últimos subs y objetivo**: sin marcar, solo se ve la alerta (para probar); marcado, la sub entra en los 5 últimos subs y suma al objetivo de `config.js` (si hay un objetivo de Twitch activo, ese no cambia). La alerta solo sale si la escena activa tiene "Alertas (no borrar)" (todas menos "Fin del directo").

## Transiciones "Misión superada"
Al cambiar de escena se usan los **mismos efectos que el álbum** de "Empezamos en breve" (zoom cruzado, barrido neón, persianas, iris y empuje, compartidos en `fx.js`): el efecto tapa la pantalla con la tarjeta **MISIÓN SUPERADA**, OBS cambia de escena por detrás y el efecto se deshace mostrando la nueva, con el sonido `assets/sounds/everglades_mission_passed.mp3`.
- Cada escena tiene el suyo al cambiar **a** ella: Empezamos en breve → zoom cruzado, Empezamos (cámara) → empuje, En partida → barrido neón, Vuelvo enseguida → persianas, Fin del directo → iris (en `collection.js` → `STINGER.sceneFx`).
- Son vídeos WebM con transparencia en `assets/stingers`. Para rehacerlos (otro sonido, versión corta de 3 s…) abre `stingers.html` → **Generar y guardar** y elige la carpeta `assets`.
- En `install.html` deja activada **Transiciones animadas** antes de descargar la colección. Desactivada, queda solo la transición de sonido "Misión superada" de antes.
- Mientras suena la transición (~8 s con el sonido completo) OBS no deja lanzar otra; la versión corta lo deja en 3 s.

## Instalar en OBS Studio o Streamlabs (colección de escenas)
Las fuentes de navegador apuntan a los HTML por **ruta absoluta**, así que la colección se genera para la carpeta donde tengas el overlay:
1. Abre `install.html` con doble clic (Chrome o Edge). Detecta sola la carpeta del overlay desde la que la abres (la que tiene los HTML y `assets`); si vas a emitir desde otro PC o disco, escribe o pega esa ruta (vale con barras \ de Windows). Debajo comprueba que la carpeta y el sonido de la transición existen.
2. Elige la **Resolución base** del lienzo de OBS (2560×1440 por defecto, 1920×1080 o personalizada).
   - **En partida**: elige si el fondo es la **captura de juego** (juegas en este PC) o un **dispositivo de captura de vídeo** (capturadora de consola u otro PC, o una cámara).
   - **Alertas de puntos**: pega el enlace de tu overlay de canjes de puntos (p. ej. TriggerFyre). Se añade dentro de «Alertas (no borrar)», con sonido y sin apagarse al ocultarse. ⚠️ El enlace lleva tu token: se guarda solo en ese navegador y va dentro de los archivos descargados (no se suben a git); no los compartas.
3. **OBS Studio**: pulsa **Descargar OBS (.json)** → en OBS **Colección de escenas → Importar** → botón **…** → elige `GTAVI-el_chachocanario-OBS.json` → marca la casilla → **Importar**, y actívala en **Colección de escenas → GTA VI · el_chachocanario**. Pon la misma resolución en **Ajustes → Vídeo → Resolución base (lienzo)**.
4. **Streamlabs Desktop**: pulsa **Descargar Streamlabs (.overlay)** → **Ajustes → Colecciones de escenas → Importar archivo de overlay** → elige `GTAVI-el_chachocanario.overlay`.
5. Se crean 6 escenas: Empezamos en breve, Empezamos en breve (cámara), En partida (captura de juego + webcam + marco + alertas), Vuelvo enseguida, Fin del directo y "Alertas (no borrar)", que va dentro de las demás. En "En partida" abre las propiedades de **Webcam** y elige tu cámara (se ajusta sola al marco), y revisa que **Captura de juego** pilla GTA.
6. Si mueves la carpeta, vuelve a abrir `install.html` desde el sitio nuevo, descarga e importa otra vez.

Los dos archivos descargados no se suben a git (llevan rutas de tu PC). Ya no hace falta Python: `install.html` + `collection.js` sustituyen a los antiguos scripts de `tools/`.
