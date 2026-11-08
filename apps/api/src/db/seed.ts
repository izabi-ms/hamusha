import pg from 'pg';
import { env } from '../utils/env';

const { Pool } = pg;

const pool = new Pool({
  connectionString: env.DATABASE_URL,
});

function generateId(): string {
  return crypto.randomUUID();
}

const placeholderImage = 'https://via.placeholder.com/600x800/4F46E5/FFFFFF?text=Haimish+Product';

async function seed() {
  const client = await pool.connect();
  
  try {
    console.log('Seeding database...');

    // Categories: tshirts, hoodies, accessories
    const sampleProducts = [
      // T-Shirts (3 products)
      {
        id: generateId(),
        slug: 'classic-fit-tshirt',
        name: 'Classic Fit T-Shirt',
        name_bn: 'ক্লাসিক ফিট টি-শার্ট',
        description: 'Premium cotton classic fit t-shirt, perfect for everyday wear.',
        description_bn: 'প্রিমিয়াম কটন ক্লাসিক ফিট টি-শার্ট, প্রতিদিনের ব্যবহার জন্য আদর্শ।',
        category: 'tshirts',
        category_bn: 'টিশার্ট',
        base_price: 899,
        poster_png_url: placeholderImage + '&text=Classic+Tee',
        template_id: 'tpl_tshirt_classic',
        is_active: true,
      },
      {
        id: generateId(),
        slug: 'oversized-tshirt',
        name: 'Oversized T-Shirt',
        name_bn: 'ওভারসাইজড টি-শার্ট',
        description: 'Trendy oversized fit with dropped shoulders, made from heavyweight cotton.',
        description_bn: 'ড্রপড শল্ডারের সাথে ট্রেন্ডি ওভারসাইজড ফিট, হেভিভেট কটন দিয়ে তৈরি।',
        category: 'tshirts',
        category_bn: 'টিশার্ট',
        base_price: 1099,
        poster_png_url: placeholderImage + '&text=Oversized+Tee',
        template_id: 'tpl_tshirt_oversized',
        is_active: true,
      },
      {
        id: generateId(),
        slug: 'v-neck-tshirt',
        name: 'V-Neck T-Shirt',
        name_bn: 'ভি-নেক টি-শার্ট',
        description: 'Classic V-neck t-shirt with a modern slim fit.',
        description_bn: 'আধুনিক স্লিম ফিটের সাথে ক্লাসিক ভি-নেক টি-শার্ট।',
        category: 'tshirts',
        category_bn: 'টিশার্ট',
        base_price: 799,
        poster_png_url: placeholderImage + '&text=V-Neck+Tee',
        template_id: 'tpl_tshirt_vneck',
        is_active: true,
      },
      // Hoodies (3 products)
      {
        id: generateId(),
        slug: 'premium-hoodie',
        name: 'Premium Hoodie',
        name_bn: 'প্রিমিয়াম হুডি',
        description: 'Heavyweight fleece hoodie with kangaroo pocket and adjustable drawstring.',
        description_bn: 'কাঙ্গারু পকেট এবং অ্যাডজাস্টেবল ড্রস্ট্রিংসহ হেভিভেট ফ্লিস হুডি।',
        category: 'hoodies',
        category_bn: 'হুডি',
        base_price: 2499,
        poster_png_url: placeholderImage + '&text=Premium+Hoodie',
        template_id: 'tpl_hoodie_premium',
        is_active: true,
      },
      {
        id: generateId(),
        slug: 'zip-hoodie',
        name: 'Full Zip Hoodie',
        name_bn: 'ফুল জিপ হুডি',
        description: 'Versatile full-zip hoodie with side pockets, perfect for layering.',
        description_bn: 'সাইড পকেটসহ বহুমুখী ফুল-জিপ হুডি, লেয়ারিং-এর জন্য সুনির্দিষ্ট।',
        category: 'hoodies',
        category_bn: 'হুডি',
        base_price: 2799,
        poster_png_url: placeholderImage + '&text=Zip+Hoodie',
        template_id: 'tpl_hoodie_zip',
        is_active: true,
      },
      {
        id: generateId(),
        slug: 'crop-hoodie',
        name: 'Cropped Hoodie',
        name_bn: 'ক্রপড হুডি',
        description: 'Trendy cropped hoodie with raw hem, designed for a modern silhouette.',
        description_bn: 'র অহেমসহ ট্রেন্ডি ক্রপড হুডি, আধুনিক সিলুয়েটের জন্য ডিজাইন করা।',
        category: 'hoodies',
        category_bn: 'হুডি',
        base_price: 2299,
        poster_png_url: placeholderImage + '&text=Crop+Hoodie',
        template_id: 'tpl_hoodie_crop',
        is_active: true,
      },
      // Accessories (3 products)
      {
        id: generateId(),
        slug: 'canvas-tote-bag',
        name: 'Canvas Tote Bag',
        name_bn: 'ক্যানভাস টোট ব্যাগ',
        description: 'Durable canvas tote bag with reinforced handles, eco-friendly and stylish.',
        description_bn: 'রিইনফোর্সড হ্যান্ডেলসহ টেকসই ক্যানভাস টোট ব্যাগ, ইকো-ফ্রেন্ডলি এবং স্টাইলিশ।',
        category: 'accessories',
        category_bn: 'অ্যাক্সেসরি',
        base_price: 599,
        poster_png_url: placeholderImage + '&text=Tote+Bag',
        template_id: 'tpl_accessory_tote',
        is_active: true,
      },
      {
        id: generateId(),
        slug: 'dad-cap',
        name: 'Dad Cap',
        name_bn: 'ড্যাড ক্যাপ',
        description: 'Classic unstructured dad cap with adjustable strap, embroidered logo.',
        description_bn: 'অ্যাডজাস্টেবল স্ট্র্যাপসহ ক্লাসিক আনস্ট্রাকচারড ড্যাড ক্যাপ, এমব্রয়েডার্ড লোগো।',
        category: 'accessories',
        category_bn: 'অ্যাক্সেসরি',
        base_price: 499,
        poster_png_url: placeholderImage + '&text=Dad+Cap',
        template_id: 'tpl_accessory_cap',
        is_active: true,
      },
      {
        id: generateId(),
        slug: 'phone-case',
        name: 'Custom Phone Case',
        name_bn: 'কাস্টম ফোন কেস',
        description: 'Slim protective phone case with matte finish, compatible with major models.',
        description_bn: 'ম্যাট ফিনিশসহ স্লিম প্রোটেক্টিভ ফোন কেস, প্রধান মডেলগুলোর সাথে কম্প্যাটিবল।',
        category: 'accessories',
        category_bn: 'অ্যাক্সেসরি',
        base_price: 699,
        poster_png_url: placeholderImage + '&text=Phone+Case',
        template_id: 'tpl_accessory_phone',
        is_active: true,
      },
    ];

    // Insert products
    for (const product of sampleProducts) {
      await client.query(
        `INSERT INTO products (id, slug, name, name_bn, description, description_bn, category, category_bn, base_price, poster_png_url, template_id, is_active, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
         ON CONFLICT (id) DO NOTHING`,
        product.id, product.slug, product.name, product.name_bn, product.description, product.description_bn,
        product.category, product.category_bn, product.base_price, product.poster_png_url, product.template_id, product.is_active
      );
      console.log(`Inserted product: ${product.name}`);
    }

    // Variants for each product
    const colors = [
      { hex: '#1A1A2E', name: 'Midnight Navy', name_bn: 'মিডনাইট নেভি' },
      { hex: '#FFFFFF', name: 'Pure White', name_bn: 'পিউর হোয়াইট' },
      { hex: '#C0392B', name: 'Crimson Red', name_bn: 'ক্রিমসন রেড' },
      { hex: '#27AE60', name: 'Forest Green', name_bn: 'ফরেস্ট গ্রিন' },
      { hex: '#2980B9', name: 'Ocean Blue', name_bn: 'ওশন ব্লু' },
      { hex: '#8E44AD', name: 'Royal Purple', name_bn: 'রয়াল পার্পল' },
      { hex: '#F39C12', name: 'Golden Yellow', name_bn: 'গোল্ডেন ইয়েলো' },
      { hex: '#ECF0F1', name: 'Light Gray', name_bn: 'লাইট গ্রে' },
    ];

    const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
    const accessorySizes = ['One Size'];

    const productsResult = await client.query('SELECT * FROM products');
    const allProducts = productsResult.rows;

    for (const product of allProducts) {
      const isAccessory = product.category === 'accessories';
      const productSizes = isAccessory ? accessorySizes : sizes;
      const numColors = isAccessory ? 3 : 4;
      const selectedColors = colors.slice(0, numColors);

      for (const color of selectedColors) {
        for (const size of productSizes) {
          const variantId = generateId();
          const sku = `${product.slug.toUpperCase()}-${color.hex.replace('#', '').toUpperCase()}-${size}`;
          
          await client.query(
            `INSERT INTO variants (id, product_id, sku, color_hex, color_name, color_name_bn, size, price_override, stock, is_active, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
             ON CONFLICT (id) DO NOTHING`,
            variantId, product.id, sku, color.hex, color.name, color.name_bn, size, null, Math.floor(Math.random() * 50) + 10, true
          );
        }
      }
      console.log(`Inserted variants for: ${product.name}`);
    }

    console.log('Seeding complete!');
  } catch (error) {
    console.error('Seeding failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

seed().catch(console.error);