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
        console.error("Erro ao buscar produtos: ", erro);
        return c.json({
            sucess: false,
            mensagem: "Erro ao busca produtos no banco de dados"
        }, 500);
    }
});

app.post('api/cadastro', async (c) => {
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
            [codigo_barras.trim(), nome.trim(), categoria.trim(), parseInt(estoque) || 0, parseFloat(custo) || 0.00, parseFloat(preco) || 0.00])

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
        }),500;
    }
});

app.get('api/produtos/buscar', async (c) =>{
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

        if (result.rows === 0){
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
        
        if (error.code === '23503'){
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