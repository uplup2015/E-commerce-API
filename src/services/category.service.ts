import prisma from '../config/prisma';
import { ApiError } from '../utils/ApiError';

export async function createCategory(name: string) {
  const trimmed = name.trim();
  const existing = await prisma.category.findUnique({ where: { name: trimmed } });
  if (existing) throw ApiError.conflict('Category name already exists');

  return prisma.category.create({ data: { name: trimmed } });
}

export async function getCategories() {
  return prisma.category.findMany({ orderBy: { name: 'asc' } });
}

export async function updateCategory(id: number, name: string) {
  const trimmed = name.trim();
  const category = await prisma.category.findUnique({ where: { id } });
  if (!category) throw ApiError.notFound('Category not found');

  const duplicate = await prisma.category.findFirst({
    where: { name: trimmed, NOT: { id } },
  });
  if (duplicate) throw ApiError.conflict('Category name already exists');

  return prisma.category.update({ where: { id }, data: { name: trimmed } });
}

export async function deleteCategory(id: number) {
  const category = await prisma.category.findUnique({
    where: { id },
    include: { _count: { select: { products: true } } },
  });
  if (!category) throw ApiError.notFound('Category not found');
  if (category._count.products > 0) {
    throw ApiError.conflict('Cannot delete a category that has products');
  }

  return prisma.category.delete({ where: { id } });
}
