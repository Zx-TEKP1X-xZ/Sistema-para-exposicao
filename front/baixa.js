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

// 2. Estado da Venda (produtos carregados do PostgreSQL via API)
let carrinho = [];
let metodoPagamento = "DINHEIRO";
let buscaEmAndamento = false;
let salvandoVenda = false;
let timerBipagem = null;
const ATRASO_BIPAGEM = 180; // ms de pausa para reconhecer o código automaticamente

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

// Agenda a consulta automática após uma pequena pausa na digitação/bipagem
function agendarBipagem() {
    clearTimeout(timerBipagem);
    timerBipagem = setTimeout(() => {
        biparProduto();
    }, ATRASO_BIPAGEM);
}

// 3. FUNÇÃO PRINCIPAL: BIPAR PRODUTO (CONSULTA O BANCO DE DADOS)
async function biparProduto() {
    if (buscaEmAndamento) {
        return;
    }

    clearTimeout(timerBipagem);
    timerBipagem = null;

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
            codigo = (partes[1] || "").trim();
        }
    }

    if (!codigo || qtdAdicionar <= 0) {
        return;
    }

    buscaEmAndamento = true;

    // Limpa o campo imediatamente para não perder a próxima bipagem
    if (inputCodigo) inputCodigo.value = "";

    try {
        if (statusLog) {
            statusLog.innerHTML = `:: CONSULTANDO CÓDIGO [${codigo}] NO BANCO... <span class="blink">■</span>`;
        }

        const resposta = await fetch(`/api/produtos/buscar?codigo=${encodeURIComponent(codigo)}`);
        const dados = await resposta.json();

        if (!resposta.ok || !dados.sucesso || !dados.produto) {
            emitirSomBip(false);
            if (statusLog) {
                const mensagemErro = (dados.mensagem || "CÓDIGO NÃO CADASTRADO NO BANCO").toUpperCase();
                statusLog.innerHTML = `:: [ERRO] ${mensagemErro} [${codigo}] <span class="blink">■</span>`;
            }
            return;
        }

        const produto = dados.produto;
        const codigoProduto = produto.codigo_barras || codigo;
        const precoUnitario = parseFloat(produto.preco) || 0;
        const custoUnitario = parseFloat(produto.custo) || 0;
        const estoqueDisponivel = parseInt(produto.estoque, 10) || 0;

        // LÓGICA DE RECONHECIMENTO: Se já existe no carrinho, soma a quantidade
        const itemExistente = carrinho.find(item => String(item.produtoId) === String(produto.id));

        if (itemExistente) {
            const novaQuantidade = itemExistente.quantidade + qtdAdicionar;

            if (novaQuantidade > estoqueDisponivel) {
                emitirSomBip(false);
                if (statusLog) {
                    statusLog.innerHTML = `:: [ERRO] ESTOQUE INSUFICIENTE PARA '${String(produto.nome).toUpperCase()}' // DISPONÍVEL: ${estoqueDisponivel} UN <span class="blink">■</span>`;
                }
                return;
            }

            itemExistente.quantidade = novaQuantidade;
            itemExistente.precoUnitario = precoUnitario;
            itemExistente.custoUnitario = custoUnitario;
            itemExistente.estoqueDisponivel = estoqueDisponivel;
            itemExistente.total = Number((novaQuantidade * precoUnitario).toFixed(2));
        } else {
            if (qtdAdicionar > estoqueDisponivel) {
                emitirSomBip(false);
                if (statusLog) {
                    statusLog.innerHTML = `:: [ERRO] ESTOQUE INSUFICIENTE PARA '${String(produto.nome).toUpperCase()}' // DISPONÍVEL: ${estoqueDisponivel} UN <span class="blink">■</span>`;
                }
                return;
            }

            carrinho.push({
                produtoId: produto.id,
                codigo: codigoProduto,
                nome: produto.nome,
                precoUnitario: precoUnitario,
                custoUnitario: custoUnitario,
                estoqueDisponivel: estoqueDisponivel,
                quantidade: qtdAdicionar,
                total: Number((qtdAdicionar * precoUnitario).toFixed(2))
            });
        }

        emitirSomBip(true);
        if (statusLog) {
            statusLog.innerHTML = `:: [✓] BIPADO: ${String(produto.nome).toUpperCase()} (Qtd: +${qtdAdicionar}) <span class="blink">■</span>`;
        }

        if (inputQtd) inputQtd.value = "1";
        renderizarCarrinho();

    } catch (erro) {
        console.error(":: [ERRO BUSCA PRODUTO]", erro);
        emitirSomBip(false);
        if (statusLog) {
            statusLog.innerHTML = `:: [ERRO] FALHA DE COMUNICAÇÃO COM O SERVIDOR <span class="blink">■</span>`;
        }
    } finally {
        buscaEmAndamento = false;
        focarInputCodigo();

        // Se outro código chegou enquanto esta consulta acontecia, agenda novamente
        const codigoRestante = inputCodigo ? inputCodigo.value.trim() : "";
        if (codigoRestante) {
            agendarBipagem();
        }
    }
}

// 4. ESCUTA DE DIGITAÇÃO AUTOMÁTICA DO LEITOR
if (inputCodigo) {
    // Detecta a tecla ENTER enviada pelo leitor de código de barras
    inputCodigo.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            clearTimeout(timerBipagem);
            timerBipagem = null;
            biparProduto();
        }
    });

    // Reconhece códigos de QUALQUER tamanho após uma pequena pausa, sem precisar do Enter
    inputCodigo.addEventListener('input', function() {
        const val = this.value.trim();

        if (!val) {
            clearTimeout(timerBipagem);
            timerBipagem = null;
            return;
        }

        agendarBipagem();
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
    const item = carrinho[index];

    if (!item) {
        return;
    }

    const novaQuantidade = item.quantidade + delta;

    // Não permite ultrapassar o estoque disponível retornado pelo banco
    if (delta > 0 && novaQuantidade > item.estoqueDisponivel) {
        emitirSomBip(false);
        if (statusLog) {
            statusLog.innerHTML = `:: [ERRO] ESTOQUE INSUFICIENTE PARA '${String(item.nome).toUpperCase()}' // DISPONÍVEL: ${item.estoqueDisponivel} UN <span class="blink">■</span>`;
        }
        focarInputCodigo();
        return;
    }

    if (novaQuantidade <= 0) {
        carrinho.splice(index, 1);
    } else {
        item.quantidade = novaQuantidade;
        item.total = Number((novaQuantidade * item.precoUnitario).toFixed(2));
    }

    renderizarCarrinho();
    focarInputCodigo();
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
async function fecharPedido() {
    if (salvandoVenda) {
        return;
    }

    if (buscaEmAndamento) {
        if (statusLog) statusLog.innerHTML = `:: AGUARDE A CONSULTA DO ÚLTIMO CÓDIGO SER CONCLUÍDA <span class="blink">■</span>`;
        return;
    }

    if (carrinho.length === 0) {
        if (statusLog) statusLog.innerHTML = `:: [ERRO] CAIXA VAZIO // BIPE ITENS ANTES DE FECHAR <span class="blink">■</span>`;
        emitirSomBip(false);
        focarInputCodigo();
        return;
    }

    const subtotal = carrinho.reduce((acc, i) => acc + i.total, 0);
    const pctDesc = inputDesconto ? parseFloat(inputDesconto.value) || 0 : 0;
    const valorTotal = Math.max(0, subtotal - (subtotal * (pctDesc / 100)));

    // Envia apenas códigos e quantidades: preços e totais são calculados no servidor
    const pedidoFinalizado = {
        forma_pagamento: metodoPagamento,
        desconto_porcentagem: pctDesc,
        itens: carrinho.map(item => ({
            codigo_barras: item.codigo,
            quantidade: item.quantidade
        }))
    };

    salvandoVenda = true;

    const btnFinalizar = document.getElementById('btn-finalizar-pedido');
    if (btnFinalizar) {
        btnFinalizar.disabled = true;
        btnFinalizar.innerText = '[ ... ] GRAVANDO BAIXA NO BANCO';
    }

    if (statusLog) {
        statusLog.innerHTML = `:: GRAVANDO BAIXA NO BANCO DE DADOS... <span class="blink">■</span>`;
    }

    try {
        const resposta = await fetch('/api/baixa', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(pedidoFinalizado)
        });

        const dados = await resposta.json();

        if (!resposta.ok || !dados.sucesso) {
            emitirSomBip(false);
            if (statusLog) {
                statusLog.innerHTML = `:: [ERRO] ${(dados.mensagem || 'FALHA AO REGISTRAR A BAIXA').toUpperCase()} <span class="blink">■</span>`;
            }
            return;
        }

        emitirSomBip(true);

        const venda = dados.venda || {};
        const totalPago = Number(venda.valor_total ?? valorTotal);
        const descontoAplicado = Number(venda.desconto_porcentagem ?? pctDesc);
        const totalItensVendidos = Number(venda.total_itens ?? carrinho.reduce((acc, i) => acc + i.quantidade, 0));

        console.log(":: Baixa registrada no banco de dados:", dados);

        // Exibe resumo no Modal de Sucesso com os valores confirmados pelo servidor
        const modalTexto = document.getElementById('modal-resumo-texto');
        if (modalTexto) {
            modalTexto.innerHTML = `
                <strong>FORMA DE PAGAMENTO:</strong> ${venda.forma_pagamento || metodoPagamento}<br>
                <strong>TOTAL DE ITENS:</strong> ${totalItensVendidos} un<br>
                <strong>DESCONTO APLICADO:</strong> ${descontoAplicado}%<br>
                <hr style="border: 0; border-top: 1px dashed #555; margin: 8px 0;">
                <span style="font-size: 1.2rem; color: #ffe066;"><strong>TOTAL PAGO:</strong> ${formatarMoeda(totalPago)}</span>
            `;
        }

        if (statusLog) {
            statusLog.innerHTML = `:: [✓] BAIXA REGISTRADA NO BANCO // TOTAL: ${formatarMoeda(totalPago)} <span class="blink">■</span>`;
        }

        const modal = document.getElementById('modal-sucesso');
        if (modal) modal.classList.remove('hidden');

    } catch (erro) {
        console.error(":: [ERRO BAIXA]", erro);
        emitirSomBip(false);
        if (statusLog) {
            statusLog.innerHTML = `:: [ERRO] FALHA DE COMUNICAÇÃO COM O SERVIDOR // BAIXA NÃO REGISTRADA <span class="blink">■</span>`;
        }
    } finally {
        salvandoVenda = false;

        if (btnFinalizar) {
            btnFinalizar.disabled = false;
            btnFinalizar.innerText = '[ F4 ] FECHAR PEDIDO';
        }
    }
}

function fecharModalSucesso() {
    const modal = document.getElementById('modal-sucesso');
    if (modal) modal.classList.add('hidden');
    limparVenda();
}

function limparVenda() {
    if (salvandoVenda) {
        return;
    }

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