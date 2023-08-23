const { execSync } = require('child_process');
const path = require('path');

const appPath = path.resolve(__dirname, "../fixture");

try {
  process.chdir(appPath);
  execSync('npm install', { stdio: 'inherit' });
  execSync('npm run postinstall', { stdio: 'inherit' });
} catch (error) {
  console.error ('Error:', error.message);
}