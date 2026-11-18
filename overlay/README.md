# Overlay GTA VI · el_chachocanario (fuentes de navegador para OBS)

| Escena | Archivo | Notas |
|---|---|---|
| En partida | `ingame.html` | Transparente. Marco de webcam abajo a la derecha (288×162 en x=1604, y=890). `?hud=1` muestra la barra Jugando a / hora / en directo, `?news=1` las Noticias de Leonida, `?preview=1` pone un fondo de prueba. |
| Empezamos en breve | `starting-soon.html` | Fondo **álbum automático** (5 fotos, transiciones: zoom cruzado, barrido neón, persianas, iris, empuje). Cuenta atrás `HH:MM:SS` hasta las `00:00:00` (Europe/Madrid), configurable en `config.js` (`countdownTo`, `countdownZone`) o con `?at=21:30:00`; `?minutes=10` fuerza una duración fija. |
| Empezamos en breve (cámara) | `starting-soon-cam.html` | La misma pantalla con un hueco transparente para la webcam en lugar del chat (560×315 en x=1300, y=589, marco neón como en partida). Redirige a `starting-soon.html?cam=1`; la webcam va **debajo** de esta fuente. |
| Vuelvo enseguida | `brb.html` | Contador "Ausente". |
| Fin del directo | `stream-ending.html` | Próximo directo + últimos 5 subs. |
| Chat | `chat.html` | Transparente. Chat de Twitch de el_chachocanario suelto, para añadirlo a mano donde quieras (no va en ninguna escena; "Empezamos en breve" ya trae el suyo). Solo lectura, sin token. Oculta bots y comandos `!`, respeta los mensajes borrados por moderadores. `?test=1` mensajes de prueba. |
| Alertas Twitch | `alerts.html` | Transparente. Sub nueva, resub, subs regaladas y bits, con estrellas/cristales y confeti en canvas. `?test=1` lanza alertas de prueba. |

Las tres pantallas completas abren con la **intro en canvas** (~4 s). `?intro=0` la salta.

## Personalizar
Todo en `config.js`: canal, redes, fotos del álbum y segundos por foto, cuenta atrás, próximo directo, texto de apoyo (Prime Gaming / bits), objetivo de subs, últimos subs de ejemplo y mensajes del ticker.

En "Empezamos en breve" y "Vuelvo enseguida" se ven el objetivo de subs y los **5 últimos subs** (en "Empezamos en breve", arriba a la derecha con el chat de Twitch debajo; `?test=1` muestra mensajes de prueba); en "Fin del directo", los 5 últimos subs. Twitch no indica si una sub es de Prime (llega como Nivel 1), así que se muestran todas igual.

## Añadir a OBS
1. Fuentes → **+** → **Navegador** → marca **Archivo local** → elige el HTML.
2. Ancho **1920**, alto **1080** (si usas otro tamaño, el overlay se escala solo y se centra).
3. Marca **Actualizar navegador cuando la escena se active** (repite la intro y reinicia los contadores).
4. Alertas: añade `alerts.html` encima de tus escenas.
5. Marca **Apagar fuente cuando no sea visible** en cada fuente: Twitch permite 3 conexiones a la vez y así solo conectan la escena activa y las alertas.

Fuentes: GTA Art Deco (local, `assets/fonts`), Barlow Condensed y Yellowtail (Google Fonts; sin internet usan fuentes del sistema).
Las imágenes de fondo usan copias de 1920×1080 en `overlay/img` (unas 5 veces más ligeras que las 4K) para que carguen rápido.

## Conectar con Twitch en directo (subs, bits y objetivo reales)
Sin esto, todo funciona con los datos de ejemplo de `config.js`.
1. Entra en https://dev.twitch.tv/console → **Registrar aplicación**. URL de redirección: `http://localhost`. Copia el **Client ID**.
2. Con la sesión de el_chachocanario iniciada, abre (cambiando TU_CLIENT_ID):
   `https://id.twitch.tv/oauth2/authorize?response_type=token&client_id=TU_CLIENT_ID&redirect_uri=http://localhost&scope=channel:read:subscriptions+bits:read+channel:read:goals`
3. Acepta. La página de localhost no cargará, es normal: copia de la barra de direcciones el valor entre `access_token=` y `&`.
4. Pega ambos en `config.js` → `twitch: { clientId: "...", token: "..." }`. ⚠️ El token es privado: no compartas `config.js` ni lo subas a internet.
5. Opcional: crea un **objetivo de subs** en el Panel de creador de Twitch → Objetivos; el overlay usa ese en vez del de `config.js`.

El token caduca al cabo de un tiempo; si las alertas dejan de llegar, repite los pasos 2–4. Con el token puesto, al cargar cada escena los ejemplos de `config.js` se sustituyen por tus **suscriptores reales** (Twitch no da la fecha de cada sub, así que salen en el orden de Twitch; las subs que llegan en directo van siempre primero). Si no tienes suscriptores, la lista se oculta. Los últimos 5 subs se guardan y se comparten entre escenas; `?reset=1` vuelve a los de `config.js`.

## Panel de alertas en OBS (lanzar alertas a mano)
`control.html` es un panel con botones (Sub / Nivel 2 / Nivel 3, Resub con meses, Regalo con nº de subs, Bits) que lanza las alertas en `alerts.html`. No necesita token de Twitch.
1. OBS → **Herramientas → Ajustes del servidor WebSocket** → marca **Activar servidor WebSocket**. Pulsa **Mostrar información de conexión** y copia la contraseña.
2. OBS → **Docks → Docks de navegador personalizados**. Nombre: `Alertas`, URL: `file:///G:/obs/GTAVI/overlay/control.html` → **Aplicar**.
3. En el panel abre **Conexión con OBS**, pega la contraseña y pulsa **Guardar y conectar** (o ponla en `config.js` → `obs.password`). Debe salir **Conectado** en verde.
4. Escribe un nombre (vacío = aleatorio) y un mensaje si quieres, y pulsa un botón.

**Contar en últimos subs y objetivo**: sin marcar, solo se ve la alerta (para probar); marcado, la sub entra en los 5 últimos subs y suma al objetivo de `config.js` (si hay un objetivo de Twitch activo, ese no cambia). La alerta solo sale si la escena activa tiene "Alertas (no borrar)" (todas menos "Fin del directo").

## Streamlabs Desktop (importar escenas)
1. En Streamlabs Desktop: **Ajustes → Colecciones de escenas → Importar archivo de overlay** y elige `G:\obs\GTAVI\GTAVI-el_chachocanario.overlay`.
2. Se crea una colección nueva con 6 escenas: Empezamos en breve, Empezamos en breve (cámara), En partida (captura de juego + webcam + marco + alertas), Vuelvo enseguida, Fin del directo y "Alertas (no borrar)", que va dentro de las demás.
3. Las fuentes apuntan a los HTML de `G:\obs\GTAVI\overlay`. Si mueves la carpeta, vuelve a generar el archivo con `python tools/build_streamlabs_overlay.py` e impórtalo de nuevo.
4. Revisa en "En partida" que la webcam y la captura de juego usan tu cámara y tu juego.

## OBS Studio (importar colección de escenas)
1. En OBS: **Colección de escenas → Importar** → botón **…** → elige `G:\obs\GTAVI\GTAVI-el_chachocanario-OBS.json` → marca la casilla → **Importar**.
2. Luego **Colección de escenas → GTA VI · el_chachocanario** para activarla.
3. Mismas 6 escenas que en Streamlabs (la webcam es la misma fuente en las dos escenas que la usan). En "En partida": abre las propiedades de **Webcam** y elige tu cámara (se ajusta sola al marco), y revisa que **Captura de juego** pilla GTA.
4. Si mueves la carpeta, regenera con `python tools/build_obs_scene_collection.py`.
