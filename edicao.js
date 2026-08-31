// Relógio do Cabeçalho
function updateClock() {
    const clockEl = document.getElementById('clock');
    if (clockEl) {
        clockEl.innerText = new Date().toLocaleTimeString('pt-BR');
    }
}
setInterval(updateClock, 1000);
updateClock();

const formEdicao = document.getElementById('form-edicao');
const inputBusca = document.getElementById('busca_codigo');

function buscarProduto() {
    const statusLog = document.getElementById('status-log');
    const codigo = inputBusca ? inputBusca.value.trim() : "";

    if (codigo === "") {
        if (statusLog) statusLog.innerHTML = `:: [ERRO] INSIRA UM CÓDIGO VÁLIDO <span class="blink">■</span>`;
        return;
    }

    if (statusLog) statusLog.innerHTML = `:: BUSCANDO REGISTRO [${codigo}]... <span class="blink">■</span>`;

    setTimeout(() => {
        if (document.getElementById('nome_edit')) document.getElementById('nome_edit').value = "Caderno Universitário Fallout";
        if (document.getElementById('quantidade_edit')) document.getElementById('quantidade_edit').value = "42";
        if (document.getElementById('preco_edit')) document.getElementById('preco_edit').value = "35.50";

        if (formEdicao) {
            formEdicao.style.opacity = "1";
            formEdicao.style.pointerEvents = "auto";
        }
        if (document.getElementById('nome_edit')) document.getElementById('nome_edit').focus();

        if (statusLog) statusLog.innerHTML = `:: REGISTRO LOCALIZADO. MODO EDIÇÃO ATIVO. <span class="blink">■</span>`;
    }, 600);
}

if (inputBusca) {
    inputBusca.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            buscarProduto();
        }
    });
}

if (formEdicao) {
    formEdicao.addEventListener('submit', function(e) {
        e.preventDefault();

        const statusLog = document.getElementById('status-log');
        const dadosAtualizados = {
            codigo_barras: inputBusca ? inputBusca.value : '',
            nome: document.getElementById('nome_edit')?.value || '',
            quantidade: document.getElementById('quantidade_edit')?.value || 0,
            preco: document.getElementById('preco_edit')?.value || 0
        };

        console.log("Dados atualizados prontos para envio API:", dadosAtualizados);

        if (statusLog) statusLog.innerHTML = `:: [✓] REGISTRO ATUALIZADO COM SUCESSO! <span class="blink">■</span>`;
        
        formEdicao.reset();
        if (inputBusca) {
            inputBusca.value = "";
            inputBusca.focus();
        }
        formEdicao.style.opacity = "0.5";
        formEdicao.style.pointerEvents = "none";

        setTimeout(() => {
            if (statusLog) statusLog.innerHTML = `:: MODO DE MANUTENÇÃO // AGUARDANDO BUSCA <span class="blink">■</span>`;
        }, 4000);
    });
}

// Atalhos ESC e F4
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        window.location.href = 'index.html';
    }
    if (event.key === 'F4' && formEdicao && formEdicao.style.pointerEvents === "auto") {
        event.preventDefault();
        const btnAtualizar = document.getElementById('btn-atualizar');
        if (btnAtualizar) btnAtualizar.click();
    }
});