console.log('--- ENV KEYS ---');
for (const key of Object.keys(process.env)) {
  if (key.includes('DATABASE') || key.includes('URL') || key.includes('PORT') || key.includes('POSTGRES') || key.includes('USER')) {
    console.log(`${key}: ${process.env[key]}`);
  }
}
console.log('-----------------');
