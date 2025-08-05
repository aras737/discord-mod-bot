from flask import Flask
import subprocess
import os

app = Flask(__name__)

# Node.js botu başlat
node_process = subprocess.Popen(["node", "index.js"])

@app.route('/')
def home():
    return "Bot aktif! Node.js süreci çalışıyor."

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 3000))
    app.run(host='0.0.0.0', port=port)
