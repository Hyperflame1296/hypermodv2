let http = require('node:http')
let fs = require('node:fs')
let path = require('node:path')
console.clear()
let mimeTypes = {
    '.html': 'text/html',
    '.htm': 'text/html',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.map': 'application/json',
    '.css': 'text/css',
    '.png': 'image/png',
    '.ico': 'image/x-icon',
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav'
}

let publicDir = './dist/'
let port = 8080

let server = http.createServer((req, res) => {
    try {
        let dist = path.join(publicDir, req.url)
        let root = path.join('./', req.url)
        if (fs.existsSync(dist) && !fs.statSync(dist).isDirectory()) {
            fs.readFile(dist, (err, content) => {
                if (err) {
                    res.writeHead(500, { 
                        'Content-Type': 'text/html',
                        'Cross-Origin-Embedder-Policy': 'require-corp',
                        'Cross-Origin-Opener-Policy': 'same-origin'
                    })
                    res.end(`<style>body { background-color: #121212 } * { color: white; font-family: monospace }</style><i style='color: red'>ERROR</i> - 500 - Internal server error!<br>${err.toString().replaceAll('\n', '<br>')}`)
                } else {
                    let ext = path.extname(req.url).toLowerCase()
                    res.writeHead(200, { 
                        'Content-Type': mimeTypes[ext] ?? 'application/octet-stream',
                        'Cross-Origin-Embedder-Policy': 'require-corp',
                        'Cross-Origin-Opener-Policy': 'same-origin'
                    })
                    res.end(content)
                }
            })
        } else if (fs.existsSync(root) && !fs.statSync(root).isDirectory()) {
            fs.readFile(root, (err, content) => {
                if (err) {
                    res.writeHead(500, { 
                        'Content-Type': 'text/html',
                        'Cross-Origin-Embedder-Policy': 'require-corp',
                        'Cross-Origin-Opener-Policy': 'same-origin'
                    })
                    res.end(`<style>body { background-color: #121212 } * { color: white; font-family: monospace }</style><i style='color: red'>ERROR</i> - 500 - Internal server error!<br>${err.toString().replaceAll('\n', '<br>')}`)
                } else {
                    let ext = path.extname(root).toLowerCase()
                    res.writeHead(200, { 
                        'Content-Type': mimeTypes[ext] ?? 'application/octet-stream',
                        'Cross-Origin-Embedder-Policy': 'require-corp',
                        'Cross-Origin-Opener-Policy': 'same-origin'
                    })
                    res.end(content)
                }
            })
        } else {
            fs.readFile(path.join(publicDir, 'index.html'), (err, content) => {
                if (err) {
                    res.writeHead(500, { 
                        'Content-Type': 'text/html',
                        'Cross-Origin-Embedder-Policy': 'require-corp',
                        'Cross-Origin-Opener-Policy': 'same-origin'
                    })
                    res.end(`<style>body { background-color: #121212 } * { color: white; font-family: monospace }</style><i style='color: red'>ERROR</i> - 500 - Internal server error!<br>${err.toString().replaceAll('\n', '<br>')}`)
                } else {
                    res.writeHead(200, { 
                        'Content-Type': 'text/html',
                        'Cross-Origin-Embedder-Policy': 'require-corp',
                        'Cross-Origin-Opener-Policy': 'same-origin'
                    })
                    res.end(content)
                }
            })
        }
    } catch (err) {
        res.writeHead(500, { 
            'Content-Type': 'text/html',
            'Cross-Origin-Embedder-Policy': 'require-corp',
            'Cross-Origin-Opener-Policy': 'same-origin'
        })
        res.end(`<style>body { background-color: #121212 } * { color: white; font-family: monospace }</style><i style='color: red'>ERROR</i> - 500 - Internal server error!<br>${err.toString().replaceAll('\n', '<br>')}`)
    }
})

server.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`)
})
