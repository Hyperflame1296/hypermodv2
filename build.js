const { error } = require('node:console');
let fs = require('node:fs');
let path = require('node:path');
let terser = require('terser');
let color = require('cli-color')
let srcDir = './client';
let outDir = './build';
function ensureDirSync(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}
let tag = `${color.whiteBright('[') + color.cyanBright('Compiler') + color.whiteBright(']')} - `
let settings = {
    module: false,
    sourceMap: false,
    compress: true,
    mangle: true,
    parse: {},
    rename: true
}
function processDir(src, dest) {
    ensureDirSync(dest);
    for (let entry of fs.readdirSync(src, { withFileTypes: true })) {
        let srcPath = path.join(src, entry.name);
        let destPath = path.join(dest, entry.name);
        if (entry.isDirectory()) {
            processDir(srcPath, destPath);
        } else if (entry.isFile() && entry.name.endsWith('.js')) {
            let code = fs.readFileSync(srcPath, 'utf-8');
            terser.minify({ [entry.name]: code }, settings).then(res => {
                fs.writeFile(destPath, res.code, 'utf-8', err => {
                    if (err)
                        throw err
                    console.log(tag + `${color.greenBright(srcPath.replaceAll('\\', '/'))} ${color.white('->')} ${color.greenBright(destPath.replaceAll('\\', '/'))} ${color.white('|')} ${color.cyanBright('Minified!')}`);
                });
            });
        } else {
            // Copy non-JS files directly if you want
            fs.copyFile(srcPath, destPath, err => {
                if (err)
                    throw err
            });
        }
    }
}

// Run
processDir(srcDir, outDir);