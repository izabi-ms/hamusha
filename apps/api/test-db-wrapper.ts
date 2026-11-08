import { db } from './src/db';

async function test() {
  try {
    console.log('Testing db.all...');
    const result = await db.all('SELECT * FROM products WHERE is_active = ? LIMIT 5', 1);
    console.log('Result:', result);
    
    console.log('Testing db.get...');
    const count = await db.get('SELECT COUNT(*) as count FROM products WHERE is_active = ?', 1);
    console.log('Count:', count);
    
    console.log('Testing with category...');
    const withCategory = await db.all('SELECT * FROM products WHERE is_active = ? AND category = ? LIMIT 5', 1, 'tshirts');
    console.log('With category:', withCategory);
  } catch (error) {
    console.error('Error:', error);
  }
}

test();