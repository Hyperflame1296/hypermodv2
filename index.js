/** @format */
let http = require('node:http')
let fs = require('node:fs')
let path = require('node:path')

let mimeTypes = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.map': 'application/json',
    '.css': 'text/css',
    '.png': 'image/png',
    '.ico': 'image/x-icon',
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav'
}

let publicDir = path.join(__dirname, 'build') // serve from ./build

let server = http.createServer((req, res) => {
    // Normalize path
    let safePath = path.normalize(decodeURI(req.url)).replace(/^(\.\.[\/\\])+/, '')
    let filePath = path.join(publicDir, safePath)

    // If it's a directory, fall back to index.html
    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
        filePath = path.join(filePath, 'index.html')
    }
	
    fs.readFile(filePath, (err, content) => {
        if (err) {
            let fallback = path.join(publicDir, 'index.html');
            fs.readFile(fallback, (err2, content2) => {
                if (err2) {
                    res.writeHead(500, { 'Content-Type': 'text/plain' });
                    res.end('500 Internal Server Error');
                } else {
                    res.writeHead(200, {
                        'Content-Type': 'text/html',
                        'Cross-Origin-Embedder-Policy': 'require-corp',
                        'Cross-Origin-Opener-Policy': 'same-origin'
                    });
                    res.end(content2);
                }
            });
        } else {
            let ext = path.extname(filePath).toLowerCase()
            let type = mimeTypes[ext] || 'application/octet-stream'

            res.writeHead(200, {
                'Content-Type': type,
                'Cross-Origin-Embedder-Policy': 'require-corp',
                'Cross-Origin-Opener-Policy': 'same-origin'
            })
            res.end(content)
        }
    })
})

server.listen(8080, () => {
    console.log('Server running at http://localhost:8080')
})
