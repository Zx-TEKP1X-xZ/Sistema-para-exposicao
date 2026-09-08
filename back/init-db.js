import { pool } from './db.js';
import 'dotenv/config';

async function main(){
    try{
        await pool.query(`CREATE TABLE IF NOT EXISTS produtos (
            id BIGSERIAL PRIMARY KEY,
            codigo_barras VARCHAR(50) UNIQUE NOT NULL,
            nome VARCHAR(150) NOT NULL,
            categoria VARCHAR(100) DEFAULT 'Geral',
            estoque INT NOT NULL DEFAULT 0 CHECK (estoque >= 0),
            custo NUMERIC(10, 2) DEFAULT 0.00,
            preco NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
            criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );`
        );

        console.log(":: [✓] Tabela 'produtos' verificada/criada com sucesso!");

        await pool.query(`CREATE TABLE IF NOT EXISTS movimentacoes (
            id BIGSERIAL PRIMARY KEY,
            produto_id BIGINT REFERENCES produtos(id) ON DELETE CASCADE,
            quantidade INT NOT NULL,
            preco_original NUMERIC(10, 2) NOT NULL,
            desconto_porcentagem NUMERIC(5, 2) DEFAULT 0.00,
            preco_final NUMERIC(10, 2) NOT NULL,
            forma_pagamento VARCHAR(30) DEFAULT 'DINHEIRO', -- DINHEIRO, PIX, DÉBITO, CRÉDITO
            tipo VARCHAR(20) DEFAULT 'SAIDA',
            criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
             );`)

        console.log(":: [✓] Tabela 'movimentacoes' verificada/criada com sucesso!")
    }

     catch (error) {
        console.error(error);
        process.exitCode = 1;
    } finally {
        await pool.end();
    }

}
main();
