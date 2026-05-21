import prisma from '../../config/prisma';
import { uniqueId } from './test-data';

interface CreateProductOptions {
  title?: string;
  price?: number;
  stock?: number;
  imageUrl?: string;
  categoryId?: number;
}

export function createCategory(name = `Test Category ${uniqueId()}`) {
  return prisma.category.create({ data: { name } });
}

export async function createCatalogProduct(
  categoryPrefix: string,
  productPrefix: string,
  options: CreateProductOptions = {},
) {
  const category = options.categoryId
    ? await prisma.category.findUniqueOrThrow({ where: { id: options.categoryId } })
    : await createCategory(`${categoryPrefix} ${uniqueId()}`);
  const product = await prisma.product.create({
    data: {
      title: options.title ?? `${productPrefix} ${uniqueId()}`,
      price: options.price ?? 49.99,
      stock: options.stock ?? 10,
      images: [options.imageUrl ?? 'https://example.com/product.jpg'],
      categoryId: category.id,
    },
  });

  return { category, product };
}

export async function cleanupByPrefixes(options: {
  userEmailPrefix?: string;
  categoryNamePrefix?: string;
  productTitlePrefix?: string;
}) {
  const { userEmailPrefix, categoryNamePrefix, productTitlePrefix } = options;

  if (productTitlePrefix || userEmailPrefix) {
    await prisma.orderItem.deleteMany({
      where: {
        OR: [
          ...(productTitlePrefix
            ? [{ product: { title: { startsWith: productTitlePrefix } } }]
            : []),
          ...(userEmailPrefix
            ? [{ order: { user: { email: { startsWith: userEmailPrefix } } } }]
            : []),
        ],
      },
    });
  }

  if (userEmailPrefix) {
    await prisma.order.deleteMany({
      where: { user: { email: { startsWith: userEmailPrefix } } },
    });
  }

  if (productTitlePrefix || userEmailPrefix) {
    await prisma.cartItem.deleteMany({
      where: {
        OR: [
          ...(productTitlePrefix
            ? [{ product: { title: { startsWith: productTitlePrefix } } }]
            : []),
          ...(userEmailPrefix
            ? [{ cart: { user: { email: { startsWith: userEmailPrefix } } } }]
            : []),
        ],
      },
    });
  }

  if (userEmailPrefix) {
    await prisma.cart.deleteMany({
      where: { user: { email: { startsWith: userEmailPrefix } } },
    });
  }

  if (productTitlePrefix) {
    await prisma.product.deleteMany({
      where: { title: { startsWith: productTitlePrefix } },
    });
  }

  if (categoryNamePrefix) {
    await prisma.category.deleteMany({
      where: { name: { startsWith: categoryNamePrefix } },
    });
  }

  if (userEmailPrefix) {
    await prisma.user.deleteMany({
      where: { email: { startsWith: userEmailPrefix } },
    });
  }
}
