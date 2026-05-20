import { Prisma } from '@prisma/client';
import prisma from '../../config/prisma';

const productInclude = {
  category: { select: { id: true, name: true } },
};

interface CreateProductData {
  title: string;
  price: number;
  stock: number;
  images: string[];
  categoryId: number;
}

export function findCategoryById(id: number) {
  return prisma.category.findUnique({ where: { id } });
}

export function createProduct(data: CreateProductData) {
  return prisma.product.create({
    data,
    include: productInclude,
  });
}

export function findProducts(where: Prisma.ProductWhereInput, skip: number, take: number) {
  return prisma.$transaction([
    prisma.product.findMany({
      where,
      skip,
      take,
      include: productInclude,
      orderBy: { id: 'desc' },
    }),
    prisma.product.count({ where }),
  ]);
}

export function findProductById(id: number) {
  return prisma.product.findUnique({
    where: { id },
    include: productInclude,
  });
}

export function updateProduct(id: number, data: Partial<CreateProductData>) {
  return prisma.product.update({
    where: { id },
    data,
    include: productInclude,
  });
}

export function deleteProduct(id: number) {
  return prisma.product.delete({ where: { id } });
}
