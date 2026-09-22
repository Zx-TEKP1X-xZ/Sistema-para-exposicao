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

const port = Number(process.env.PORT) || 3000;

serve({
    fetch: app.fetch,
    port
});