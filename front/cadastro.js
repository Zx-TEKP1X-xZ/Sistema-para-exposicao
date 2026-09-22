// Relógio do Cabeçalho
function updateClock() {
    const clockEl = document.getElementById('clock');
    if (clockEl) {
        clockEl.innerText = new Date().toLocaleTimeString('pt-BR');
    }
}
setInterval(updateClock, 1000);
updateClock();

const formCadastro = document.getElementById("form-cadastro");
const statusLog = document.getElementById("status-log");

if (formCadastro) {
    formCadastro.addEventListener('submit', async function (e) {
        e.preventDefault()

        const novoProduto = {
            codigo_barras: document.getElementById('codigo_barras').value.trim(),
            nome: document.getElementById('nome').value.trim(),
            categoria: document.getElementById('categoria').value.trim(),
            estoque: parseInt(document.getElementById('estoque').value) || 0,
            custo: parseFloat(document.getElementById('custo').value) || 0,
            preco: parseFloat(document.getElementById('preco').value) || 0
        }
        
        try {
            if (statusLog) {
                statusLog.innerHTML = `:: ENVIANDO DADOS PARA O BANCO... <span class="blink">■</span>`;
            }

            const resposta = await fetch('api/cadastro', {
                method: 'POST',
                header: {
                    'Content-Type': 'aplicatin/json'
                },
                body: JSON.stringify(novoProduto)
            });

            const resultado = await resposta.json();

            if (resposta.ok && resultado.sucesso){
                if (statusLog){
                    statusLog.innerHTML = `:: [✓] PRODUTO '${novoProduto.nome.toUpperCase()}' CADASTRADO COM SUCESSO <span class="blink">■</span>`;
                }
                formCadastro.reset();
                document.getElementById('codigo_barras').focus();
            } 
            else {
                const erroMsg = resultado.mensagem || "Erro ao gravar produto";
                if (statusLog) {
                    statusLog.innerHTML = `:: [ERRO] ${erroMsg.toUpperCase()} <span class="blink">■</span>`;
                }
                alert ('Erro: ${erroMsg}');
            }
        }

        catch (erro) {
            console.log("Erro de conexão ao cadastrar: ", erro);
            if (statusLog) {
                statusLog.innerHTML = `:: [ERRO] FALHA DE COMUNICAÇÃO COM O SERVIDOR <span class="blink">■</span>`
            }
            alert("Não foi possivel se conectar ao servidor");
        }
    });
}

// Atalho ESC
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        window.location.href = 'index.html';
    }
});