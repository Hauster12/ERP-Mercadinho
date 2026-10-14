import {
  Body,
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Param,
  ParseUUIDPipe,
  Query,
  Req,
  BadRequestException,
} from "@nestjs/common";
import * as bcrypt from "bcrypt";
import { PrismaService } from "./prisma.service";
import { Admin, AuthRequest } from "./auth";
import {
  CategoriaDto,
  ProdutoDto,
  ClienteDto,
  FornecedorDto,
  UsuarioDto,
  UsuarioUpdateDto,
  VinculoDto,
  PageDto,
  ConfiguracaoDto,
} from "./dtos";
export const userSelect = {
  id: true,
  nome: true,
  email: true,
  perfil: true,
  ativo: true,
  avatarUrl: true,
  criadoEm: true,
} as const;
function page(paginacao: PageDto) {
  return {
    skip: (paginacao.pagina - 1) * paginacao.limite,
    take: paginacao.limite,
  };
}
@Controller()
export class CatalogController {
  constructor(private db: PrismaService) {}
  @Get("categorias") categorias(@Query() paginacao: PageDto) {
    return this.db.categoria.findMany({
      ...page(paginacao),
      where: paginacao.busca
        ? { nome: { contains: paginacao.busca, mode: "insensitive" } }
        : undefined,
      orderBy: { nome: "asc" },
    });
  }
  @Admin() @Post("categorias") categoria(@Body() dados: CategoriaDto) {
    return this.db.categoria.create({ data: dados });
  }
  @Admin() @Put("categorias/:id") categoriaUpdate(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dados: CategoriaDto,
  ) {
    return this.db.categoria.update({ where: { id }, data: dados });
  }
  @Get("produtos") produtos(@Query() paginacao: PageDto) {
    return this.db.produto.findMany({
      ...page(paginacao),
      where: paginacao.busca
        ? {
            OR: [
              { nome: { contains: paginacao.busca, mode: "insensitive" } },
              { sku: { contains: paginacao.busca, mode: "insensitive" } },
              { codigoBarras: paginacao.busca },
            ],
          }
        : undefined,
      include: { categoria: true, fornecedor: true },
      orderBy: { nome: "asc" },
    });
  }
  @Get("produtos/:id") produtoGet(@Param("id", ParseUUIDPipe) id: string) {
    return this.db.produto.findUniqueOrThrow({
      where: { id },
      include: {
        categoria: true,
        fornecedor: true,
        fornecedores: { include: { fornecedor: true } },
      },
    });
  }
  private async productRefs(dados: ProdutoDto) {
    if (
      !(
        await this.db.categoria.findUnique({ where: { id: dados.categoriaId } })
      )?.ativo
    )
      throw new BadRequestException("Categoria inativa ou inexistente");
    if (
      dados.fornecedorId &&
      !(
        await this.db.fornecedor.findUnique({
          where: { id: dados.fornecedorId },
        })
      )?.ativo
    )
      throw new BadRequestException("Fornecedor inativo ou inexistente");
  }
  @Admin() @Post("produtos") async produto(@Body() dados: ProdutoDto) {
    await this.productRefs(dados);
    return this.db.produto.create({
      data: dados,
      include: { categoria: true, fornecedor: true },
    });
  }
  @Admin() @Put("produtos/:id") async produtoUpdate(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dados: ProdutoDto,
  ) {
    await this.productRefs(dados);
    return this.db.serial(async (transacao) => {
      const produtoAtual = await transacao.produto.findUniqueOrThrow({
        where: { id },
      });
      if (
        produtoAtual.unidade !== dados.unidade &&
        (!produtoAtual.estoqueAtual.isZero() ||
          (await transacao.movimentacaoEstoque.count({
            where: { produtoId: id },
          })) ||
          (await transacao.itemPedidoCompra.count({
            where: { produtoId: id },
          })))
      )
        throw new BadRequestException(
          "Unidade não pode mudar após estoque ou histórico; crie outro produto",
        );
      return transacao.produto.update({
        where: { id },
        data: dados,
        include: { categoria: true, fornecedor: true },
      });
    });
  }
  @Admin() @Patch("produtos/:id/inativar") inativarProduto(
    @Param("id", ParseUUIDPipe) id: string,
  ) {
    return this.db.produto.update({ where: { id }, data: { ativo: false } });
  }
  @Admin() @Post("produtos/:id/fornecedores") async vincular(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dados: VinculoDto,
  ) {
    return this.db.produtoFornecedor.upsert({
      where: {
        produtoId_fornecedorId: {
          produtoId: id,
          fornecedorId: dados.fornecedorId,
        },
      },
      create: { produtoId: id, ...dados },
      update: dados,
    });
  }
  @Get("fornecedores") fornecedores(@Query() paginacao: PageDto) {
    return this.db.fornecedor.findMany({
      ...page(paginacao),
      where: paginacao.busca
        ? { razaoSocial: { contains: paginacao.busca, mode: "insensitive" } }
        : undefined,
      orderBy: { razaoSocial: "asc" },
    });
  }
  @Admin() @Post("fornecedores") fornecedor(@Body() dados: FornecedorDto) {
    return this.db.fornecedor.create({ data: dados });
  }
  @Admin() @Put("fornecedores/:id") fornecedorUpdate(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dados: FornecedorDto,
  ) {
    return this.db.fornecedor.update({ where: { id }, data: dados });
  }
  @Get("clientes") async clientes(@Query() paginacao: PageDto) {
    const registros = await this.db.cliente.findMany({
      ...page(paginacao),
      where: paginacao.busca
        ? { nome: { contains: paginacao.busca, mode: "insensitive" } }
        : undefined,
      orderBy: { nome: "asc" },
    });
    return Promise.all(
      registros.map(async (cliente) => ({
        ...cliente,
        saldoDevedor: 0,
        totalComprado:
          (
            await this.db.venda.aggregate({
              where: { clienteId: cliente.id, status: "CONCLUIDA" },
              _sum: { valorTotal: true },
            })
          )._sum.valorTotal || 0,
      })),
    );
  }
  @Post("clientes") cliente(@Body() dados: ClienteDto) {
    return this.db.cliente.create({ data: dados });
  }
  @Put("clientes/:id") clienteUpdate(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dados: ClienteDto,
  ) {
    return this.db.cliente.update({ where: { id }, data: dados });
  }
  @Admin() @Get("usuarios") usuarios(@Query() paginacao: PageDto) {
    return this.db.usuario.findMany({
      ...page(paginacao),
      select: userSelect,
      orderBy: { nome: "asc" },
    });
  }
  @Admin() @Post("usuarios") async usuario(@Body() dados: UsuarioDto) {
    const { senha, ...data } = dados;
    return this.db.usuario.create({
      data: {
        ...data,
        email: data.email.trim().toLowerCase(),
        senhaHash: await bcrypt.hash(senha, 12),
      },
      select: userSelect,
    });
  }
  @Admin() @Patch("usuarios/:id") async usuarioUpdate(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dados: UsuarioUpdateDto,
    @Req() requisicao: AuthRequest,
  ) {
    if (
      id === requisicao.user.id &&
      (dados.ativo === false || dados.perfil === "FUNCIONARIO")
    )
      throw new BadRequestException(
        "Não remova seu próprio acesso administrativo",
      );
    const { senha, ...data } = dados;
    return this.db.usuario.update({
      where: { id },
      data: {
        ...data,
        ...(data.email ? { email: data.email.trim().toLowerCase() } : {}),
        ...(senha ? { senhaHash: await bcrypt.hash(senha, 12) } : {}),
      },
      select: userSelect,
    });
  }
  @Get("configuracoes") config() {
    return this.db.configuracaoEmpresa.findUnique({ where: { id: 1 } });
  }
  @Admin() @Put("configuracoes") configUpdate(@Body() dados: ConfiguracaoDto) {
    return this.db.configuracaoEmpresa.upsert({
      where: { id: 1 },
      create: { id: 1, ...dados },
      update: dados,
    });
  }
}
