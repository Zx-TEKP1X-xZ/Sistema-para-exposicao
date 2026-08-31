function updateClock() {
    const clockEl = document.getElementById('clock');
    if (clockEl) {
        clockEl.innerText = new Date().toLocaleTimeString('pt-BR');
    }
}
setInterval(updateClock, 1000);
updateClock();


const inputCodigoBaixa = document.getElementById('codigo_barras_baixa');
const formBaixa = document.getElementById('form-baixa');

const bancoProdutosSimulado = {
    "78910001": { nome: "Caderno Universitário Fallout", preco: 35.50, estoque: 42 },
    "78910002": { nome: "Caneta Esferográfica Dourada", preco: 4.00, estoque: 120 },
    "78910003": { nome: "Mochila Lona Resistente", preco: 185.00, estoque: 3 },
    "78910004": { nome: "Tinta Acrílica Terracotta", preco: 17.50, estoque: 15 }
};

let produtoAtualBaixa = null;

function buscarParaBaixa() {
    const statusLog = document.getElementById('status-log');
    const codigo = inputCodigoBaixa ? inputCodigoBaixa.value.trim() : "";

    if (!codigo) {
        if (statusLog) statusLog.innerHTML = `:: [ERRO] INSIRA OU BIPE UM CÓDIGO VÁLIDO <span class="blink">■</span>`;
        return;
    }

    if (bancoProdutosSimulado[codigo]) {
        produtoAtualBaixa = bancoProdutosSimulado[codigo];

        if (document.getElementById('nome_baixa')) document.getElementById('nome_baixa').value = produtoAtualBaixa.nome;
        if (document.getElementById('preco_original')) document.getElementById('preco_original').value = produtoAtualBaixa.preco.toFixed(2);
        if (document.getElementById('preco_final')) document.getElementById('preco_final').value = produtoAtualBaixa.preco.toFixed(2);
        if (document.getElementById('quantidade_baixa')) document.getElementById('quantidade_baixa').value = 1;
        if (document.getElementById('desconto_porcentagem')) document.getElementById('desconto_porcentagem').value = 0;

        if (formBaixa) {
            formBaixa.style.opacity = "1";
            formBaixa.style.pointerEvents = "auto";
        }

        if (statusLog) statusLog.innerHTML = `:: PRODUTO DETECTADO. AJUSTE OS VALORES OU CONFIRME A BAIXA <span class="blink">■</span>`;
        const pFinal = document.getElementById('preco_final');
        if (pFinal) {
            pFinal.focus();
            pFinal.select();
        }
    } else {
        if (statusLog) statusLog.innerHTML = `:: [ERRO] PRODUTO NÃO ENCONTRADO NO BANCO <span class="blink">■</span>`;
        if (formBaixa) {
            formBaixa.style.opacity = "0.5";
            formBaixa.style.pointerEvents = "none";
        }
    }
}

if (inputCodigoBaixa) {
    inputCodigoBaixa.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            buscarParaBaixa();
        }
    });
}

function calcularValores(origem) {
    if (!produtoAtualBaixa) return;

    const inputQtd = document.getElementById('quantidade_baixa');
    const inputPorcentagem = document.getElementById('desconto_porcentagem');
    const inputPrecoOriginal = document.getElementById('preco_original');
    const inputPrecoFinal = document.getElementById('preco_final');

    const precoBaseUnitario = produtoAtualBaixa.preco;
    const qtd = parseInt(inputQtd ? inputQtd.value : 1) || 1;
    const precoBaseTotal = precoBaseUnitario * qtd;

    if (origem === 'porcentagem' && inputPorcentagem && inputPrecoFinal) {
        const pct = parseFloat(inputPorcentagem.value) || 0;
        const valorComDesconto = precoBaseTotal - (precoBaseTotal * (pct / 100));
        inputPrecoFinal.value = Math.max(0, valorComDesconto).toFixed(2);
    } 
    else if (origem === 'preco' && inputPrecoFinal && inputPorcentagem) {
        const precoDigitado = parseFloat(inputPrecoFinal.value) || 0;
        if (precoBaseTotal > 0) {
            const diferenca = precoBaseTotal - precoDigitado;
            const pctCalculada = (diferenca / precoBaseTotal) * 100;
            inputPorcentagem.value = Math.max(0, pctCalculada).toFixed(1);
        }
    } 
    else if (origem === 'qtd' && inputPrecoOriginal && inputPorcentagem && inputPrecoFinal) {
        inputPrecoOriginal.value = precoBaseTotal.toFixed(2);
        const pct = parseFloat(inputPorcentagem.value) || 0;
        const valorComDesconto = precoBaseTotal - (precoBaseTotal * (pct / 100));
        inputPrecoFinal.value = Math.max(0, valorComDesconto).toFixed(2);
    }
}

function aplicarDescontoRapido(porcentagem) {
    if (!produtoAtualBaixa) return;
    const inputPorcentagem = document.getElementById('desconto_porcentagem');
    if (inputPorcentagem) {
        inputPorcentagem.value = porcentagem;
        calcularValores('porcentagem');
    }
}

if (formBaixa) {
    formBaixa.addEventListener('submit', function(e) {
        e.preventDefault();

        const statusLog = document.getElementById('status-log');
        const resumoVenda = {
            codigo: inputCodigoBaixa ? inputCodigoBaixa.value : '',
            produto: document.getElementById('nome_baixa')?.value || '',
            quantidade: document.getElementById('quantidade_baixa')?.value || 1,
            preco_original: document.getElementById('preco_original')?.value || '0.00',
            desconto_aplicado: (document.getElementById('desconto_porcentagem')?.value || 0) + '%',
            total_pago: document.getElementById('preco_final')?.value || '0.00'
        };

        console.log("Baixa enviada para o Backend:", resumoVenda);

        if (statusLog) statusLog.innerHTML = `:: [✓] BAIXA CONCLUÍDA! TOTAL: R$ ${resumoVenda.total_pago} <span class="blink">■</span>`;

        formBaixa.reset();
        if (inputCodigoBaixa) {
            inputCodigoBaixa.value = "";
            inputCodigoBaixa.focus();
        }
        formBaixa.style.opacity = "0.5";
        formBaixa.style.pointerEvents = "none";

        setTimeout(() => {
            if (statusLog) statusLog.innerHTML = `:: AGUARDANDO BIPE NO LEITOR <span class="blink">■</span>`;
        }, 4000);
    });
}

// Atalho ESC
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        window.location.href = 'index.html';
    }
});