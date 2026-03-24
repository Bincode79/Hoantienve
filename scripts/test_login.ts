async function testLogin() {
  console.log('Testing login API...\n');

  // Test User login
  const userResponse = await fetch('http://localhost:3001/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: '0912345678', password: 'User@123' })
  });
  const userData = await userResponse.json();
  console.log('User Login (0912345678):');
  console.log('Status:', userResponse.status);
  console.log('Response:', JSON.stringify(userData, null, 2));
  
  if (userData.token) {
    console.log('\n✅ User login SUCCESS!');
    console.log('Token:', userData.token.substring(0, 50) + '...');
  } else {
    console.log('\n❌ User login FAILED:', userData.error);
  }

  console.log('\n---\n');

  // Test Admin login
  const adminResponse = await fetch('http://localhost:3001/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: '0999999999', password: 'Admin@123' })
  });
  const adminData = await adminResponse.json();
  console.log('Admin Login (0999999999):');
  console.log('Status:', adminResponse.status);
  console.log('Response:', JSON.stringify(adminData, null, 2));

  if (adminData.token) {
    console.log('\n✅ Admin login SUCCESS!');
  } else {
    console.log('\n❌ Admin login FAILED:', adminData.error);
  }
}

testLogin().catch(console.error);
