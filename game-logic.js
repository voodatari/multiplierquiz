// --- LÓGICA PRINCIPAL DEL JUEGO ---

// Nuevas variables para el temporizador por pregunta
let questionTimer = null;
let currentQuestionTimeLeft = 0;
let streak = 0; // aciertos seguidos (efecto visual)


function startContest(mode) {
    gameMode = mode;
    score = 0;
    errors = 0;
    totalTimeElapsed = 0;
    startTime = Date.now();
    streak = 0;
    updateStreak(0);
    updatePlayerChip();
    // En modo docente la práctica libre se termina (y se guarda) con este botón
    mainMenuButton.textContent = (isTeacherMode() && currentStudent && mode === 'free')
        ? '✅ Terminar y guardar'
        : 'Volver al Menú Principal';
    
    rightInfoDisplay.classList.remove('time-warning');
    rightInfoDisplay.style.display = 'inline'; 
    centerTimeDisplay.style.display = 'none'; 
    
    gameContainer.classList.remove('game-content-hidden'); 
    stopFreeModeTimer();
    // Detener temporizador de pregunta si estaba activo
    stopQuestionTimer(); 
    
    modeSelectionModal.style.display = 'none'; 
    timeSelectionModal.style.display = 'none';
    playerNameModal.style.display = 'none';
    rankingModal.style.display = 'none';
    
    stopBGM();

    playSound(startSound);
    gameStarted = true; 
    mainMenuButton.style.display = 'block'; 

    if (gameMode === 'chrono') {
         gameTitleEl.textContent = 'Modo Contrarreloj';
         timeLeft = initialTime;
         rightInfoDisplay.textContent = `Tiempo: ${timeLeft}s`;
         if (nextQuestionButton) nextQuestionButton.style.display = 'none';
         startChronoTimer();
         playBGM('2.mp3'); 
    } else if (gameMode === 'sudden_death') {
         gameTitleEl.textContent = 'Muerte Súbita';
         startTime = Date.now(); 
         rightInfoDisplay.textContent = `Tiempo: 0s`; // Muestra el tiempo total transcurrido
         centerTimeDisplay.style.display = 'block'; // Muestra el tiempo por pregunta
         if (nextQuestionButton) nextQuestionButton.style.display = 'none';
         startSuddenDeathTimer(); // Temporizador que mide el tiempo total de la partida
         playBGM('3.mp3');
    } else { // free
         gameTitleEl.textContent = 'Práctica Libre';
         rightInfoDisplay.textContent = `Errores: ${errors}`;
         if (nextQuestionButton) nextQuestionButton.style.display = 'none'; 
         startFreeModeTimer(); 
         playBGM('1.mp3');
    }
    
    scoreDisplay.textContent = `Puntuación: ${score}`;
    generateNewQuestion();
    enableOptions(true);
}

// --- FUNCIÓN CORREGIDA ---
function handleAnswer(event) {
    if (!gameStarted) return; 
    
    const selectedButton = event.currentTarget;
    // selectedAnswer será NaN si el tiempo se agota (value: null)
    const selectedAnswer = parseInt(selectedButton.value); 

    enableOptions(false);
    
    // Parar temporizador de pregunta al contestar en Muerte Súbita
    if (gameMode === 'sudden_death') {
        stopQuestionTimer();
    }
    
    if (gameMode === 'free') {
         // stopFreeModeTimer deja el intervalo a null: así endGame no vuelve a sumar este tramo
         if (freeModeTimerInterval && freeModeTimerStartTime > 0) {
            totalTimeElapsed += (Date.now() - freeModeTimerStartTime) / 1000;
         }
         stopFreeModeTimer();
    }

    if (selectedAnswer === correctAnswer) {
        score++;
        streak++;
        playSound(aciertoSound);
        updateFeedback('¡Correcto!', true);
        floatText('+1', selectedButton);
        updateStreak(streak);
        restartAnimation(scoreDisplay, 'score-bump');
        
        if (gameMode === 'chrono' || gameMode === 'sudden_death') {
            // --- INICIO DE LA MODIFICACIÓN ---
            // Cambiado de 500 a 100 para acortar la pausa al acertar
            autoAdvanceTimeout = setTimeout(() => {
                if (gameStarted) { 
                    resetOptionStyles();
                    feedbackMessage.style.opacity = '0';
                    generateNewQuestion();
                    enableOptions(true);
                }
            }, 100); 
            // --- FIN DE LA MODIFICACIÓN ---
        } else {
            if (nextQuestionButton) nextQuestionButton.style.display = 'block';
        }

    } else {
        errors++;
        streak = 0;
        playSound(errorSound);
        updateFeedback('Incorrecto.', false);
        updateStreak(0);
        restartAnimation(document.getElementById('options-container'), 'shake');
        const correctBtn = optionButtons.find(btn => parseInt(btn.value) === correctAnswer);
        if (correctBtn) correctBtn.classList.add('correct-answer');
        
        // --- INICIO DE LA CORRECCIÓN 1 ---
        // Solo añade la clase si selectedButton es un elemento real (tiene classList)
        if (selectedButton && selectedButton.classList) {
            selectedButton.classList.add('incorrect-choice');
        }
        // --- FIN DE LA CORRECCIÓN 1 ---
        
        if (gameMode === 'sudden_death') {
             // Esta sección ahora SÍ se ejecutará cuando se agote el tiempo
             if (timerInterval) clearInterval(timerInterval); 
             setTimeout(() => endGame(true),  500); // Esta pausa de 500ms al fallar NO se altera
             return; 
        }
        
        if (gameMode === 'chrono') {
            autoAdvanceTimeout = setTimeout(() => {
                if (gameStarted) { 
                    resetOptionStyles();
                    feedbackMessage.style.opacity = '0';
                    generateNewQuestion();
                    enableOptions(true);
                }
            }, 500); // Esta pausa de 500ms al fallar NO se altera
        }
        
        if (gameMode === 'free') {
            rightInfoDisplay.textContent = `Errores: ${errors}`; 
            if (nextQuestionButton) nextQuestionButton.style.display = 'block';
        }
    }

    // --- INICIO DE LA CORRECCIÓN 2 ---
    // Añade esta comprobación también aquí
    if (selectedButton && selectedButton.classList) {
        selectedButton.classList.add(selectedAnswer === correctAnswer ? 'correct-answer' : 'incorrect-choice');
    }
    // --- FIN DE LA CORRECCIÓN 2 ---
    
    scoreDisplay.textContent = `Puntuación: ${score}`;
    
    if (gameMode === 'free' && !correctAnswer) { 
        centerTimeDisplay.textContent = `Tiempo: ${formatTime(totalTimeElapsed)}`;
    }
}
// --- FIN DE LA FUNCIÓN CORREGIDA ---


function generateNewQuestion() {
    if (!gameStarted) return;

    if (gameMode === 'free') startFreeModeTimer();

    // Reinicia el temporizador por pregunta si está en Muerte Súbita
    if (gameMode === 'sudden_death') {
        startQuestionTimer();
    }

    const num1 = Math.floor(Math.random() * 10) + 1;
    const num2 = Math.floor(Math.random() * 10) + 1;
    correctAnswer = num1 * num2;

    let distractors = new Set();
    while (distractors.size < 2) {
        let offset = (Math.floor(Math.random() * 5) + 1) * (Math.random() < 0.5 ? 1 : -1);
        let distractor = correctAnswer + offset;
        if (distractor !== correctAnswer && distractor > 0) {
            distractors.add(distractor);
        }
    }

    const allOptions = [correctAnswer, ...Array.from(distractors)];
    allOptions.sort(() => Math.random() - 0.5);

    numberToRoundEl.textContent = `${num1} x ${num2}`;
    restartAnimation(numberToRoundEl, 'q-pop');

    optionButtons.forEach((button, index) => {
        button.textContent = allOptions[index];
        button.value = allOptions[index];
        restartAnimation(button, 'opt-flip');
    });
}


function endGame(isSuddenDeathError = false) {
    gameStarted = false;
    enableOptions(false);
    
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    if (autoAdvanceTimeout) {
        clearTimeout(autoAdvanceTimeout);
        autoAdvanceTimeout = null;
    }
    
    // En práctica libre se suma el tiempo de la pregunta en curso
    if (gameMode === 'free' && freeModeTimerInterval && freeModeTimerStartTime > 0) {
        totalTimeElapsed += (Date.now() - freeModeTimerStartTime) / 1000;
    }
    stopFreeModeTimer();
    stopQuestionTimer(); // Detiene el temporizador de pregunta
    stopBGM();
    if (isMusicOn) playBGM('fin.mp3');

    resetOptionStyles();
    updateStreak(0);

    const finalTime = (gameMode === 'chrono') ? initialTime
                    : (gameMode === 'free') ? totalTimeElapsed
                    : (Date.now() - startTime) / 1000;

    // Modo docente: se registra la partida del alumno en Supabase (sin ranking local)
    let teacherResultPromise = null;
    if (isTeacherMode() && currentStudent) {
        teacherResultPromise = recordTeacherGame({ mode: gameMode, score, errors, duration: finalTime });
    } else if (gameMode !== 'free') {
        saveScore(playerName, score, gameMode);
    }

    setTimeout(() => {
        gameContainer.classList.add('game-content-hidden');

        if (teacherResultPromise) {
            showTeacherResult(teacherResultPromise);
        } else {
            hideTeacherResult();
            displayRanking(playerName, score, gameMode);
        }

        endGameTitle.textContent = isSuddenDeathError ? '¡Has Fallado!' : 'Fin de la Partida';
        summaryTotalEl.textContent = finalTime.toFixed(2) + 's';
        summaryCorrectEl.textContent = score;
        summaryIncorrectEl.textContent = errors;
        summaryApsEl.textContent = finalTime > 0 ? (score / finalTime).toFixed(2) : '0.00';

        rankingModal.style.display = 'flex';
    },  500);
}


function startQuestionTimer() {
    if (questionTimer) clearInterval(questionTimer);
    
    if (suddenDeathTimeLimit === Infinity) {
        centerTimeDisplay.textContent = `Tiempo: ∞`;
        return;
    }
    
    currentQuestionTimeLeft = suddenDeathTimeLimit;
    centerTimeDisplay.textContent = `Tiempo: ${currentQuestionTimeLeft}s`;
    
    questionTimer = setInterval(() => {
        currentQuestionTimeLeft--;
        centerTimeDisplay.textContent = `Tiempo: ${currentQuestionTimeLeft}s`;
        centerTimeDisplay.classList.toggle('time-warning', currentQuestionTimeLeft <= 3);

        if (currentQuestionTimeLeft <= 0) {
            clearInterval(questionTimer);
            handleAnswer({ currentTarget: { value: null } }); // Simula una respuesta incorrecta
        }
    }, 1000);
}

function stopQuestionTimer() {
    if (questionTimer) {
        clearInterval(questionTimer);
        questionTimer = null;
    }
    centerTimeDisplay.classList.remove('time-warning');
}

function startChronoTimer() {
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        timeLeft--;
        rightInfoDisplay.textContent = `Tiempo: ${timeLeft}s`;
        rightInfoDisplay.classList.toggle('time-warning', timeLeft <= 10);
        if (timeLeft <= 0) endGame();
    }, 1000);
}

function startSuddenDeathTimer() {
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        const currentElapsed = (Date.now() - startTime) / 1000;
        rightInfoDisplay.textContent = `Tiempo: ${formatTime(currentElapsed)}`;
    }, 1000); 
}

function startFreeModeTimer() {
    if (freeModeTimerInterval) clearInterval(freeModeTimerInterval);
    centerTimeDisplay.style.display = 'inline';
    freeModeTimerStartTime = Date.now(); 
    centerTimeDisplay.textContent = `Tiempo: ${formatTime(totalTimeElapsed)}`;

    freeModeTimerInterval = setInterval(() => {
        totalTimeElapsed += (Date.now() - freeModeTimerStartTime) / 1000;
        freeModeTimerStartTime = Date.now(); 
        centerTimeDisplay.textContent = `Tiempo: ${formatTime(totalTimeElapsed)}`;
    }, 1000); 
}

function stopFreeModeTimer() {
    if (freeModeTimerInterval) clearInterval(freeModeTimerInterval);
    freeModeTimerInterval = null;
}

function formatTime(totalSeconds) {
    const seconds = Math.floor(totalSeconds % 60);
    const minutes = Math.floor(totalSeconds / 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}