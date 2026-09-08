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

app.get('/', (c) => c.redirect('/login.html'));
app.use('/*', serveStatic({ root: './public' }));

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