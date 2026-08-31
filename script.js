// Relógio do Cabeçalho
function updateClock() {
    const clockEl = document.getElementById('clock');
    if (clockEl) {
        clockEl.innerText = new Date().toLocaleTimeString('pt-BR');
    }
}
setInterval(updateClock, 1000);
updateClock();

// Feedback do Menu (Cards)
const cards = document.querySelectorAll('.menu-card');
if (cards.length > 0) {
    cards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            const statusLog = document.getElementById('status-log');
            const h2 = card.querySelector('h2');
            if (statusLog && h2) {
                statusLog.innerHTML = `:: ACESSANDO: ${h2.innerText} <span class="blink">■</span>`;
            }
        });
        card.addEventListener('mouseleave', () => {
            const statusLog = document.getElementById('status-log');
            if (statusLog) {
                statusLog.innerHTML = `:: SISTEMA PRONTO // AGUARDANDO SELEÇÃO <span class="blink">■</span>`;
            }
        });
    });
}