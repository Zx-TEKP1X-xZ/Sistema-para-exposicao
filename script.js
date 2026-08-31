function updateClock() {
            const now = new Date();
            document.getElementById('clock').innerText = now.toLocaleTimeString('pt-BR');
        }
        setInterval(updateClock, 1000);
        updateClock();

        const cards = document.querySelectorAll('.menu-card');
        cards.forEach(card => {
            card.addEventListener('mouseenter', () => {
                document.getElementById('status-log').innerHTML = `:: ACESSANDO: ${card.querySelector('h2').innerText} <span class="blink">■</span>`;
            });
            card.addEventListener('mouseleave', () => {
                document.getElementById('status-log').innerHTML = `:: SISTEMA PRONTO // AGUARDANDO SELEÇÃO <span class="blink">■</span>`;
            });
        });

// Relógio do Cabeçalho
function updateClock() {
    const now = new Date();
    document.getElementById('clock').innerText = now.toLocaleTimeString('pt-BR');
}
setInterval(updateClock, 1000);
updateClock();

// Seleciona os elementos da interface
const form = document.getElementById('form-cadastro');
const statusLog = document.getElementById('status-log');
const inputCodigo = document.getElementById('codigo_barras');

// Manipulação do Formulário ao Clicar em "Salvar" ou dar "Enter"
form.addEventListener('submit', function(e) {
    e.preventDefault(); // Evita que a página recarregue

    // Captura os dados digitados
    const produto = {
        codigo_barras: document.getElementById('codigo_barras').value,
        nome: document.getElementById('nome').value,
        quantidade: document.getElementById('quantidade').value,
        preco: document.getElementById('preco').value
    };

    // Aqui, no futuro, faremos o "fetch" enviando esses dados para a API no Hono (Node.js)
    console.log("Produto pronto para envio API:", produto);

    // Dá feedback visual no rodapé estilo terminal
    statusLog.innerHTML = `:: [✓] PRODUTO '${produto.nome.toUpperCase()}' CADASTRADO COM SUCESSO! <span class="blink">■</span>`;
    
    // Limpa o formulário inteiro
    form.reset();

    // Joga o cursor de volta para o código de barras para o próximo item
    inputCodigo.focus();

    // Volta a mensagem padrão no rodapé depois de 4 segundos
    setTimeout(() => {
        statusLog.innerHTML = `:: AGUARDANDO ENTRADA DE DADOS <span class="blink">■</span>`;
    }, 4000);
});

// Adiciona atalho "ESC" no teclado para voltar para o Início
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        window.location.href = 'index.html';
    }
});

// Relógio do Cabeçalho
function updateClock() {
    const now = new Date();
    document.getElementById('clock').innerText = now.toLocaleTimeString('pt-BR');
}
setInterval(updateClock, 1000);
updateClock();

const formEdicao = document.getElementById('form-edicao');
const statusLog = document.getElementById('status-log');
const inputBusca = document.getElementById('busca_codigo');

// Simula a busca do produto no Banco de Dados
function buscarProduto() {
    const codigo = inputBusca.value.trim();

    if (codigo === "") {
        statusLog.innerHTML = `:: [ERRO] INSIRA UM CÓDIGO VÁLIDO <span class="blink">■</span>`;
        return;
    }

    // Aqui faremos um fetch(GET) para o backend (Hono/Postgres) no futuro
    statusLog.innerHTML = `:: BUSCANDO REGISTRO [${codigo}]... <span class="blink">■</span>`;

    setTimeout(() => {
        // Simulação de dados retornados do banco
        document.getElementById('nome_edit').value = "Caderno Universitário Fallout";
        document.getElementById('quantidade_edit').value = "42";
        document.getElementById('preco_edit').value = "35.50";

        // Destrava o formulário para edição
        formEdicao.style.opacity = "1";
        formEdicao.style.pointerEvents = "auto";
        document.getElementById('nome_edit').focus();

        statusLog.innerHTML = `:: REGISTRO LOCALIZADO. MODO EDIÇÃO ATIVO. <span class="blink">■</span>`;
    }, 600);
}

// Lida com o evento de "Enter" no campo de busca
inputBusca.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        e.preventDefault();
        buscarProduto();
    }
});

// Manipulação do salvamento da edição
formEdicao.addEventListener('submit', function(e) {
    e.preventDefault();

    const dadosAtualizados = {
        codigo_barras: inputBusca.value,
        nome: document.getElementById('nome_edit').value,
        quantidade: document.getElementById('quantidade_edit').value,
        preco: document.getElementById('preco_edit').value
    };

    console.log("Dados atualizados prontos para envio API:", dadosAtualizados);

    // Feedback visual
    statusLog.innerHTML = `:: [✓] REGISTRO ATUALIZADO COM SUCESSO! <span class="blink">■</span>`;
    
    // Bloqueia e limpa o formulário novamente
    formEdicao.reset();
    inputBusca.value = "";
    formEdicao.style.opacity = "0.5";
    formEdicao.style.pointerEvents = "none";
    inputBusca.focus();

    setTimeout(() => {
        statusLog.innerHTML = `:: MODO DE MANUTENÇÃO // AGUARDANDO BUSCA <span class="blink">■</span>`;
    }, 4000);
});

// Atalhos de teclado (ESC e F4)
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        window.location.href = 'index.html';
    }
    // Permite salvar com F4 se o form estiver destravado
    if (event.key === 'F4' && formEdicao.style.pointerEvents === "auto") {
        event.preventDefault();
        document.getElementById('btn-atualizar').click();
    }
});

// CODIGO BAIXA HTML

// Relógio do Cabeçalho
function updateClock() {
    const now = new Date();
    document.getElementById('clock').innerText = now.toLocaleTimeString('pt-BR');
}
setInterval(updateClock, 1000);
updateClock();

// Elementos da Tela
const inputCodigo = document.getElementById('codigo_barras_baixa');
const formBaixa = document.getElementById('form-baixa');
const statusLog = document.getElementById('status-log');

const inputNome = document.getElementById('nome_baixa');
const inputQtd = document.getElementById('quantidade_baixa');
const inputPorcentagem = document.getElementById('desconto_porcentagem');
const inputPrecoOriginal = document.getElementById('preco_original');
const inputPrecoFinal = document.getElementById('preco_final');

// Simulador de Banco de Dados de Produtos (no futuro virá do PostgreSQL / Hono)
const bancoProdutosSimulado = {
    "78910001": { nome: "Caderno Universitário Fallout", preco: 35.50, estoque: 42 },
    "78910002": { nome: "Caneta Esferográfica Dourada", preco: 4.00, estoque: 120 },
    "78910003": { nome: "Mochila Lona Resistente", preco: 185.00, estoque: 3 },
    "78910004": { nome: "Tinta Acrílica Terracotta", preco: 17.50, estoque: 15 }
};

let produtoAtual = null;

// Busca o produto pelo código de barras bipado/digitado
function buscarParaBaixa() {
    const codigo = inputCodigo.value.trim();

    if (!codigo) {
        statusLog.innerHTML = `:: [ERRO] INSIRA OU BIPE UM CÓDIGO VÁLIDO <span class="blink">■</span>`;
        return;
    }

    // Busca no banco
    if (bancoProdutosSimulado[codigo]) {
        produtoAtual = bancoProdutosSimulado[codigo];

        // Puxa as informações para os campos
        inputNome.value = produtoAtual.nome;
        inputPrecoOriginal.value = produtoAtual.preco.toFixed(2);
        inputPrecoFinal.value = produtoAtual.preco.toFixed(2);
        inputQtd.value = 1;
        inputPorcentagem.value = 0;

        // Destrava o formulário para finalização
        formBaixa.style.opacity = "1";
        formBaixa.style.pointerEvents = "auto";

        statusLog.innerHTML = `:: PRODUTO DETECTADO. AJUSTE OS VALORES OU CONFIRME A BAIXA <span class="blink">■</span>`;
        inputPrecoFinal.focus();
        inputPrecoFinal.select();
    } else {
        statusLog.innerHTML = `:: [ERRO] PRODUTO NÃO ENCONTRADO NO BANCO <span class="blink">■</span>`;
        formBaixa.style.opacity = "0.5";
        formBaixa.style.pointerEvents = "none";
    }
}

// Bipa automaticamente ao dar Enter na barra de busca
inputCodigo.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        e.preventDefault();
        buscarParaBaixa();
    }
});

// Lógica Matemática de Ajustes Dinâmicos (Preço <-> Porcentagem)
function calcularValores(origem) {
    if (!produtoAtual) return;

    const precoBaseUnitario = produtoAtual.preco;
    const qtd = parseInt(inputQtd.value) || 1;
    const precoBaseTotal = precoBaseUnitario * qtd;

    if (origem === 'porcentagem') {
        // Digitou na porcentagem -> Atualiza o Preço Final
        const pct = parseFloat(inputPorcentagem.value) || 0;
        const valorComDesconto = precoBaseTotal - (precoBaseTotal * (pct / 100));
        inputPrecoFinal.value = Math.max(0, valorComDesconto).toFixed(2);
    } 
    else if (origem === 'preco') {
        // Digitou no preço -> Calcula a Porcentagem de desconto aplicada
        const precoDigitado = parseFloat(inputPrecoFinal.value) || 0;
        if (precoBaseTotal > 0) {
            const diferenca = precoBaseTotal - precoDigitado;
            const pctCalculada = (diferenca / precoBaseTotal) * 100;
            inputPorcentagem.value = Math.max(0, pctCalculada).toFixed(1);
        }
    } 
    else if (origem === 'qtd') {
        // Alterou a Quantidade -> Recalcula com a % que já estava definida
        inputPrecoOriginal.value = precoBaseTotal.toFixed(2);
        const pct = parseFloat(inputPorcentagem.value) || 0;
        const valorComDesconto = precoBaseTotal - (precoBaseTotal * (pct / 100));
        inputPrecoFinal.value = Math.max(0, valorComDesconto).toFixed(2);
    }
}

// Botões das Abas de Desconto Rápido (0%, 5%, 10%, 15%, 20%)
function aplicarDescontoRapido(porcentagem) {
    if (!produtoAtual) return;
    inputPorcentagem.value = porcentagem;
    calcularValores('porcentagem');
}

// Confirmação da Baixa / Saída de Estoque
formBaixa.addEventListener('submit', function(e) {
    e.preventDefault();

    const resumoVenda = {
        codigo: inputCodigo.value,
        produto: inputNome.value,
        quantidade: inputQtd.value,
        preco_original: inputPrecoOriginal.value,
        desconto_aplicado: inputPorcentagem.value + '%',
        total_pago: inputPrecoFinal.value
    };

    console.log("Baixa enviada para o Backend:", resumoVenda);

    // Feedback visual
    statusLog.innerHTML = `:: [✓] BAIXA CONCLUÍDA! TOTAL: R$ ${resumoVenda.total_pago} <span class="blink">■</span>`;

    // Limpa a tela para a próxima venda e volta o foco no leitor
    formBaixa.reset();
    inputCodigo.value = "";
    formBaixa.style.opacity = "0.5";
    formBaixa.style.pointerEvents = "none";
    inputCodigo.focus();

    setTimeout(() => {
        statusLog.innerHTML = `:: AGUARDANDO BIPE NO LEITOR <span class="blink">■</span>`;
    }, 4000);
});

// Atalho ESC para voltar
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        window.location.href = 'index.html';
    }
});

// Catalogo 

// Relógio do Cabeçalho
function updateClock() {
    const now = new Date();
    document.getElementById('clock').innerText = now.toLocaleTimeString('pt-BR');
}
setInterval(updateClock, 1000);
updateClock();

// Banco de Dados Simulado (Substituído no futuro por fetch no PostgreSQL/Hono)
let listaProdutos = [
    { id: 1, codigo: "78910001", nome: "Caderno Universitário Fallout", categoria: "Papelaria", estoque: 42, custo: 18.00, preco: 35.50 },
    { id: 2, codigo: "78910002", nome: "Caneta Esferográfica Dourada", categoria: "Escritório", estoque: 120, custo: 1.20, preco: 4.00 },
    { id: 3, codigo: "78910003", nome: "Mochila Lona Resistente", categoria: "Acessórios", estoque: 3, custo: 90.00, preco: 185.00 },
    { id: 4, codigo: "78910004", nome: "Tinta Acrílica Terracotta", categoria: "Artes", estoque: 15, custo: 8.50, preco: 17.50 },
    { id: 5, codigo: "78910005", nome: "Estojo Metálico Vintage", categoria: "Escritório", estoque: 8, custo: 20.00, preco: 45.00 },
    { id: 6, codigo: "78910006", nome: "Bloco de Notas Atompunk A5", categoria: "Papelaria", estoque: 25, custo: 6.00, preco: 14.00 },
    { id: 7, codigo: "78910007", nome: "Pincel Nº 6 Cabo Vermelho", categoria: "Artes", estoque: 2, custo: 7.00, preco: 15.50 }
];

function renderizarTabela(dados) {
    const tbody = document.getElementById('tabela-catalogo-body');
    const qtdRegistros = document.getElementById('qtd-registros');
    
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
    const termo = document.getElementById('filtro_catalogo').value.toLowerCase();
    const filtrados = listaProdutos.filter(item => 
        item.nome.toLowerCase().includes(termo) || 
        item.codigo.toLowerCase().includes(termo) ||
        item.categoria.toLowerCase().includes(termo)
    );
    renderizarTabela(filtrados);
}

// Atalho ESC para voltar
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        window.location.href = 'index.html';
    }
});

// Inicialização
renderizarTabela(listaProdutos);