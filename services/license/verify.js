const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Khi chạy bản đóng gói (pkg -> dist/app.exe), __dirname trỏ vào snapshot chỉ đọc
// nên phải đọc key từ thư mục chứa file exe để người dùng tự thay được key thật.
const APP_ROOT = process.pkg
    ? path.dirname(process.execPath)
    : path.join(__dirname, '../..');

const PUBLIC_KEY_PATH = path.join(APP_ROOT, 'keys/license_public.pem');

let publicKeyObject = null;

// Đọc public key Ed25519 (copy từ keys/license_public.pem của BLP server).
// Cache lại sau lần đọc đầu; ném lỗi nếu thiếu file hoặc file rỗng/không hợp lệ.
function loadPublicKey() {
    if (publicKeyObject) {
        return publicKeyObject;
    }

    if (!fs.existsSync(PUBLIC_KEY_PATH)) {
        throw new Error(
            'License public key not found: ' +
                PUBLIC_KEY_PATH +
                ' (xem keys/README.md)',
        );
    }

    const pem = fs.readFileSync(PUBLIC_KEY_PATH, 'utf8');

    if (!pem || pem.trim().length === 0) {
        throw new Error(
            'License public key is empty: ' +
                PUBLIC_KEY_PATH +
                ' (xem keys/README.md)',
        );
    }

    publicKeyObject = crypto.createPublicKey(pem);

    return publicKeyObject;
}

// base64url -> Buffer, tự bù ký tự '=' cho đủ bội số 4.
function base64UrlDecode(value) {
    if (typeof value !== 'string' || value.length === 0) {
        throw new Error('Malformed license token: empty segment');
    }

    let base64 = value.replace(/-/g, '+').replace(/_/g, '/');

    while (base64.length % 4 !== 0) {
        base64 += '=';
    }

    return Buffer.from(base64, 'base64');
}

// Token format: base64url(payload) + '.' + base64url(signature)
// Xác thực chữ ký trên đúng chuỗi byte payload đã giải mã (KHÔNG JSON.stringify lại,
// vì chữ ký được ký trên byte gốc do BLP sinh ra).
module.exports.verifyToken = function (signedToken) {
    if (typeof signedToken !== 'string' || signedToken.length === 0) {
        throw new Error('Malformed license token: token is empty');
    }

    const parts = signedToken.split('.');

    if (parts.length !== 2) {
        throw new Error('Malformed license token: expected 2 segments');
    }

    const payloadBytes = base64UrlDecode(parts[0]);
    const signatureBytes = base64UrlDecode(parts[1]);

    const key = loadPublicKey();

    const ok = crypto.verify(null, payloadBytes, key, signatureBytes);

    if (!ok) {
        throw new Error('Invalid license token signature');
    }

    return JSON.parse(payloadBytes.toString('utf8'));
};

module.exports.PUBLIC_KEY_PATH = PUBLIC_KEY_PATH;
