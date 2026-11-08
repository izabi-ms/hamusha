import { db } from './src/db';

async function testCatalogQuery() {
  try {
    const whereClause = 'is_active = 1';
    const params = [1];
    const orderBy = 'created_at DESC';
    const limit = 20;
    const offset = 0;
    
    console.log('Testing catalog query...');
    const items = await db.all(
      `SELECT * FROM products WHERE is_active = 1 ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      1, 20, 0
    );
    console.log('Items:', items.length);
    
    const totalResult = await db.get(
      `SELECT COUNT(*) as count FROM products WHERE is_active = 1`,
      1
    );
    console.log('Total:', totalResult);
    
    // Test with category
    const categoryParams = [1, 'tshirts'];
    const categoryItems = await db.all(
      `SELECT * FROM products WHERE is_active = ? AND category = ? ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      1, 'tshirts', 20, 0
    );
    console.log('Category items:', categoryItems.length);
    
    const categoryCount = await db.get(
      `SELECT COUNT(*) as count FROM products WHERE is_active = ? AND category = ?`,
      1, 'tshirts'
    );
    console.log('Category count:', categoryCount);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testCatalogQuery();