// Relógio do Cabeçalho
function updateClock() {
    const clockEl = document.getElementById('clock');
    if (clockEl) {
        clockEl.innerText = new Date().toLocaleTimeString('pt-BR');
    }
}
setInterval(updateClock, 1000);
updateClock();

// Variável para guardar o ID do produto retornado pelo banco
let produtoIdEncontrado = null;

// Capturando os elementos da tela pelo ID do HTML
const buscaInput = document.getElementById('busca_codigo');
const formEdicao = document.getElementById('form-edicao');
const statusLog = document.getElementById('status-log');
const botaoAtualizar = document.getElementById('btn-atualizar');

async function buscarProduto() {
    const codigo = buscaInput.value.trim();

    if (!codigo){
        mostrarAlerta("Digite um codigo pra buscar o produto");
        return;
    }
    

    try{
        if (statusLog){
            statusLog.innerHTML = `:: BUSCANDO PRODUTO... <span class="blink">■</span>`;
        }
        
        const resposta = await fetch (`/api/produtos/buscar?codigo=${encodeURIComponent(codigo)}`);
        const dados = await resposta.json();

        if (resposta.ok && dados.sucesso){
            const prod = dados.produto;
            produtoIdEncontrado = dados.produto.id;

            document.getElementById('nome_edit').value = prod.nome;
            document.getElementById('quantidade_edit').value = prod.estoque;
            document.getElementById('preco_edit').value = prod.preco;
            document.getElementById('categoria_edit').value = prod.categoria || '';
            document.getElementById('custo_edit').value = parseFloat(prod.custo || 0).toFixed(2);

            formEdicao.style.opacity ='1';
            formEdicao.style.pointerEvents = 'auto';

            if (statusLog){
                statusLog.innerHTML = `:: PRODUTO '${prod.nome.toUpperCase()}' LOCALIZADO <span class="blink">■</span>`;
            }
        }
        

        else {
                mostrarAlerta("Produto não encontrado");
                statusLog.innerHTML = `:: [ERRO] PRODUTO NÃO ENCONTRADO <span class="blink">■</span>`;
            }
    }

    catch(erro){
        console.error ("Erro na busca: ", erro);
        mostrarAlerta("Erro de conexão com o servidor");
    }
}

async function excluirProduto() {
    if(!produtoIdEncontrado) {
        mostrarAlerta("Nenhum produto válido foi selecionado para exclusão! Faça a busca primeiro.");
        console.error(":: [ERRO FRONT] produtoIdEncontrado está:", produtoIdEncontrado);
        return;
    }

    const confirmou = await mostrarConfirmacao("Tem certeza que deseja excluir este produto do banco de dados?");
    if (!confirmou) return;

    try{
        if (statusLog){
            statusLog.innerHTML = `:: EXCLUINDO PRODUTO... <span class="blink">■</span>`;
        }

        const resposta = await fetch (`/api/produtos/${produtoIdEncontrado}`, {
            method: 'DELETE'
        });

        const resultado = await resposta.json();

        if (resposta.ok && resultado.sucesso){
            mostrarAlerta("Produto excluido com sucesso");

            produtoIdEncontrado = null;
            formEdicao.reset();
            formEdicao.style.opacity = "0.5";
            formEdicao.style.pointerEvents = "none";

            buscaInput.value = '';
            buscaInput.focus();

            if (statusLog){
                statusLog.innerHTML = `:: [✓] PRODUTO REMOVIDO COM SUCESSO <span class="blink">■</span>`;
            }
        }

        else {
            mostrarAlerta("Erro ao excluir: " + (resultado.mensagem || "Erro desconhecido"));
        }
    }
    catch(erro){
        console.error("Erro na exclusão: ",erro);
        mostrarAlerta("Erro de conexão com o servidor.");
    }
}

async function editarProduto(event){
        event.preventDefault();
            const editaProdut = {
                nomeEdit: document.getElementById('nome_edit').value.trim(),
                quantidadeEdit: parseInt(document.getElementById('quantidade_edit').value) || 0,
                custoEdit: parseFloat(document.getElementById('custo_edit').value) || 0,
                precoEdit: parseFloat( document.getElementById('preco_edit').value) || 0,
                categoriaEdit: document.getElementById('categoria_edit').value.trim()
            }

            try{
                if (statusLog) {
                    statusLog.innerHTML = `:: ATUALIZANDO DADOS NO BANCO... <span class="blink">■</span>`;
                }

                const resposta = await fetch(`/api/produtos/${produtoIdEncontrado}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(editaProdut)
                 });
                
                const resultado = await resposta.json();

                if (resposta.ok && resultado.sucesso){
                    mostrarAlerta("Produto atualizado com sucesso no banco de dados!");
                    if (statusLog){
                        statusLog.innerHTML = `:: :: [✓] PRODUTO '${editaProdut.nomeEdit.toUpperCase()}' CADASTRADO COM SUCESSO... <span class="blink">■</span>`;
                    }
                    formEdicao.reset();
                    formEdicao.style.opacity = "0.5";
                    formEdicao.style.pointerEvents = "none";
                    buscaInput.value = '';
                    buscaInput.focus();
                    document.getElementById('codigo_barras')?.focus();
                }

                else{
                    const erroMsg = resultado.mensagem || "Erro ao atualizar produto";
                    mostrarAlerta("Erro ao atualizar: " + erroMsg);
                    if (statusLog) {
                        statusLog.innerHTML = `:: [ERRO] ${erroMsg.toUpperCase()} <span class="blink">■</span>`;
                    }
                }

            }

            catch (erro){
                console.log("Erro de conexão ao cadastrar: ", erro);
                if (statusLog) {
                    statusLog.innerHTML = `:: [ERRO] FALHA DE COMUNICAÇÃO COM O SERVIDOR <span class="blink">■</span>`
                }
                mostrarAlerta("Erro de comunicação com o servidor.");
            }    
}

if (formEdicao) {
    formEdicao.addEventListener('submit', editarProduto);
}

function mostrarAlerta(mensagem) {
    const modal = document.getElementById('modal-alerta');
    const msgElemento = document.getElementById('alerta-mensagem');

    if (modal && msgElemento) {
        msgElemento.innerText = mensagem;
        modal.style.display = 'flex';
        
        // Foca automaticamente no botão OK para fechar no Enter
        const btnOk = modal.querySelector('.btn-modal-ok');
        if (btnOk) btnOk.focus();
    } else {
        // Fallback para o alert nativo caso o modal não esteja no HTML
        alert(mensagem);
    }
}

function fecharAlerta() {
    const modal = document.getElementById('modal-alerta');
    if (modal) {
        modal.style.display = 'none';
    }
}

function mostrarConfirmacao(mensagem) {
    return new Promise((resolve) => {
        const modal = document.getElementById('modal-confirmacao');
        const msgElemento = document.getElementById('confirm-mensagem');
        const btnSim = document.getElementById('btn-modal-sim');

        if (!modal || !msgElemento || !btnSim) {
            // Fallback caso o HTML do modal não esteja presente
            resolve(confirm(mensagem));
            return;
        }

        msgElemento.innerText = mensagem;
        modal.style.display = 'flex';
        btnSim.focus();

        // Listener para o botão de confirmação
        function aoConfirmar() {
            limparEventos();
            modal.style.display = 'none';
            resolve(true);
        }

        // Listener para o botão de cancelar/fechar
        function aoCancelar() {
            limparEventos();
            modal.style.display = 'none';
            resolve(false);
        }

        // Função de atalho pelo teclado (ENTER / ESC)
        function aoPressionarTecla(event) {
            if (event.key === 'Enter') {
                event.preventDefault();
                aoConfirmar();
            } else if (event.key === 'Escape') {
                event.preventDefault();
                aoCancelar();
            }
        }

        function limparEventos() {
            btnSim.removeEventListener('click', aoConfirmar);
            document.removeEventListener('keydown', aoPressionarTecla);
            window.fecharModalConfirmacao = () => {};
        }

        // Atribui os manipuladores de evento
        btnSim.addEventListener('click', aoConfirmar);
        document.addEventListener('keydown', aoPressionarTecla);
        
        // Exponibiliza a função de fechar para o clique no botão X ou Cancelar
        window.fecharModalConfirmacao = function(opcao) {
            if (opcao) aoConfirmar();
            else aoCancelar();
        };
    });
}

document.addEventListener('keydown', function(event) {
    const modal = document.getElementById('modal-alerta');
    if (modal && modal.style.display === 'flex') {
        if (event.key === 'Enter' || event.key === 'Escape') {
            event.preventDefault();
            fecharAlerta();
        }
    }
});

// Atalhos ESC e F4
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        window.location.href = 'index.html';
    }
    if (event.key === 'F4' && formEdicao && formEdicao.style.pointerEvents === "auto") {
        event.preventDefault();
        editarProduto();
    }
});

if (buscaInput) {
    buscaInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            buscarProduto();
        }
    });
}

const btnExcluir = document.getElementById('btn-excluir');
if (btnExcluir) {
    btnExcluir.addEventListener('click', excluirProduto);
}