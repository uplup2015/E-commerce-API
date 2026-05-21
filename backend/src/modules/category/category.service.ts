import { ApiError } from '../../utils/ApiError';
import * as categoryRepository from './category.repository';

export async function createCategory(name: string) {
  const trimmed = name.trim();
  const existing = await categoryRepository.findCategoryByName(trimmed);
  if (existing) throw ApiError.conflict('Category name already exists');

  return categoryRepository.createCategory(trimmed);
}

export async function getCategories() {
  return categoryRepository.findCategories();
}

export async function updateCategory(id: number, name: string) {
  const trimmed = name.trim();
  const category = await categoryRepository.findCategoryById(id);
  if (!category) throw ApiError.notFound('Category not found');

  const duplicate = await categoryRepository.findDuplicateCategoryName(trimmed, id);
  if (duplicate) throw ApiError.conflict('Category name already exists');

  return categoryRepository.updateCategory(id, trimmed);
}

export async function deleteCategory(id: number) {
  const category = await categoryRepository.findCategoryWithProductCount(id);
  if (!category) throw ApiError.notFound('Category not found');
  if (category._count.products > 0) {
    throw ApiError.conflict('Cannot delete a category that has products');
  }

  return categoryRepository.deleteCategory(id);
}
