import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { exportExcel } from './export';

interface HashInfo {
    len: number;
    md5: string;
}

function calcHash(filePath: string): HashInfo {
    const fileBuffer = fs.readFileSync(filePath);
    const hashSum = crypto.createHash('md5');
    hashSum.update(fileBuffer);
    return {
        len: fileBuffer.length,
        md5: hashSum.digest('hex'),
    }
};

const dir = process.argv.length > 2 ? process.argv[2] : '.';
if (!fs.existsSync(dir)) {
    console.error(`dir: ${dir} not exists`);
    process.exit(1);
}

const fileList = process.argv.slice(3);
if (fileList.length === 0) {
    for (const file of fs.readdirSync(dir)) {
        if (file.length > 5 && file.slice(-5).toLowerCase() === '.xlsx' && /[a-zA-Z]/.test(file.charAt(0))) {
            fileList.push(file);
        }
    }
}
for (const file of fileList) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (!stat.isFile()) {
        console.error(`${file} is not file`);
        process.exit(1);
    }
    if (!/^[a-z][a-z0-9_]*\.xlsx$/i.test(file)) {
        console.error(`Invalid file name: ${file}`);
        process.exit(1);
    }
}

const lockFilePath = path.join(dir, '__hash.json.lock');
let lockFileFd;
try {
    lockFileFd = fs.openSync(path.join(dir, '__hash.json.lock'), 'wx+');
} catch (e) {
    console.error(`Perhaps the previous run has not yet ended, ${e}`);
    process.exit(1);
}
process.on('exit', () => {
    fs.closeSync(lockFileFd);
    fs.unlinkSync(lockFilePath);
});

const hashFilePath = path.join(dir, '__hash.json');
let hashInfos: Record<string, HashInfo>;
try {
    const content = fs.readFileSync(hashFilePath, 'utf8');
    hashInfos = JSON.parse(content);
    if (typeof hashInfos !== 'object') {
        hashInfos = {};
    }
} catch {
    hashInfos = {};
}

const serverDir = path.join(dir, 'server');
if (!fs.existsSync(serverDir)) {
    fs.mkdirSync(serverDir);
}
const clientDir = path.join(dir,'client');
if (!fs.existsSync(clientDir)) {
    fs.mkdirSync(clientDir);
}

let count = 0;
for (const file of fileList) {
    const filePath = path.join(dir, file);
    const name = `${file.charAt(0).toUpperCase()}${file.slice(1, -5)}`;
    const hashInfo = calcHash(filePath);
    const info = hashInfos[name];
    if (info && info.len === hashInfo.len && info.md5 === hashInfo.md5) {
        console.info(`Skip excel: ${file}, content not changed`);
        continue;
    }

    try {
        exportExcel(name, filePath, serverDir, clientDir);
        console.log(`Export excel: ${file} success`);
    } catch (e) {
        console.error(`Export excel: ${file} failed, ${e}`);
        process.exit(1);
    }

    count++;
    hashInfos[name] = hashInfo;
}
fs.writeFileSync(hashFilePath, JSON.stringify(hashInfos, null, 4));
console.info(`All finished, ${count} excel files have been exported.`);
process.exit(0);