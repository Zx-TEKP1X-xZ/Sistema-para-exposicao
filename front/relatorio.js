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
const listaProdutosRelatorio = [
    { id: 1, codigo: "78910001", nome: "Caderno Universitário Fallout", categoria: "Papelaria", estoque: 42, custo: 18.00, preco: 35.50 },
    { id: 2, codigo: "78910002", nome: "Caneta Esferográfica Dourada", categoria: "Escritório", estoque: 120, custo: 1.20, preco: 4.00 },
    { id: 3, codigo: "78910003", nome: "Mochila Lona Resistente", categoria: "Acessórios", estoque: 3, custo: 90.00, preco: 185.00 },
    { id: 4, codigo: "78910004", nome: "Tinta Acrílica Terracotta", categoria: "Artes", estoque: 15, custo: 8.50, preco: 17.50 },
    { id: 5, codigo: "78910005", nome: "Estojo Metálico Vintage", categoria: "Escritório", estoque: 8, custo: 20.00, preco: 45.00 },
    { id: 6, codigo: "78910006", nome: "Bloco de Notas Atompunk A5", categoria: "Papelaria", estoque: 25, custo: 6.00, preco: 14.00 },
    { id: 7, codigo: "78910007", nome: "Pincel Nº 6 Cabo Vermelho", categoria: "Artes", estoque: 2, custo: 7.00, preco: 15.50 }
];

function formatarMoeda(valor) {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function carregarRelatorio() {
    const tbody = document.getElementById('tabela-relatorio-body');
    const elData = document.getElementById('relatorio-data');
    const elTotalProdutos = document.getElementById('total-produtos');
    const elTotalEstoque = document.getElementById('total-estoque');
    const elValorTotalEstoque = document.getElementById('valor-total-estoque');

    if (!tbody) return;

    // Data de Emissão
    if (elData) {
        elData.innerText = `Emissão: ${new Date().toLocaleString('pt-BR')}`;
    }

    tbody.innerHTML = '';
    let acumuladorEstoque = 0;
    let acumuladorValorTotal = 0;

    listaProdutosRelatorio.forEach(item => {
        acumuladorEstoque += item.estoque;
        acumuladorValorTotal += (item.estoque * item.preco);

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${item.codigo}</td>
            <td><strong>${item.nome}</strong></td>
            <td>${item.categoria}</td>
            <td style="text-align: center;">${item.estoque} un</td>
            <td style="text-align: right;">${formatarMoeda(item.custo)}</td>
            <td style="text-align: right;"><strong>${formatarMoeda(item.preco)}</strong></td>
        `;
        tbody.appendChild(tr);
    });

    // Atualiza os Cards Superiores
    if (elTotalProdutos) elTotalProdutos.innerText = `${listaProdutosRelatorio.length} cadastrados`;
    if (elTotalEstoque) elTotalEstoque.innerText = `${acumuladorEstoque} itens`;
    if (elValorTotalEstoque) elValorTotalEstoque.innerText = formatarMoeda(acumuladorValorTotal);
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