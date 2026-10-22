// Relógio do Cabeçalho
function updateClock() {
    const clockEl = document.getElementById('clock');
    if (clockEl) {
        clockEl.innerText = new Date().toLocaleTimeString('pt-BR');
    }
}
setInterval(updateClock, 1000);
updateClock();

// Armazena a lista de produtos em memória
let listaProdutosMemoria = [];

// Formata valores numéricos para moeda Real (R$)
function formatarMoeda(valor) {
    const num = parseFloat(valor);
    if (isNaN(num)) return 'R$ 0,00';
    return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// 1. Função principal de busca na API Hono (GET)
async function carregarProdutosDoBackend() {
    const tbody = document.getElementById('tabela-catalogo-body') || document.getElementById('tabela-produtos-body') || document.querySelector('.atom-table-db tbody');

    try {
        const resposta = await fetch('/api/catalogo');

        // Se o status HTTP não for OK (200-299)
        if (!resposta.ok) {
            throw new Error(`Servidor respondeu com status ${resposta.status}`);
        }

        const dados = await resposta.json();

        // Aceita diferentes convenções de resposta (produtos array, dados direto ou dados.produtos com qualquer flag de sucesso)
        let produtos = null;
        if (Array.isArray(dados)) {
            produtos = dados;
        } else if (dados && Array.isArray(dados.produtos)) {
            produtos = dados.produtos;
        }

        if (produtos !== null) {
            listaProdutosMemoria = produtos;
            renderizarTabela(listaProdutosMemoria);
        } else {
            console.error(":: [ERRO API]", dados?.mensagem || "Formato de dados inesperado");
            if (tbody) {
                tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: #ff5555; padding: 20px;">:: ERRO: ${dados?.mensagem || 'NENHUM DADO RECEBIDO'} ::</td></tr>`;
            }
        }
    } catch (erro) {
        console.error(":: [ERRO DE CONEXÃO]", erro);
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: #ff5555; padding: 20px;">:: ERRO AO CONECTAR COM O SERVIDOR ::</td></tr>`;
        }
    }
}

// 2. Função para desenhar as linhas no <tbody>
function renderizarTabela(produtos) {
    const tbody = document.getElementById('tabela-catalogo-body') || document.getElementById('tabela-produtos-body') || document.querySelector('.atom-table-db tbody');
    const qtdRegistros = document.getElementById('qtd-registros');

    if (qtdRegistros) {
        qtdRegistros.innerText = produtos ? produtos.length : 0;
    }

    if (!tbody) return;

    if (!produtos || produtos.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: #8c6239; padding: 20px;">:: NENHUM PRODUTO ENCONTRADO ::</td></tr>`;
        return;
    }

    tbody.innerHTML = produtos.map((prod) => {
        const precoVenda = formatarMoeda(prod.preco);
        const custo = formatarMoeda(prod.custo);
        const qtdEstoque = Number(prod.estoque) || 0;
        const estoqueAlerta = qtdEstoque <= 5 ? 'class="tag-alerta-estoque"' : '';

        return `
            <tr>
                <td style="color: var(--atom-bronze);">#${String(prod.id ?? '').padStart(2, '0')}</td>
                <td style="color: var(--atom-gold);">${prod.codigo_barras || prod.codigo || '---'}</td>
                <td><strong>${prod.nome || 'Sem Nome'}</strong></td>
                <td>${prod.categoria || 'Geral'}</td>
                <td style="text-align: center;" ${estoqueAlerta}>${qtdEstoque} un</td>
                <td style="text-align: right; color: #a89f91;">${custo}</td>
                <td style="text-align: right; color: var(--atom-gold); font-weight: bold;">${precoVenda}</td>
            </tr>
        `;
    }).join('');
}

// 3. Função de busca em tempo real
function filtrarTabela() {
    const inputFiltro = document.getElementById('filtro_catalogo');
    if (!inputFiltro) return;

    const termo = inputFiltro.value.toLowerCase().trim();

    const produtosFiltrados = listaProdutosMemoria.filter((prod) => {
        const nome = (prod.nome || '').toLowerCase();
        const codigo = (prod.codigo_barras || prod.codigo || '').toLowerCase();
        const categoria = (prod.categoria || '').toLowerCase();

        return nome.includes(termo) || codigo.includes(termo) || categoria.includes(termo);
    });

    renderizarTabela(produtosFiltrados);
}

// Atalho ESC para voltar ao menu
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        window.location.href = 'index.html';
    }
});

// Inicializa a busca quando o documento estiver pronto
document.addEventListener('DOMContentLoaded', carregarProdutosDoBackend);
