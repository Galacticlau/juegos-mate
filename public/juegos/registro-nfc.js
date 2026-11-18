
    const API_URL = 'https://script.google.com/macros/s/AKfycbztVKPiLxegR6kdBSYzA-Bl3EHOQDRWUNr7TFl91nCaB-TshWXj_1Vjk2JKlplSyMQ/exec';
    const parametros = new URLSearchParams(location.search);
    const tokenPagina = normalizarToken(parametros.get('token') || '');
    const modoDocente = parametros.get('modo') === 'docente';

    const seccionInicio = document.getElementById('inicio');
    const seccionAlumno = document.getElementById('alumno');
    const seccionDocente = document.getElementById('docente');

    if (modoDocente) {
      seccionDocente.classList.remove('oculto');
    } else if (tokenPagina) {
      seccionAlumno.classList.remove('oculto');
    } else {
      seccionInicio.classList.remove('oculto');
    }

    function normalizarToken(valor) {
      return String(valor || '').trim().toUpperCase().replace(/\s+/g, '');
    }

    async function sha256(texto) {
      const bytes = new TextEncoder().encode(String(texto));
      const hash = await crypto.subtle.digest('SHA-256', bytes);
      return [...new Uint8Array(hash)]
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
    }

    function llamarApi(parametrosApi, tiempoMaximo = 18000) {
      return new Promise((resolve, reject) => {
        if (!API_URL.startsWith('https://script.google.com/')) {
          reject(new Error('Primero configura API_URL dentro de index.html.'));
          return;
        }

        const callback = '__nfc_' + Date.now() + '_' + Math.floor(Math.random() * 100000);
        const script = document.createElement('script');
        let temporizador;

        const limpiar = () => {
          clearTimeout(temporizador);
          delete window[callback];
          script.remove();
        };

        window[callback] = datos => {
          limpiar();
          resolve(datos);
        };

        const query = new URLSearchParams({
          ...parametrosApi,
          callback,
          t: Date.now().toString()
        });

        script.src = API_URL + '?' + query.toString();
        script.onerror = () => {
          limpiar();
          reject(new Error('No se pudo conectar con Google Apps Script.'));
        };

        temporizador = setTimeout(() => {
          limpiar();
          reject(new Error('La respuesta tardó demasiado. Revisa Internet y la implementación.'));
        }, tiempoMaximo);

        document.head.appendChild(script);
      });
    }

    function mostrarEstado(elemento, mensaje, tipo = 'info') {
      elemento.textContent = mensaje;
      elemento.className = 'estado visible ' + tipo;
    }

    // -------------------- VISTA DEL ESTUDIANTE --------------------
    const btnConsultar = document.getElementById('btnConsultar');
    const pinAlumno = document.getElementById('pinAlumno');
    const estadoAlumno = document.getElementById('estadoAlumno');

    btnConsultar?.addEventListener('click', consultarAlumno);
    pinAlumno?.addEventListener('keydown', evento => {
      if (evento.key === 'Enter') consultarAlumno();
    });

    async function consultarAlumno() {
      const pin = pinAlumno.value.trim();
      if (!/^\d{4,8}$/.test(pin)) {
        mostrarEstado(estadoAlumno, 'Ingresa tu PIN numérico.', 'aviso');
        return;
      }

      btnConsultar.disabled = true;
      mostrarEstado(estadoAlumno, 'Consultando tus registros…', 'info');

      try {
        const pinHash = await sha256(pin);
        const respuesta = await llamarApi({
          accion: 'consultar',
          token: tokenPagina,
          pinHash
        });

        if (!respuesta.ok) {
          throw new Error(respuesta.mensaje || 'No fue posible consultar los registros.');
        }

        document.getElementById('nombreAlumno').textContent = respuesta.alumno.nombre;
        document.getElementById('cursoAlumno').textContent = respuesta.alumno.curso || '';
        document.getElementById('puntajeTotal').textContent = respuesta.alumno.puntajeTotal;
        document.getElementById('cantidadRegistros').textContent = respuesta.alumno.cantidadRegistros;

        const lista = document.getElementById('listaRegistros');
        lista.innerHTML = '';

        if (!respuesta.registros.length) {
          lista.innerHTML = '<p class="muted">Todavía no tienes registros.</p>';
        } else {
          for (const item of respuesta.registros) {
            const fila = document.createElement('div');
            fila.className = 'registro';

            const bloque = document.createElement('div');
            const tarea = document.createElement('strong');
            const fecha = document.createElement('div');
            tarea.textContent = item.tarea;
            fecha.className = 'fecha';
            fecha.textContent = item.fecha;
            bloque.append(tarea, fecha);

            const puntos = document.createElement('div');
            puntos.className = 'puntos';
            puntos.textContent = '+' + item.puntaje;

            fila.append(bloque, puntos);
            lista.appendChild(fila);
          }
        }

        document.getElementById('datosAlumno').classList.remove('oculto');
        mostrarEstado(estadoAlumno, 'Datos actualizados.', 'exito');
      } catch (error) {
        document.getElementById('datosAlumno').classList.add('oculto');
        mostrarEstado(estadoAlumno, error.message, 'error');
      } finally {
        btnConsultar.disabled = false;
      }
    }

    // ---------------------- PANEL DOCENTE NFC ----------------------
    const btnActivarNfc = document.getElementById('btnActivarNfc');
    const btnRegistroManual = document.getElementById('btnRegistroManual');
    const claveDocente = document.getElementById('claveDocente');
    const tokenManual = document.getElementById('tokenManual');
    const estadoDocente = document.getElementById('estadoDocente');
    const textoLector = document.getElementById('textoLector');
    const detalleLector = document.getElementById('detalleLector');

    let lectorActivo = false;
    let claveHashSesion = '';
    let ultimoToken = '';
    let ultimoMomento = 0;

    btnActivarNfc?.addEventListener('click', activarLectorNfc);
    btnRegistroManual?.addEventListener('click', async () => {
      try {
        await asegurarClaveDocente();
        const token = normalizarToken(tokenManual.value);
        if (!token) throw new Error('Escribe un token válido.');
        await registrarToken(token);
      } catch (error) {
        mostrarEstado(estadoDocente, error.message, 'error');
      }
    });

    async function asegurarClaveDocente() {
      const clave = claveDocente.value.trim();
      if (clave.length < 8) {
        throw new Error('Escribe la clave docente de al menos 8 caracteres.');
      }
      claveHashSesion = await sha256(clave);
    }

    async function activarLectorNfc() {
      try {
        await asegurarClaveDocente();

        if (!('NDEFReader' in window)) {
          throw new Error('Este navegador no admite Web NFC. Usa Chrome en Android.');
        }

        btnActivarNfc.disabled = true;
        textoLector.textContent = 'Solicitando permiso…';
        detalleLector.textContent = 'Acepta el permiso NFC cuando Chrome lo muestre.';

        const lector = new NDEFReader();
        await lector.scan();
        lectorActivo = true;

        lector.onreadingerror = () => {
          mostrarEstado(
            estadoDocente,
            'No se pudo leer la tarjeta. Revisa que esté formateada como NDEF.',
            'error'
          );
        };

        lector.onreading = async evento => {
          try {
            const token = extraerTokenDeMensaje(evento.message);
            if (!token) {
              throw new Error('La tarjeta no contiene un enlace con ?token=...');
            }

            const ahora = Date.now();
            if (token === ultimoToken && ahora - ultimoMomento < 3500) return;
            ultimoToken = token;
            ultimoMomento = ahora;

            await registrarToken(token);
          } catch (error) {
            mostrarEstado(estadoDocente, error.message, 'error');
            vibrar([120, 80, 120]);
          }
        };

        textoLector.textContent = 'Lector activo';
        detalleLector.textContent = 'Acerca una tarjeta a la parte posterior del teléfono.';
        mostrarEstado(estadoDocente, 'Lector NFC listo.', 'exito');
        btnActivarNfc.textContent = 'Lector NFC activo';
      } catch (error) {
        lectorActivo = false;
        btnActivarNfc.disabled = false;
        textoLector.textContent = 'Lector detenido';
        detalleLector.textContent = 'Revisa NFC, navegador y permisos.';
        mostrarEstado(estadoDocente, error.message, 'error');
      }
    }

    function extraerTokenDeMensaje(mensaje) {
      for (const registro of mensaje.records) {
        let contenido = '';

        if (
          registro.recordType === 'url' ||
          registro.recordType === 'absolute-url' ||
          registro.recordType === 'text'
        ) {
          contenido = new TextDecoder(registro.encoding || 'utf-8').decode(registro.data);
        }

        if (!contenido) continue;

        try {
          const url = new URL(contenido);
          const token = normalizarToken(url.searchParams.get('token') || '');
          if (token) return token;
        } catch (_) {
          const directo = contenido.match(/(?:TOKEN:)?([A-Z0-9]{12,40})/i);
          if (directo) return normalizarToken(directo[1]);
        }
      }

      return '';
    }

    async function registrarToken(token) {
      if (!claveHashSesion) await asegurarClaveDocente();

      textoLector.textContent = 'Procesando…';
      detalleLector.textContent = 'Tarjeta detectada.';
      mostrarEstado(estadoDocente, 'Registrando…', 'info');

      const respuesta = await llamarApi({
        accion: 'registrar',
        token,
        claveHash: claveHashSesion
      });

      if (!respuesta.ok) {
        const tipo = respuesta.duplicado ? 'aviso' : 'error';
        mostrarEstado(estadoDocente, respuesta.mensaje, tipo);
        textoLector.textContent = respuesta.duplicado ? 'Registro ya existente' : 'No registrado';
        detalleLector.textContent = respuesta.alumno || 'Acerca otra tarjeta.';
        vibrar(respuesta.duplicado ? [80] : [120, 80, 120]);
        return;
      }

      const mensaje =
        '✅ ' + respuesta.alumno + '\n' +
        respuesta.tarea + '\n' +
        '+' + respuesta.puntaje + ' puntos · ' + respuesta.hora;

      mostrarEstado(estadoDocente, mensaje, 'exito');
      textoLector.textContent = respuesta.alumno;
      detalleLector.textContent = respuesta.tarea + ' · +' + respuesta.puntaje + ' puntos';
      tokenManual.value = '';
      vibrar([70, 45, 70]);
    }

    function vibrar(patron) {
      if ('vibrate' in navigator) navigator.vibrate(patron);
    }
  
const formulario = document.getElementById('accesoTarjeta');
formulario.addEventListener('submit', evento => {
  evento.preventDefault();
  const token = normalizarToken(document.getElementById('tokenAcceso').value);
  if (!token) return;
  const url = new URL(location.href);
  url.search = new URLSearchParams({ token }).toString();
  location.assign(url);
});
