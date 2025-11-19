// Debug script to check localStorage state
// Run this in browser console to diagnose auth issues

console.log('=== Auth Debug Info ===');

// Check localStorage items
console.log('Token:', localStorage.getItem('token'));
console.log('User data:', localStorage.getItem('user'));
console.log('Username (legacy):', localStorage.getItem('username'));
console.log('Role (legacy):', localStorage.getItem('role'));

// Parse user object if exists
const userData = localStorage.getItem('user');
if (userData) {
  try {
    const user = JSON.parse(userData);
    console.log('Parsed user object:', user);
    console.log('- ID:', user.id);
    console.log('- Username:', user.username);
    console.log('- Role:', user.role);
  } catch (e) {
    console.error('Failed to parse user data:', e);
  }
} else {
  console.warn('No user data in localStorage!');
}

console.log('=== End Debug Info ===');

// To fix: Clear all auth data and re-login
// localStorage.clear();
// window.location.href = '/login';
