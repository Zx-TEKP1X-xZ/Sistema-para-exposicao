// Relógio do Cabeçalho
function updateClock() {
    const clockEl = document.getElementById('clock');
    if (clockEl) {
        clockEl.innerText = new Date().toLocaleTimeString('pt-BR');
    }
}
setInterval(updateClock, 1000);
updateClock();

let listaProdutos = [
    { id: 1, codigo: "78910001", nome: "Caderno Universitário Fallout", categoria: "Papelaria", estoque: 42, custo: 18.00, preco: 35.50 },
    { id: 2, codigo: "78910002", nome: "Caneta Esferográfica Dourada", categoria: "Escritório", estoque: 120, custo: 1.20, preco: 4.00 },
    { id: 3, codigo: "78910003", nome: "Mochila Lona Resistente", categoria: "Acessórios", estoque: 3, custo: 90.00, preco: 185.00 },
    { id: 4, codigo: "78910004", nome: "Tinta Acrílica Terracotta", categoria: "Artes", estoque: 15, custo: 8.50, preco: 17.50 },
    { id: 5, codigo: "78910005", nome: "Estojo Metálico Vintage", categoria: "Escritório", estoque: 8, custo: 20.00, preco: 45.00 },
    { id: 6, codigo: "78910006", nome: "Bloco de Notas Atompunk A5", categoria: "Papelaria", estoque: 25, custo: 6.00, preco: 14.00 },
    { id: 7, codigo: "78910007", nome: "Pincel Nº 6 Cabo Vermelho", categoria: "Artes", estoque: 2, custo: 7.00, preco: 15.50 }
];

let listaProdutos = [];

async function carregarProdutosBack (){
    try{
        const resposta = await fetch('api/catalogo');
        const dados = await resposta.json();
    }
    
    catch{

    }
};

function renderizarTabela(dados) {
    const tbody = document.getElementById('tabela-catalogo-body');
    const qtdRegistros = document.getElementById('qtd-registros');
    
    if (!tbody || !qtdRegistros) return;

    tbody.innerHTML = '';
    qtdRegistros.innerText = dados.length;

    if (dados.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 20px; color: #8c6239;">NENHUM REGISTRO ENCONTRADO</td></tr>`;
        return;
    }

    dados.forEach(item => {
        const tr = document.createElement('tr');
        const classeEstoque = item.estoque < 5 ? 'tag-alerta-estoque' : '';

        tr.innerHTML = `
            <td style="color: var(--atom-bronze);">#${String(item.id).padStart(3, '0')}</td>
            <td style="color: var(--atom-gold);">${item.codigo}</td>
            <td style="font-weight: bold;">${item.nome}</td>
            <td>${item.categoria}</td>
            <td style="text-align: center;" class="${classeEstoque}">${item.estoque} un</td>
            <td style="text-align: right; color: #a89f91;">R$ ${item.custo.toFixed(2).replace('.', ',')}</td>
            <td style="text-align: right; color: var(--atom-gold); font-weight: bold;">R$ ${item.preco.toFixed(2).replace('.', ',')}</td>
        `;
        tbody.appendChild(tr);
    });
}

function filtrarTabela() {
    const filtroEl = document.getElementById('filtro_catalogo');
    if (!filtroEl) return;
    
    const termo = filtroEl.value.toLowerCase();
    const filtrados = listaProdutos.filter(item => 
        item.nome.toLowerCase().includes(termo) || 
        item.codigo.toLowerCase().includes(termo) ||
        item.categoria.toLowerCase().includes(termo)
    );
    renderizarTabela(filtrados);
}

// Atalho ESC
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        window.location.href = 'index.html';
    }
});

renderizarTabela(listaProdutos);