const fs = require('fs');
const path = require('path');

console.log('🔍 Deployment Verification Script');
console.log('================================');

// Check critical files
const criticalFiles = [
  'package.json',
  'tsconfig.json',
  'render.yaml',
  'server.ts',
  'dist/server.js'
];

console.log('\n📁 Checking critical files:');
criticalFiles.forEach(file => {
  const exists = fs.existsSync(file);
  console.log(`${exists ? '✅' : '❌'} ${file}`);
  
  if (exists && file === 'dist/server.js') {
    const stats = fs.statSync(file);
    console.log(`   Size: ${stats.size} bytes`);
  }
});

// Check package.json scripts
console.log('\n📦 Checking package.json scripts:');
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const requiredScripts = ['build', 'start', 'render-build', 'render-start'];
  
  requiredScripts.forEach(script => {
    const hasScript = packageJson.scripts && packageJson.scripts[script];
    console.log(`${hasScript ? '✅' : '❌'} ${script}: ${hasScript || 'MISSING'}`);
  });
} catch (error) {
  console.log('❌ Error reading package.json:', error.message);
}

// Check tsconfig.json
console.log('\n⚙️ Checking tsconfig.json:');
try {
  const tsconfig = JSON.parse(fs.readFileSync('tsconfig.json', 'utf8'));
  console.log(`✅ outDir: ${tsconfig.compilerOptions?.outDir || 'MISSING'}`);
  console.log(`✅ rootDir: ${tsconfig.compilerOptions?.rootDir || 'MISSING'}`);
  console.log(`✅ include: ${tsconfig.include?.join(', ') || 'MISSING'}`);
} catch (error) {
  console.log('❌ Error reading tsconfig.json:', error.message);
}

// Check render.yaml
console.log('\n🚀 Checking render.yaml:');
try {
  const renderYaml = fs.readFileSync('render.yaml', 'utf8');
  const hasBuildCommand = renderYaml.includes('buildCommand');
  const hasStartCommand = renderYaml.includes('startCommand');
  console.log(`${hasBuildCommand ? '✅' : '❌'} buildCommand configured`);
  console.log(`${hasStartCommand ? '✅' : '❌'} startCommand configured`);
} catch (error) {
  console.log('❌ Error reading render.yaml:', error.message);
}

// Test build process
console.log('\n🔨 Testing build process:');
try {
  const { execSync } = require('child_process');
  execSync('npm run build', { stdio: 'pipe' });
  console.log('✅ Build process completed successfully');
  
  // Check if dist/server.js was created
  if (fs.existsSync('dist/server.js')) {
    const stats = fs.statSync('dist/server.js');
    console.log(`✅ dist/server.js exists (${stats.size} bytes)`);
  } else {
    console.log('❌ dist/server.js not found after build');
  }
} catch (error) {
  console.log('❌ Build process failed:', error.message);
}

console.log('\n✨ Verification complete!');
