const {PGlite}=require('@electric-sql/pglite');
const fs=require('fs');
(async()=>{
 const db=new PGlite();
 await db.exec(fs.readFileSync(require('path').join(__dirname,'../prisma/migrations/20261012090000_initial/migration.sql'),'utf8'));
 const tables=await db.query("SELECT count(*)::int AS total FROM information_schema.tables WHERE table_schema='public'");
 if(tables.rows[0].total!==18) throw Error('Quantidade inesperada de tabelas');
 const u='00000000-0000-4000-8000-000000000001',c='00000000-0000-4000-8000-000000000002',p='00000000-0000-4000-8000-000000000003';
 await db.query('INSERT INTO usuarios (id,nome,email,"senhaHash","atualizadoEm") VALUES ($1,$2,$3,$4,now())',[u,'Teste','test@example.local','dummy']);
 await db.query('INSERT INTO categorias (id,nome,"atualizadoEm") VALUES ($1,$2,now())',[c,'Teste']);
 await db.query('INSERT INTO produtos (id,"categoriaId",nome,sku,"precoCusto","precoVenda","atualizadoEm") VALUES ($1,$2,$3,$4,2,5,now())',[p,c,'Teste','SKU']);
 async function rejects(sql,args,expected){try{await db.query(sql,args);throw Error('Constraint não bloqueou');}catch(e){if(e.code!==expected)throw e;}}
 await rejects('UPDATE produtos SET "estoqueAtual"=-1 WHERE id=$1',[p],'23514');
 await rejects('UPDATE produtos SET "categoriaId"=$1 WHERE id=$2',['00000000-0000-4000-8000-000000000009',p],'23503');
 await db.query('INSERT INTO caixas (id,"usuarioId","valorInicial") VALUES ($1,$2,0)',['00000000-0000-4000-8000-000000000004',u]);
 await rejects('INSERT INTO caixas (id,"usuarioId","valorInicial") VALUES ($1,$2,0)',['00000000-0000-4000-8000-000000000005',u],'23505');
 await db.query('UPDATE caixas SET status=$1 WHERE "usuarioId"=$2',['FECHADO',u]);
 await db.query('INSERT INTO caixas (id,"usuarioId","valorInicial") VALUES ($1,$2,0)',['00000000-0000-4000-8000-000000000005',u]);
 console.log('SQL aplicado: 18 tabelas. Constraints de saldo, FK e caixa aberto validadas em PostgreSQL WASM (PGlite).');await db.close();
})().catch(e=>{console.error(e);process.exit(1)});
