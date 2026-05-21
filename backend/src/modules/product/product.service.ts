import { Prisma } from '@prisma/client';
import { ApiError } from '../../utils/ApiError';
import { getPaginationParams, buildPaginationMeta } from '../../utils/pagination';
import * as productRepository from './product.repository';

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
  const category = await productRepository.findCategoryById(data.categoryId);
  if (!category) throw ApiError.notFound('Category not found');

  return productRepository.createProduct(data);
}

export async function getProducts(query: ProductQuery) {
  const { search, categoryId, page, limit } = query;
  const { skip, take } = getPaginationParams(page, limit);

  const where: Prisma.ProductWhereInput = {
    ...(search && { title: { contains: search, mode: 'insensitive' } }),
    ...(categoryId && { categoryId }),
  };

  const [products, total] = await productRepository.findProducts(where, skip, take);

  return {
    data: products,
    meta: buildPaginationMeta(total, page, limit),
  };
}

export async function getProductById(id: number) {
  const product = await productRepository.findProductById(id);
  if (!product) throw ApiError.notFound('Product not found');
  return product;
}

export async function updateProduct(id: number, data: Partial<CreateProductData>) {
  const product = await productRepository.findProductById(id);
  if (!product) throw ApiError.notFound('Product not found');

  if (data.categoryId) {
    const category = await productRepository.findCategoryById(data.categoryId);
    if (!category) throw ApiError.notFound('Category not found');
  }

  return productRepository.updateProduct(id, data);
}

export async function deleteProduct(id: number) {
  const product = await productRepository.findProductById(id);
  if (!product) throw ApiError.notFound('Product not found');

  return productRepository.deleteProduct(id);
}
