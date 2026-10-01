/* =========================================================
   Ajustes · menú de opciones (rueda dentada del menú principal)
   - Modo ligero: lo gestiona rendimiento.js (#perf-toggle-button)
   - Escala fija: la gestiona escala.js (#scale-toggle-button)
   Aquí solo se abre y cierra la ventana y suena el clic.
   ========================================================= */
(function () {

    var modal = document.getElementById('settings-modal');

    function sonar() { if (typeof playSound === 'function' && typeof clickSound !== 'undefined') playSound(clickSound); }
    function abrir() { sonar(); modal.style.display = 'flex'; }
    function cerrar() { modal.style.display = 'none'; }

    document.getElementById('settings-button').addEventListener('click', abrir);
    document.getElementById('perf-toggle-button').addEventListener('click', sonar);
    document.getElementById('scale-toggle-button').addEventListener('click', sonar);
    modal.addEventListener('mousedown', function (e) { if (e.target === modal) cerrar(); });
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && modal.style.display === 'flex') cerrar();
    });

})();
