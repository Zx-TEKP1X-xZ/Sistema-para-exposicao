// ====================================================
// TERMINAL DE CAIXA PDV // BIPAGEM AUTOMÁTICA E CONTÍNUA
// ====================================================

// 1. Relógio do Cabeçalho
function updateClock() {
    const clockEl = document.getElementById('clock');
    if (clockEl) {
        clockEl.innerText = new Date().toLocaleTimeString('pt-BR');
    }
}
setInterval(updateClock, 1000);
updateClock();

// 2. Banco de Dados Simulado (Será substituído pelas buscas no PostgreSQL / Hono)
const bancoProdutosSimulado = {
    "78910001": { id: 1, nome: "Caderno Universitário Fallout", preco: 35.50 },
    "78910002": { id: 2, nome: "Caneta Esferográfica Dourada", preco: 4.00 },
    "78910003": { id: 3, nome: "Mochila Lona Resistente", preco: 185.00 },
    "78910004": { id: 4, nome: "Tinta Acrílica Terracotta", preco: 17.50 },
    "78910005": { id: 5, nome: "Rádio Valvulado Portátil", preco: 320.00 },
    "78910006": { id: 6, nome: "Refrigerante Nuka Cola", preco: 8.50 },
    "78910007": { id: 7, nome: "Kit Marcadores Fluorescentes", preco: 22.90 }
};

// Estado da Venda
let carrinho = [];
let metodoPagamento = "DINHEIRO";
let descontoGeral = 0;

// Elementos da Interface
const inputCodigo = document.getElementById('codigo_barras_baixa');
const inputQtd = document.getElementById('qtd_scanner');
const listaCorpo = document.getElementById('lista-itens-corpo');
const msgVazio = document.getElementById('msg-vazio');
const statusLog = document.getElementById('status-log');

// Elementos dos Totais
const displayValorTotal = document.getElementById('display-total-valor');
const resumoTotalItens = document.getElementById('resumo-total-itens');
const resumoSubtotal = document.getElementById('resumo-subtotal');
const inputDesconto = document.getElementById('desconto-geral');

// Formatação Monetária
function formatarMoeda(valor) {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// Emite um Bip sonoro (Sucesso/Erro) usando a Web Audio API nativa
function emitirSomBip(sucesso = true) {
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        
        if (sucesso) {
            osc.frequency.setValueAtTime(1400, audioCtx.currentTime);
            gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.08);
        } else {
            osc.frequency.setValueAtTime(300, audioCtx.currentTime);
            gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.18);
        }
    } catch (e) {}
}

// Foca automaticamente no campo do scanner para não perder bipagens
function focarInputCodigo() {
    if (inputCodigo) {
        inputCodigo.focus();
    }
}

// 3. FUNÇÃO PRINCIPAL: BIPAR PRODUTO
function biparProduto() {
    let codigo = inputCodigo ? inputCodigo.value.trim() : "";
    let qtdAdicionar = inputQtd ? parseInt(inputQtd.value) || 1 : 1;

    if (!codigo) {
        return;
    }

    // Suporte para multiplicar no scanner ex: 3*78910001
    if (codigo.includes('*')) {
        const partes = codigo.split('*');
        const qtdMulti = parseInt(partes[0]);
        if (!isNaN(qtdMulti) && qtdMulti > 0) {
            qtdAdicionar = qtdMulti;
            codigo = partes[1].trim();
        }
    }

    // Busca o produto no banco
    let produtoEncontrado = bancoProdutosSimulado[codigo];

    if (produtoEncontrado) {
        // LÓGICA DE RECONHECIMENTO: Se já existe no carrinho, soma a quantidade
        const itemExistente = carrinho.find(item => item.codigo === codigo);

        if (itemExistente) {
            itemExistente.quantidade += qtdAdicionar;
            itemExistente.total = itemExistente.quantidade * itemExistente.precoUnitario;
        } else {
            carrinho.push({
                codigo: codigo,
                nome: produtoEncontrado.nome,
                precoUnitario: produtoEncontrado.preco,
                quantidade: qtdAdicionar,
                total: qtdAdicionar * produtoEncontrado.preco
            });
        }

        emitirSomBip(true);
        if (statusLog) {
            statusLog.innerHTML = `:: [✓] BIPADO: ${produtoEncontrado.nome.toUpperCase()} (Qtd: +${qtdAdicionar}) <span class="blink">■</span>`;
        }

        // Limpa e reseta os campos para a próxima bipagem automática
        inputCodigo.value = "";
        if (inputQtd) inputQtd.value = "1";
        renderizarCarrinho();

    } else {
        emitirSomBip(false);
        if (statusLog) {
            statusLog.innerHTML = `:: [ERRO] CÓDIGO [${codigo}] NÃO CADASTRADO NO BANCO <span class="blink">■</span>`;
        }
        inputCodigo.select();
    }
}

// 4. ESCUTA DE DIGITAÇÃO AUTOMÁTICA DO LEITOR
if (inputCodigo) {
    // Detecta a tecla ENTER enviada pelo leitor de código de barras
    inputCodigo.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            biparProduto();
        }
    });

    // Se o leitor bipar um código de 8 dígitos padrão (ex: EAN-8/78910001), aceita sem nem precisar do Enter
    inputCodigo.addEventListener('input', function() {
        const val = this.value.trim();
        if (val.length === 8 && bancoProdutosSimulado[val]) {
            biparProduto();
        }
    });
}

// 5. RENDERIZAÇÃO E BOTÕES (+ / - / X) NO CARRINHO
function renderizarCarrinho() {
    if (!listaCorpo) return;

    listaCorpo.innerHTML = "";

    if (carrinho.length === 0) {
        if (msgVazio) msgVazio.classList.remove('hidden');
        atualizarTotais(0, 0);
        return;
    }

    if (msgVazio) msgVazio.classList.add('hidden');

    let subtotalGeral = 0;
    let qtdTotalItens = 0;

    carrinho.forEach((item, index) => {
        subtotalGeral += item.total;
        qtdTotalItens += item.quantidade;

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="col-idx">#${String(index + 1).padStart(2, '0')}</td>
            <td class="col-cod">${item.codigo}</td>
            <td class="col-nome">${item.nome}</td>
            <td class="col-qtd txt-center">
                <button type="button" class="btn-del-item" onclick="alterarQuantidadeManual(${index}, -1)">-</button>
                <span style="margin: 0 4px;">${item.quantidade}</span>
                <button type="button" class="btn-del-item" onclick="alterarQuantidadeManual(${index}, 1)">+</button>
            </td>
            <td class="col-unit txt-right">${formatarMoeda(item.precoUnitario)}</td>
            <td class="col-total txt-right">${formatarMoeda(item.total)}</td>
            <td class="txt-center">
                <button type="button" class="btn-del-item" onclick="removerItem(${index})" title="Remover Item">X</button>
            </td>
        `;
        listaCorpo.appendChild(tr);
    });

    atualizarTotais(subtotalGeral, qtdTotalItens);

    // Scrolla a tabela automaticamente para o último item adicionado
    const wrapper = document.getElementById('tabela-scroll');
    if (wrapper) wrapper.scrollTop = wrapper.scrollHeight;
}

// Ações manuais de alterar quantidade via botões + e -
function alterarQuantidadeManual(index, delta) {
    if (carrinho[index]) {
        carrinho[index].quantidade += delta;
        
        if (carrinho[index].quantidade <= 0) {
            carrinho.splice(index, 1);
        } else {
            carrinho[index].total = carrinho[index].quantidade * carrinho[index].precoUnitario;
        }
        renderizarCarrinho();
        focarInputCodigo();
    }
}

function removerItem(index) {
    if (carrinho[index]) {
        carrinho.splice(index, 1);
        renderizarCarrinho();
        focarInputCodigo();
    }
}

// 6. CÁLCULO DOS TOTAIS E DESCONTO GERAL
function atualizarTotais(subtotal, totalItens) {
    const pctDesc = inputDesconto ? parseFloat(inputDesconto.value) || 0 : 0;
    const valorDesconto = subtotal * (pctDesc / 100);
    const totalComDesconto = Math.max(0, subtotal - valorDesconto);

    if (resumoTotalItens) resumoTotalItens.innerText = totalItens;
    if (resumoSubtotal) resumoSubtotal.innerText = formatarMoeda(subtotal);
    if (displayValorTotal) displayValorTotal.innerText = formatarMoeda(totalComDesconto);
}

function atualizarDescontoGeral() {
    renderizarCarrinho();
}

function aplicarDescontoRapido(pct) {
    if (inputDesconto) {
        inputDesconto.value = pct;
        atualizarDescontoGeral();
    }
}

// 7. SELEÇÃO DA FORMA DE PAGAMENTO
function selecionarPagamento(btn) {
    document.querySelectorAll('.btn-pagamento').forEach(b => b.classList.remove('ativo'));
    btn.classList.add('ativo');
    metodoPagamento = btn.getAttribute('data-metodo') || 'DINHEIRO';
}

// 8. FINALIZAÇÃO DO PEDIDO & MODAL
function fecharPedido() {
    if (carrinho.length === 0) {
        if (statusLog) statusLog.innerHTML = `:: [ERRO] CAIXA VAZIO // BIPE ITENS ANTES DE FECHAR <span class="blink">■</span>`;
        emitirSomBip(false);
        focarInputCodigo();
        return;
    }

    const subtotal = carrinho.reduce((acc, i) => acc + i.total, 0);
    const pctDesc = inputDesconto ? parseFloat(inputDesconto.value) || 0 : 0;
    const valorTotal = Math.max(0, subtotal - (subtotal * (pctDesc / 100)));

    // Estrutura do Pedido para envio futuro ao Backend (PostgreSQL)
    const pedidoFinalizado = {
        forma_pagamento: metodoPagamento,
        subtotal: subtotal,
        desconto_porcentagem: pctDesc,
        valor_total: valorTotal,
        itens: carrinho
    };

    console.log(":: Venda Finalizada e pronta para gravação no Banco:", pedidoFinalizado);

    // Exibe resumo no Modal de Sucesso
    const modalTexto = document.getElementById('modal-resumo-texto');
    if (modalTexto) {
        modalTexto.innerHTML = `
            <strong>FORMA DE PAGAMENTO:</strong> ${metodoPagamento}<br>
            <strong>TOTAL DE ITENS:</strong> ${carrinho.reduce((acc, i) => acc + i.quantidade, 0)} un<br>
            <strong>DESCONTO APLICADO:</strong> ${pctDesc}%<br>
            <hr style="border: 0; border-top: 1px dashed #555; margin: 8px 0;">
            <span style="font-size: 1.2rem; color: #ffe066;"><strong>TOTAL PAGO:</strong> ${formatarMoeda(valorTotal)}</span>
        `;
    }

    const modal = document.getElementById('modal-sucesso');
    if (modal) modal.classList.remove('hidden');
}

function fecharModalSucesso() {
    const modal = document.getElementById('modal-sucesso');
    if (modal) modal.classList.add('hidden');
    limparVenda();
}

function limparVenda() {
    carrinho = [];
    if (inputDesconto) inputDesconto.value = "0";
    if (inputCodigo) inputCodigo.value = "";
    if (inputQtd) inputQtd.value = "1";
    renderizarCarrinho();
    if (statusLog) statusLog.innerHTML = `:: MODO DE CAIXA CONTÍNUO // AGUARDANDO BIPE NO LEITOR <span class="blink">■</span>`;
    focarInputCodigo();
}

// 9. ATALHOS TECLADO CAIXA (F2, F4, ESC)
document.addEventListener('keydown', function(event) {
    if (event.key === 'F4') {
        event.preventDefault();
        fecharPedido();
    }
    if (event.key === 'F2') {
        event.preventDefault();
        limparVenda();
    }
    if (event.key === 'Escape') {
        const modal = document.getElementById('modal-sucesso');
        if (modal && !modal.classList.contains('hidden')) {
            fecharModalSucesso();
        } else {
            window.location.href = 'index.html';
        }
    }
});

// Inicialização da tela
focarInputCodigo();
renderizarCarrinho();