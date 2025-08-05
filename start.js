// start.js
const { spawn } = require('child_process');

function startBot() {
  const botProcess = spawn('node', ['index.js'], { stdio: 'inherit' });

  botProcess.on('close', (code) => {
    console.log(`Bot kapandı (kod: ${code}), 5 saniye sonra yeniden başlatılıyor...`);
    setTimeout(startBot, 5000);
  });

  botProcess.on('error', (err) => {
    console.error('Bot process hatası:', err);
  });
}

startBot();
