// audio.js

// --- MOTOR DE AUDIO ---

const AUDIO_PATH = 'music/'; 
let currentBGM = null;
// MANTENER isMusicOn como el estado de la MÚSICA DE FONDO (BGM).
// La música está activada al cargar el juego.
let isMusicOn = true;

// Inicializar Audio
const startSound = new Audio(AUDIO_PATH + 'start.mp3');
const clickSound = new Audio(AUDIO_PATH + 'click.wav');
const aciertoSound = new Audio(AUDIO_PATH + 'acierto.mp3');
const errorSound = new Audio(AUDIO_PATH + 'error.mp3');
const timeWarningSound = new Audio(AUDIO_PATH + 'warning.mp3'); 

// Función para reproducir efectos de sonido (SFX)
function playSound(audioFile, volume = 1.0) {
    // ELIMINAR LA COMPROBACIÓN: "if (!isMusicOn) return;"
    // Esto asegura que el SFX siempre se reproduzca, independientemente del estado del toggle.
    
    audioFile.pause();
    audioFile.currentTime = 0; 

    audioFile.volume = volume;
    audioFile.play().catch(e => {
         if (!e.toString().includes("denied permission")) {
            console.log("Error playing SFX:", e);
         }
    });
}

// --- Música de fondo con bucle sin cortes ---
// Con <audio loop>, Chrome deja una pequeña pausa al volver al principio de un MP3
// (no recorta el relleno que añade el codificador y el salto no es instantáneo);
// Firefox sí lo hace bien. Para que el bucle sea perfecto en todos los navegadores,
// la pista se decodifica con Web Audio y se repite muestra a muestra.
// Mientras se descarga y decodifica suena como siempre (<audio loop>) y, al acabar
// esa vuelta, entra el bucle sin cortes. Si Web Audio falla, se queda como estaba.
let audioCtx = null;
function getAudioContext() {
    if (!audioCtx) {
        const Ctx = window.AudioContext || window.webkitAudioContext;
        if (!Ctx) return null;
        try { audioCtx = new Ctx(); } catch (e) { return null; }
    }
    return audioCtx;
}

// Recorta solo el silencio digital de los extremos (el relleno del codificador, ~50 ms como mucho):
// las pistas tienen silencios rítmicos propios que no se pueden tocar
function loopBounds(buffer) {
    const limit = Math.min(2304, Math.floor(buffer.length / 4));
    const channels = [];
    for (let c = 0; c < buffer.numberOfChannels; c++) channels.push(buffer.getChannelData(c));
    const silent = i => channels.every(data => Math.abs(data[i]) < 1e-4);
    let start = 0, end = buffer.length;
    while (start < limit && silent(start)) start++;
    while (buffer.length - end < limit && silent(end - 1)) end--;
    return [start / buffer.sampleRate, end / buffer.sampleRate];
}

class BGMTrack {
    constructor(file, volume, loop) {
        this.src = AUDIO_PATH + file;   // ui-manager.js mira qué pista suena por su nombre
        this.volume = volume;
        this.stopped = false;
        this.source = null;
        this.el = new Audio(this.src);
        this.el.loop = loop;
        this.el.volume = volume;
        if (loop) this.prepareGapless();
    }

    get paused() {
        if (this.stopped) return true;
        return this.source ? audioCtx.state !== 'running' : this.el.paused;
    }

    play() {
        this.stopped = false;
        if (this.source) return audioCtx.resume();
        return this.el.play();
    }

    pause() {
        this.stopped = true;
        this.el.pause();
        if (this.source) {
            try { this.source.stop(); } catch (e) {}
            this.source = null;
        }
    }

    prepareGapless() {
        const ctx = getAudioContext();
        if (!ctx) return;
        fetch(this.src)
            .then(response => { if (!response.ok) throw new Error(response.status); return response.arrayBuffer(); })
            .then(data => ctx.decodeAudioData(data))
            .then(buffer => { if (!this.stopped) this.switchToGapless(buffer); })
            .catch(e => console.log("Bucle sin cortes no disponible, se usa <audio loop>:", e));
    }

    switchToGapless(buffer) {
        const ctx = audioCtx;
        const [loopStart, loopEnd] = loopBounds(buffer);
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.loop = true;
        source.loopStart = loopStart;
        source.loopEnd = loopEnd;
        const gain = ctx.createGain();
        gain.gain.value = this.volume;
        source.connect(gain).connect(ctx.destination);

        const el = this.el;
        if (!el.paused && isFinite(el.duration)) {
            // ya suena: el <audio> termina esta vuelta y el bucle sin cortes entra justo al acabar
            ctx.resume().then(() => {
                if (this.stopped) return;
                el.loop = false;
                const remaining = Math.max(0, (el.duration - el.currentTime) / (el.playbackRate || 1));
                source.start(ctx.currentTime + remaining, loopStart);
                this.source = source;
            }).catch(() => {});
            return;
        }
        // aún no suena (el navegador bloquea el audio hasta la primera pulsación): se cambia ya
        el.pause();
        source.start(0, loopStart);
        this.source = source;
    }
}

// Función para detener la música
function stopBGM() {
    if (currentBGM) {
        currentBGM.pause();
        currentBGM = null;
    }
}

// Función para reproducir la música de fondo (BGM)
function playBGM(file, loop = true) {
    // MANTENER LA COMPROBACIÓN: La BGM solo se reproduce si isMusicOn es TRUE.
    if (!isMusicOn) return; 
    
    stopBGM(); 
    
    const ctx = getAudioContext();
    if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {});

    const volume = (file === 'titulo.mp3' || file === 'fin.mp3') ? 0.4 : 0.6;
    currentBGM = new BGMTrack(file, volume, loop);
    
    currentBGM.play().catch(e => {
        if (!e.toString().includes("denied permission")) {
            console.log("Error playing BGM:", e);
        }
    });
}

// Los navegadores bloquean el audio hasta que el usuario interactúa con la página:
// con la primera pulsación o tecla se reanuda la música que quedó bloqueada.
function unlockAudio() {
    document.removeEventListener('pointerdown', unlockAudio, true);
    document.removeEventListener('keydown', unlockAudio, true);
    if (isMusicOn && currentBGM && currentBGM.paused) {
        currentBGM.play().catch(e => console.log("Autoplay resume error:", e));
    }
}
document.addEventListener('pointerdown', unlockAudio, true);
document.addEventListener('keydown', unlockAudio, true);

function updateMuteButton() {
    muteToggleButton.textContent = isMusicOn ? '🔊' : '🔇';
    const message = document.getElementById('mute-message');
    if (message) message.textContent = isMusicOn ? 'Pulsa para silenciar la música' : 'Pulsa para activar la música';
}

// Lógica para activar/desactivar el sonido
function toggleMusic() {
    isMusicOn = !isMusicOn;
    // El texto del botón refleja si la MÚSICA DE FONDO está activa (🔊) o no (🔇).
    updateMuteButton();

    if (isMusicOn) {
        // Al activar: Intentar reproducir la BGM apropiada
        if (!currentBGM || currentBGM.paused) {
            // Lógica para determinar qué música reproducir (título, ranking, etc.)
            // Esto asume que las variables modales están disponibles globalmente.
            if (modeSelectionModal.style.display === 'flex' || rankingModal.style.display === 'flex' || timeSelectionModal.style.display === 'flex' || playerNameModal.style.display === 'flex') {
                playBGM('titulo.mp3');
            }
            // NOTA: Si el juego ya está en una partida, `playBGM` debería ser llamado desde `startContest` de nuevo.
        } else {
             currentBGM.play().catch(e => console.log("Autoplay resume error:", e));
        }
    } else {
        // Al desactivar: Detener la BGM
        stopBGM(); 
    }
}