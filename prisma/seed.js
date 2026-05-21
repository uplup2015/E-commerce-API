const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const users = [
  { name: 'Admin User', email: 'admin@gmail.com', password: 'admin123', role: 'ADMIN' },
  { name: 'Customer User', email: 'customer@gmail.com', password: 'customer123', role: 'CUSTOMER' },
];

const images = {
  Phones: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1200&q=80',
  Laptops: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=1200&q=80',
  Tablets: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=1200&q=80',
  Audio: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1200&q=80',
  Wearables: 'https://images.unsplash.com/photo-1551816230-ef5deaed4a26?auto=format&fit=crop&w=1200&q=80',
  Gaming: 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?auto=format&fit=crop&w=1200&q=80',
  Cameras: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32d?auto=format&fit=crop&w=1200&q=80',
  'Smart Home': 'https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=1200&q=80',
  'TV & Displays': 'https://images.unsplash.com/photo-1593305841991-05c297ba4575?auto=format&fit=crop&w=1200&q=80',
  Drones: 'https://images.unsplash.com/photo-1473968512647-3e447244af8f?auto=format&fit=crop&w=1200&q=80',
  Storage: 'https://images.unsplash.com/photo-1597852074816-d933c7d2b988?auto=format&fit=crop&w=1200&q=80',
  Networking: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=1200&q=80',
  'PC Components': 'https://images.unsplash.com/photo-1591488320449-011701bb6704?auto=format&fit=crop&w=1200&q=80',
  Accessories: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=1200&q=80',
  'Power & Charging': 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?auto=format&fit=crop&w=1200&q=80',
  Printers: 'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?auto=format&fit=crop&w=1200&q=80',
};

const productsByCategory = {
  Phones: [
    ['Apple iPhone 17e 128GB', 599.99, 24],
    ['Apple iPhone 17 Pro 256GB', 1099.99, 18],
    ['Samsung Galaxy S25 Ultra 256GB', 1099.99, 18],
    ['Samsung Galaxy Z Fold7 512GB', 1799.99, 8],
    ['Google Pixel 9 Pro 128GB', 899.99, 16],
    ['OnePlus 13 256GB', 799.99, 16],
  ],
  Laptops: [
    ['Apple MacBook Air 13-inch M5', 999.99, 12],
    ['Apple MacBook Pro 14-inch M5 Pro', 1999.99, 9],
    ['Dell XPS 13 Snapdragon X Elite Laptop', 1299.99, 12],
    ['Lenovo Yoga Slim 7x 14-inch OLED', 1199.99, 10],
    ['ASUS ROG Zephyrus G14 Gaming Laptop', 1699.99, 7],
    ['Razer Blade 16 Gaming Laptop', 2699.99, 5],
  ],
  Tablets: [
    ['Apple iPad Air 11-inch M4', 599.99, 21],
    ['Apple iPad Pro 13-inch M5', 1299.99, 12],
    ['Samsung Galaxy Tab S10+ 12.4-inch', 849.99, 11],
    ['Samsung Galaxy Tab S11 Ultra 14.6-inch', 1199.99, 9],
  ],
  Audio: [
    ['Sony WH-1000XM5 Wireless Noise Canceling Headphones', 349.99, 28],
    ['Bose QuietComfort Ultra Headphones', 299.99, 20],
    ['Apple AirPods Pro 3', 249.99, 30],
    ['Samsung Galaxy Buds3 Pro', 219.99, 24],
    ['JBL Charge 6 Portable Bluetooth Speaker', 179.99, 20],
    ['Sonos Era 300 Smart Speaker', 449.99, 14],
  ],
  Wearables: [
    ['Apple Watch Series 10 GPS 45mm', 429.99, 19],
    ['Apple Watch Ultra 3 GPS + Cellular', 799.99, 10],
    ['Samsung Galaxy Watch Ultra', 649.99, 9],
    ['Google Pixel Watch 3 LTE', 399.99, 15],
    ['Fitbit Charge 6 Fitness Tracker', 159.99, 26],
  ],
  Gaming: [
    ['Sony PlayStation 5 Slim Console', 499.99, 13],
    ['Microsoft Xbox Series X 2TB Console', 599.99, 12],
    ['Nintendo Switch OLED Console', 349.99, 17],
    ['Steam Deck OLED 1TB', 649.99, 9],
    ['Meta Quest 3 512GB VR Headset', 649.99, 14],
  ],
  Cameras: [
    ['Canon EOS R50 Mirrorless Camera Kit', 679.99, 8],
    ['Sony Alpha a6700 Mirrorless Camera Body', 1399.99, 7],
    ['Nikon Z6 III Mirrorless Camera Body', 2499.99, 5],
    ['GoPro HERO13 Black Action Camera', 399.99, 16],
  ],
  'Smart Home': [
    ['Ring Battery Doorbell Pro', 229.99, 23],
    ['Google Nest Learning Thermostat 4th Gen', 279.99, 20],
    ['Amazon Echo Show 8 Smart Display', 149.99, 30],
    ['Philips Hue White and Color Starter Kit', 199.99, 22],
  ],
  'TV & Displays': [
    ['Samsung 75-inch Crystal UHD 4K Smart TV', 699.99, 7],
    ['LG UltraGear 27-inch QHD Gaming Monitor', 329.99, 15],
    ['LG C5 65-inch OLED evo 4K Smart TV', 1799.99, 6],
    ['Samsung Odyssey OLED G8 32-inch Gaming Monitor', 1199.99, 8],
  ],
  Drones: [
    ['DJI Mini 4 Pro Fly More Combo', 1099.99, 9],
    ['DJI Air 3S Drone with RC 2 Controller', 1599.99, 6],
    ['Autel EVO Lite+ Premium Bundle', 1299.99, 5],
  ],
  Storage: [
    ['Samsung 990 Pro 2TB NVMe SSD', 179.99, 35],
    ['SanDisk Extreme Portable SSD 4TB', 299.99, 23],
    ['WD Black SN850X 4TB Gaming SSD', 349.99, 14],
    ['Seagate Expansion 8TB Desktop Hard Drive', 169.99, 19],
  ],
  Networking: [
    ['Eero Max 7 Mesh Wi-Fi 7 Router', 599.99, 10],
    ['Netgear Nighthawk RS700S Wi-Fi 7 Router', 699.99, 8],
    ['TP-Link Deco BE85 Wi-Fi 7 Mesh 2-Pack', 999.99, 7],
  ],
  'PC Components': [
    ['NVIDIA GeForce RTX 5080 16GB Graphics Card', 999.99, 6],
    ['AMD Ryzen 9 9950X Processor', 649.99, 13],
    ['Intel Core Ultra 9 285K Processor', 589.99, 11],
    ['Corsair Vengeance RGB 32GB DDR5 Memory Kit', 129.99, 26],
  ],
  Accessories: [
    ['Apple Magic Keyboard for iPad Pro 13-inch', 349.99, 21],
    ['Logitech MX Master 4 Wireless Mouse', 119.99, 31],
  ],
  'Power & Charging': [
    ['Anker 737 24,000mAh Power Bank', 149.99, 28],
    ['Belkin 3-in-1 MagSafe Wireless Charging Stand', 149.99, 24],
  ],
  Printers: [
    ['Canon PIXMA MegaTank G3270 Wireless Printer', 229.99, 16],
    ['HP OfficeJet Pro 9125e All-in-One Printer', 199.99, 18],
  ],
};

async function seedUsers() {
  for (const user of users) {
    const hashed = await bcrypt.hash(user.password, 10);

    await prisma.user.upsert({
      where: { email: user.email },
      update: { name: user.name, password: hashed, role: user.role },
      create: { name: user.name, email: user.email, password: hashed, role: user.role },
    });
  }
}

async function seedCatalog() {
  for (const [categoryName, products] of Object.entries(productsByCategory)) {
    const category = await prisma.category.upsert({
      where: { name: categoryName },
      update: {},
      create: { name: categoryName },
    });

    for (const [title, price, stock] of products) {
      const existing = await prisma.product.findFirst({ where: { title } });
      const data = {
        title,
        price,
        stock,
        images: [images[categoryName]],
        categoryId: category.id,
      };

      if (existing) {
        await prisma.product.update({ where: { id: existing.id }, data });
      } else {
        await prisma.product.create({ data });
      }
    }
  }
}

async function main() {
  await seedUsers();
  await seedCatalog();

  const productCount = Object.values(productsByCategory).reduce((sum, products) => sum + products.length, 0);
  console.log(`Seeded ${users.length} users and ${productCount} products.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
