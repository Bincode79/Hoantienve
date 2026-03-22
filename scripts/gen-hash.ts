// Generate bcrypt hash for password
import bcrypt from 'bcryptjs';

const password = 'Admin@123';
bcrypt.hash(password, 12).then(hash => {
  console.log('Password:', password);
  console.log('Hash:', hash);
  
  // Test verify
  bcrypt.compare(password, hash).then(valid => {
    console.log('Verify:', valid ? '✅ Valid' : '❌ Invalid');
  });
});
