import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
const db=new PrismaClient();
async function main(){
 const email=process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();const senha=process.env.SEED_ADMIN_PASSWORD;
 if(!email || !senha || senha.length<10 || senha.length>72 || !/^[\x20-\x7E]+$/.test(senha) || senha.includes('DEFINA')) throw Error('Configure SEED_ADMIN_EMAIL e SEED_ADMIN_PASSWORD (10 a 72 caracteres ASCII)');
 await db.usuario.upsert({where:{email},update:{},create:{nome:'Administrador',email,senhaHash:await bcrypt.hash(senha,12),perfil:'ADMIN'}});
 await db.categoria.upsert({where:{nome:'Mercearia'},update:{},create:{nome:'Mercearia'}});
 await db.configuracaoEmpresa.upsert({where:{id:1},update:{},create:{id:1,nomeFantasia:'Mercadinho'}});
 console.log('Seed concluído. Usuário existente e senha não são alterados.');
}
main().catch(()=>{console.error('Seed falhou. Confira configuração e conexão.');process.exitCode=1;}).finally(()=>db.$disconnect());
