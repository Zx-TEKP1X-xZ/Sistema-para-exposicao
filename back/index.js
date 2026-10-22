import { Hono } from 'hono';
import { pool } from './db.js';
import { serveStatic } from '@hono/node-server/serve-static';
import { serve } from '@hono/node-server';
import { cors } from 'hono/cors';

const app = new Hono();

app.use(
    '*',
    cors({
        origin: (origin) => origin || '*',
        credentials: true,
        allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
    })
);

app.get('/', (c) => c.redirect('/index.html'));
app.use('/*', serveStatic({ root: './front' }));

app.get('/api/catalogo', async (c) =>{
    try{
        const resultadoCatalogo = await pool.query('SELECT * FROM produtos ORDER BY id ASC');

        return c.json({
            sucess: true,
            produtos: resultadoCatalogo.rows
        });
    }

    catch (err) {
        console.error("Erro ao buscar produtos: ", err);
        return c.json({
            sucess: false,
            mensagem: "Erro ao busca produtos no banco de dados"
        }, 500);
    }
});

app.post('/api/cadastro', async (c) => {
    try{
        const body = await c.req.json();
        const {codigo_barras, nome, categoria, estoque, custo, preco} = body;

        if (!codigo_barras || !nome || preco === undefined){
            return c.json({
                sucesso: false,
                mensagem: "Campos obrigatórios ausentes (código de barras, nome ou preço)!"
            }, 400);
        }

        const insertProduto = await pool.query(`
            INSERT INTO produtos (codigo_barras, nome, categoria, estoque, custo, preco)
            VALUES ($1, $2, $3, $4, $5, $6) 
            RETURNING *;`, 
            [codigo_barras.trim(), nome.trim(), categoria ? categoria.trim() : 'Geral', parseInt(estoque) || 0, parseFloat(custo) || 0.00, parseFloat(preco) || 0.00])

        return c.json({
            sucesso: true,
            mensagem: "Produto cadastrado com sucesso",
            produto: insertProduto.rows[0]
        }, 201);
        
    }
    catch (erro){
        console.error(":: [ERRO BANCO DE DADOS]", erro);

        if (erro.code === '23505') {
            return c.json({
                sucesso: false,
                mensagem: "Já existe um produto cadastrado com este codigo de barras"
            }, 400);
        }

        return c.json({
            sucesso: false,
            mensagem: "Erro interno ao cadastrar produto"
        }, 500);
    }
});

app.get('/api/produtos/buscar', async (c) =>{
    try{
        const codigo = c.req.query('codigo'); // Lê ?codigo=... da URL

        if (!codigo){
            return c.json ({
                sucesso: false,
                mensagem: "Codigo de barras não informado"
            }, 400);
        }

        const result = await pool.query(`
            SELECT * FROM produtos WHERE codigo_barras = $1 LIMIT 1
            `, [codigo.trim()]);

        if (result.rows.length === 0){
            return c.json ({
                sucesso: false, mensagem: "Produto não encontrado"}, 404);
        }

        return c.json({
            sucesso: true,
            produto: result.rows[0]
       }); 
    }

    catch (erro){
        console.error(":: [ERRO BUSCA]", erro);
        return c.json({sucesso: false, mensagem: "Erro ao buscar produto no banco"}, 500);
    }
});

app.delete('/api/produtos/:id', async (c) =>{
    try{
        const idParam = c.req.param('id');
        const idNum = parseInt(idParam, 10);
        console.log(":: ID RECEBIDO NA ROTA DELETE:", idParam);

        if (isNaN(idNum)){
            return c.json({sucesso: false, mensagem: "Id invalido fornecido"},400);
        }

        const apagar = await pool.query(`DELETE FROM produtos WHERE id = $1 RETURNING *;`, [idNum]);

        if (apagar.rowCount === 0 ){
            return c.json({sucesso: false, mensagem: "Produto não encontrado"}, 404);
        }

        return c.json({
            sucesso: true,
            mensagem: "Produto excluido com sucesso"
        });
    }

    catch(erro){
        console.error(":: [ERRO DELETE]", erro);
        
        if (erro.code === '23503'){
            return c.json({
                sucesso: false,
                mensagem: "Não é possivel excluir pois possui registros vinculados"
            }, 400);
        }
        return c.json({
            sucesso: false,
            mensagem: "Erro interno no servidor ao excluir produtos"
        }, 500);
    }
});


app.put('/api/produtos/:id', async (c) => {
    const body = await c.req.json();
    const {nomeEdit, quantidadeEdit, custoEdit, precoEdit, categoriaEdit} = body;
    const idParam = c.req.param('id');
    const idNum = parseInt(idParam, 10);
    console.log(":: ID RECEBIDO NA ROTA DELETE:", idParam);

     if (isNaN(idNum)){
            return c.json({sucesso: false, mensagem: "Id invalido fornecido"},400);
    }

    try{
        
        if (!nomeEdit || quantidadeEdit === undefined || custoEdit === undefined || precoEdit === undefined || !categoriaEdit){
                return c.json({
                    sucesso: false,
                    mensagem: "Campos obrigatórios ausentes (código de barras, nome ou preço)!"
                }, 400);
        }

        const resultEdit = await pool.query(`UPDATE produtos 
            SET 
                nome = $1, 
                categoria = $2, 
                estoque = $3, 
                custo = $4, 
                preco = $5
            WHERE id = $6
            RETURNING *;`, 
            [   nomeEdit.trim(), 
                categoriaEdit ? categoriaEdit.trim() : null, 
                parseInt(quantidadeEdit, 10), 
                parseFloat(custoEdit), 
                parseFloat(precoEdit), 
                idNum
            ]);

        if (resultEdit.rowCount === 0){
            return c.json({sucesso: false, mensagem: "Produto não encontrado no banco de dados"}, 404);
        }    

        return c.json({
            sucesso: true,
            mensagem: "Produto atualizado com sucesso",
            produto: resultEdit.rows[0]
        })
    }
    catch (erro){
        console.error(":: [ERRO UPDATE]", erro);
        return c.json({sucesso: false, mensagem: "Erro ao atualizar produto no banco de dados"}, 500);
    }
});
// ====================================================
// BAIXA DE ESTOQUE / REGISTRO DE VENDA (TRANSAÇÃO)
// ====================================================
app.post('/api/baixa', async (c) => {
    let body;

    try {
        body = await c.req.json();
    } catch {
        return c.json({ sucesso: false, mensagem: "Corpo da requisição inválido" }, 400);
    }

    const itensRecebidos = Array.isArray(body.itens) ? body.itens : [];
    const formaPagamento = String(body.forma_pagamento || 'DINHEIRO').trim().toUpperCase();
    let descontoPct = parseFloat(body.desconto_porcentagem);

    if (isNaN(descontoPct) || descontoPct < 0) descontoPct = 0;
    if (descontoPct > 100) descontoPct = 100;

    if (itensRecebidos.length === 0) {
        return c.json({ sucesso: false, mensagem: "Nenhum item informado para dar baixa" }, 400);
    }

    // Agrupa itens repetidos pelo mesmo código de barras
    const itensAgrupados = new Map();

    for (const item of itensRecebidos) {
        const codigo = String(item.codigo_barras ?? item.codigo ?? '').trim();
        const quantidade = parseInt(item.quantidade, 10);

        if (!codigo || isNaN(quantidade) || quantidade <= 0) {
            return c.json({
                sucesso: false,
                mensagem: "Item inválido: informe código de barras e quantidade maior que zero"
            }, 400);
        }

        itensAgrupados.set(codigo, (itensAgrupados.get(codigo) || 0) + quantidade);
    }

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const itensBaixados = [];
        let subtotal = 0;
        let valorTotal = 0;
        let totalItens = 0;

        for (const [codigo, quantidade] of itensAgrupados) {
            const buscaProduto = await client.query(`
                SELECT id, codigo_barras, nome, estoque, custo, preco
                FROM produtos
                WHERE codigo_barras = $1
                FOR UPDATE`, [codigo]);

            if (buscaProduto.rowCount === 0) {
                const erro = new Error(`Produto com código [${codigo}] não encontrado no banco`);
                erro.status = 404;
                throw erro;
            }

            const produto = buscaProduto.rows[0];
            const estoqueAtual = Number(produto.estoque);

            if (quantidade > estoqueAtual) {
                const erro = new Error(`Estoque insuficiente para '${produto.nome}' // disponível: ${estoqueAtual} un`);
                erro.status = 400;
                throw erro;
            }

            const precoUnitario = Number(produto.preco);
            const custoUnitario = Number(produto.custo);
            const totalItem = Number((precoUnitario * quantidade).toFixed(2));
            const totalItemComDesconto = Number((totalItem * (1 - descontoPct / 100)).toFixed(2));

            const insertMovimentacao = await client.query(`
                INSERT INTO movimentacoes
                    (produto_id, quantidade, custo_unitario, preco_original, desconto_porcentagem, preco_final, forma_pagamento, tipo)
                VALUES ($1, $2, $3, $4, $5, $6, $7, 'SAIDA')
                RETURNING *`,
                [produto.id, quantidade, custoUnitario, precoUnitario, descontoPct, totalItemComDesconto, formaPagamento]);

            await client.query(`
                UPDATE produtos
                SET estoque = estoque - $1,
                    atualizado_em = CURRENT_TIMESTAMP
                WHERE id = $2`, [quantidade, produto.id]);

            subtotal += totalItem;
            valorTotal += totalItemComDesconto;
            totalItens += quantidade;

            itensBaixados.push({
                movimentacao_id: insertMovimentacao.rows[0].id,
                produto_id: produto.id,
                codigo_barras: produto.codigo_barras,
                nome_produto: produto.nome,
                quantidade,
                preco_unitario: precoUnitario,
                custo_unitario: custoUnitario,
                total_item: totalItemComDesconto,
                estoque_restante: estoqueAtual - quantidade
            });
        }

        await client.query('COMMIT');

        subtotal = Number(subtotal.toFixed(2));
        valorTotal = Number(valorTotal.toFixed(2));

        return c.json({
            sucesso: true,
            mensagem: "Baixa registrada com sucesso",
            venda: {
                forma_pagamento: formaPagamento,
                desconto_porcentagem: descontoPct,
                subtotal,
                valor_desconto: Number((subtotal - valorTotal).toFixed(2)),
                valor_total: valorTotal,
                total_itens: totalItens,
                itens: itensBaixados
            }
        }, 201);
    } catch (erro) {
        await client.query('ROLLBACK').catch(() => {});
        console.error(":: [ERRO BAIXA]", erro.message);

        return c.json({
            sucesso: false,
            mensagem: erro.status ? erro.message : "Erro interno ao registrar baixa no banco de dados"
        }, erro.status || 500);
    } finally {
        client.release();
    }
});



app.get('/api/relatorio', async (c) =>{
    try{
        const resultadoRelatorio = await pool.query(`SELECT 
                m.id,
                m.quantidade,
                m.custo_unitario,
                (m.quantidade * m.custo_unitario) AS custo_total,
                m.preco_final AS faturamento,
                (m.preco_final - (m.quantidade * m.custo_unitario)) AS lucro,
                m.forma_pagamento,
                m.tipo,
                m.criado_em,
                COALESCE(p.codigo_barras, 'N/A') AS codigo_barras,
                COALESCE(p.nome, 'Produto Não Registrado') AS nome_produto
            FROM movimentacoes m
            LEFT JOIN produtos p ON m.produto_id = p.id
            ORDER BY m.id DESC`);

        return c.json({
            sucess: true,
            resultado: resultadoRelatorio.rows
        });
    }

    catch (erro) {
        console.error("Erro ao buscar produtos: ", erro);
        return c.json({
            sucesso: false,
            mensagem: "Erro ao busca produtos no banco de dados"
        }, 500);
    }
});

const port = Number(process.env.PORT) || 3000;

serve({
    fetch: app.fetch,
    port
});