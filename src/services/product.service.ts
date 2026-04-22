import { Prisma } from '@prisma/client';
import prisma from '../config/prisma';
import { ApiError } from '../utils/ApiError';
import { getPaginationParams, buildPaginationMeta } from '../utils/pagination';

interface CreateProductData {
  title: string;
  price: number;
  stock: number;
  images: string[];
  categoryId: number;
}

interface ProductQuery {
  search?: string;
  categoryId?: number;
  page: number;
  limit: number;
}

export async function createProduct(data: CreateProductData) {
  const category = await prisma.category.findUnique({ where: { id: data.categoryId } });
  if (!category) throw ApiError.notFound('Category not found');

  return prisma.product.create({
    data,
    include: { category: { select: { id: true, name: true } } },
  });
}

export async function getProducts(query: ProductQuery) {
  const { search, categoryId, page, limit } = query;
  const { skip, take } = getPaginationParams(page, limit);

  const where: Prisma.ProductWhereInput = {
    ...(search && { title: { contains: search, mode: 'insensitive' } }),
    ...(categoryId && { categoryId }),
  };

  const [products, total] = await prisma.$transaction([
    prisma.product.findMany({
      where,
      skip,
      take,
      include: { category: { select: { id: true, name: true } } },
      orderBy: { id: 'desc' },
    }),
    prisma.product.count({ where }),
  ]);

  return {
    data: products,
    meta: buildPaginationMeta(total, page, limit),
  };
}

export async function getProductById(id: number) {
  const product = await prisma.product.findUnique({
    where: { id },
    include: { category: { select: { id: true, name: true } } },
  });
  if (!product) throw ApiError.notFound('Product not found');
  return product;
}

export async function updateProduct(id: number, data: Partial<CreateProductData>) {
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) throw ApiError.notFound('Product not found');

  if (data.categoryId) {
    const category = await prisma.category.findUnique({ where: { id: data.categoryId } });
    if (!category) throw ApiError.notFound('Category not found');
  }

  return prisma.product.update({
    where: { id },
    data,
    include: { category: { select: { id: true, name: true } } },
  });
}

export async function deleteProduct(id: number) {
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) throw ApiError.notFound('Product not found');

  return prisma.product.delete({ where: { id } });
}
