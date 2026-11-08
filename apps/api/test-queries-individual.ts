import { db } from './src/db';

async function testQueries() {
  try {
    console.log('Test 1: Basic query with is_active...');
    const result1 = await db.all(
      `SELECT * FROM products WHERE is_active = ? ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      1, 20, 0
    );
    console.log('Test 1 passed:', result1.length, 'items');
    
    console.log('Test 2: Count query...');
    const count1 = await db.get(
      `SELECT COUNT(*) as count FROM products WHERE is_active = ?`,
      1
    );
    console.log('Test 2 passed:', count1);
    
    console.log('Test 3: With category...');
    const result3 = await db.all(
      `SELECT * FROM products WHERE is_active = ? AND category = ? ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      1, 'tshirts', 20, 0
    );
    console.log('Test 3 passed:', result3.length, 'items');
    
    console.log('Test 4: Category count...');
    const count3 = await db.get(
      `SELECT COUNT(*) as count FROM products WHERE is_active = ? AND category = ?`,
      1, 'tshirts'
    );
    console.log('Test 4 passed:', count3);
    
    console.log('Test 5: With search...');
    const result5 = await db.all(
      `SELECT * FROM products WHERE is_active = ? AND (name LIKE ? OR description LIKE ? OR name_bn LIKE ?) ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      1, '%test%', '%test%', '%test%', 20, 0
    );
    console.log('Test 5 passed:', result5.length, 'items');
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testQueries();