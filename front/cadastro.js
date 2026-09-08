// Relógio do Cabeçalho
function updateClock() {
    const clockEl = document.getElementById('clock');
    if (clockEl) {
        clockEl.innerText = new Date().toLocaleTimeString('pt-BR');
    }
}
setInterval(updateClock, 1000);
updateClock();

// Manipulação do Formulário de Cadastro
const formCadastro = document.getElementById('form-cadastro');
const inputCodigo = document.getElementById('codigo_barras');

if (formCadastro) {
    formCadastro.addEventListener('submit', function(e) {
        e.preventDefault();

        const statusLog = document.getElementById('status-log');
        const produto = {
            codigo_barras: document.getElementById('codigo_barras')?.value || '',
            nome: document.getElementById('nome')?.value || '',
            quantidade: document.getElementById('quantidade')?.value || 0,
            preco: document.getElementById('preco')?.value || 0
        };

        console.log("Produto pronto para envio API:", produto);

        if (statusLog) {
            statusLog.innerHTML = `:: [✓] PRODUTO '${produto.nome.toUpperCase()}' CADASTRADO COM SUCESSO! <span class="blink">■</span>`;
        }
        
        formCadastro.reset();
        if (inputCodigo) inputCodigo.focus();

        setTimeout(() => {
            if (statusLog) {
                statusLog.innerHTML = `:: AGUARDANDO ENTRADA DE DADOS <span class="blink">■</span>`;
            }
        }, 4000);
    });
}

// Atalho ESC
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        window.location.href = 'index.html';
    }
});