import * as terser from 'terser'
import fs from 'node:fs'
import path from 'node:path'
import color from 'cli-color'
let srcDir = './dist';
let outDir = './dist';
function ensureDirSync(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}
console.clear()
let tag = `${color.whiteBright('[') + color.cyanBright('Compiler') + color.whiteBright(']')} - `
let settings = {
    module: false,
    compress: {},
    mangle: true,
    parse: {},
    rename: true
}
let exclusions = ['_hmBindings.js'];
function processDir(src, dest) {
    ensureDirSync(dest);
    for (let entry of fs.readdirSync(src, { withFileTypes: true })) {
        let srcPath = path.join(src, entry.name);
        let destPath = path.join(dest, entry.name);
        if (entry.isDirectory()) {
            processDir(srcPath, destPath);
        } else if (entry.isFile() && entry.name.endsWith('.js') && !exclusions.includes(entry.name)) {
            let code = fs.readFileSync(srcPath, 'utf-8');
            terser.minify({ [entry.name]: code }, settings).then(res => {
                if (!res.code)
                    return
                fs.writeFile(destPath, res.code, 'utf-8', err => {
                    if (err)
                        throw err
                    console.log(tag + `${color.greenBright(srcPath.replaceAll('\\', '/'))} ${color.white('->')} ${color.greenBright(destPath.replaceAll('\\', '/'))} ${color.white('|')} ${color.cyanBright('Minified!')}`);
                });
            });
        } else {
            if (srcPath !== destPath)
                fs.copyFile(srcPath, destPath, err => {
                    if (err)
                        throw err
                });
        }
    }
}

// Run
if (srcDir !== outDir)
    fs.rmSync(outDir, { recursive: true, force: true })
processDir(srcDir, outDir);