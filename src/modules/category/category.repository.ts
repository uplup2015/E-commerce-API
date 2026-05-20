import prisma from '../../config/prisma';

export function findCategoryById(id: number) {
  return prisma.category.findUnique({ where: { id } });
}

export function findCategoryByName(name: string) {
  return prisma.category.findUnique({ where: { name } });
}

export function findDuplicateCategoryName(name: string, excludedId: number) {
  return prisma.category.findFirst({
    where: { name, NOT: { id: excludedId } },
  });
}

export function findCategories() {
  return prisma.category.findMany({ orderBy: { name: 'asc' } });
}

export function createCategory(name: string) {
  return prisma.category.create({ data: { name } });
}

export function updateCategory(id: number, name: string) {
  return prisma.category.update({ where: { id }, data: { name } });
}

export function findCategoryWithProductCount(id: number) {
  return prisma.category.findUnique({
    where: { id },
    include: { _count: { select: { products: true } } },
  });
}

export function deleteCategory(id: number) {
  return prisma.category.delete({ where: { id } });
}
