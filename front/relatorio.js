// Relógio do Cabeçalho
function updateClock() {
    const clockEl = document.getElementById('clock');
    if (clockEl) {
        clockEl.innerText = new Date().toLocaleTimeString('pt-BR');
    }
}
setInterval(updateClock, 1000);
updateClock();

// Base de Dados Simulado (Conectará ao PostgreSQL/Hono futuramente)

function formatarMoeda(valor) {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

document.addEventListener('DOMContentLoaded', () => {
    carregarRelatorio();
});

async function carregarRelatorio() {
    const tbody = document.getElementById('tabela-relatorio-body');
    const elData = document.getElementById('relatorio-data');
    const elTotalItens = document.getElementById('total-itens-vendidos');
    const elTotalFaturado = document.getElementById('total-faturado');
    const elTotalLucro = document.getElementById('total-lucro');

    if (!tbody) return;

    // Declaração dos acumuladores no início da função
    let totalItensVendidos = 0;
    let acumuladorFaturamento = 0;
    let acumuladorLucro = 0;

    // Atualiza data/hora da emissão
    if (elData) {
        elData.innerText = `EMISSÃO: ${new Date().toLocaleString('pt-BR')}`;
    }

    tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 20px;">Carregando dados...</td></tr>';

    try {
        const resposta = await fetch('/api/relatorio');
        const dados = await resposta.json();

        const lista = dados.resultado || [];

        if (lista.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 20px;">Nenhuma movimentação registrada no caixa.</td></tr>`;
            atualizarCards(0, 0, 0);
            return;
        }

        tbody.innerHTML = '';

        lista.forEach(item => {
            const qtd = Number(item.quantidade) || 0;
            const custoTotal = Number(item.custo_total) || (qtd * (Number(item.custo_unitario) || 0));
            const faturamento = Number(item.faturamento) || Number(item.preco_final) || 0;
            const lucro = Number(item.lucro) || (faturamento - custoTotal);

            // Se for saída (venda), soma aos totais do caixa
            if (item.tipo === 'SAIDA' || !item.tipo) {
                totalItensVendidos += qtd;
                acumuladorFaturamento += faturamento;
                acumuladorLucro += lucro;
            }

            const tr = document.createElement('tr');
            const classeLucro = lucro >= 0 ? 'texto-lucro-positivo' : 'texto-lucro-negativo';

            tr.innerHTML = `
                <td>${item.codigo_barras || 'N/A'}</td>
                <td><strong>${item.nome_produto || 'Item Divergente'}</strong></td>
                <td style="text-align: center;">${qtd} un</td>
                <td style="text-align: center;">${item.forma_pagamento || 'DINHEIRO'}</td>
                <td style="text-align: right;">${formatarMoeda(custoTotal)}</td>
                <td style="text-align: right; font-weight: bold;">${formatarMoeda(faturamento)}</td>
                <td style="text-align: right;" class="${classeLucro}">${formatarMoeda(lucro)}</td>
            `;

            tbody.appendChild(tr);
        });

        // Atualiza os cards com os totais calculados
        atualizarCards(totalItensVendidos, acumuladorFaturamento, acumuladorLucro);

    } catch (erro) {
        console.error("Erro ao carregar relatório de vendas: ", erro);
        tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: #cc2929; padding: 20px;">:: [ERRO] FALHA AO CARREGAR RELATÓRIO DO SERVIDOR</td></tr>`;
    }

    function atualizarCards(itens, faturado, lucro) {
        if (elTotalItens) elTotalItens.innerText = `${itens} un`;
        if (elTotalFaturado) elTotalFaturado.innerText = formatarMoeda(faturado);
        if (elTotalLucro) elTotalLucro.innerText = formatarMoeda(lucro);
    }
}

function imprimirRelatorio() {
        window.print();
    }

// Atalhos de teclado (ESC para voltar e F8 para imprimir/PDF)
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        window.location.href = 'index.html';
    }
    if (event.key === 'F8') {
        event.preventDefault();
        imprimirRelatorio();
    }
});

// Inicializa o relatório na abertura da página
carregarRelatorio();