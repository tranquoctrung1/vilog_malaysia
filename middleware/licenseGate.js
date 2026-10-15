const LicenseStateModel = require('../model/LicenseState');
const verify = require('../services/license/verify');

const MS_PER_DAY = 24 * 60 * 60 * 1000;

// Cổng license: chạy TRƯỚC mọi router khác trong index.js.
// Fail closed - mọi lỗi bất ngờ đều chuyển hướng về trang kích hoạt.
module.exports.licenseGate = async function (req, res, next) {
    try {
        // Trang kích hoạt luôn đi qua, nếu không sẽ redirect vòng lặp vô hạn.
        if (req.path === '/license' || req.path.indexOf('/license/') === 0) {
            return next();
        }

        const state = await LicenseStateModel.findOne({});

        if (!state || !state.signedToken) {
            return res.redirect('/license/activate');
        }

        // Chữ ký sai / token hỏng / thiếu public key -> ném lỗi -> chặn.
        const payload = verify.verifyToken(state.signedToken);

        const now = new Date();

        // Token phát cho máy khác bị chép sang đây -> chặn.
        if (payload.hardware_id !== state.hardwareId) {
            return res.redirect('/license/activate');
        }

        // Lấy hạn từ payload đã xác thực chữ ký, KHÔNG dùng state.expiresAt
        // (field DB thuần, ai sửa được DB là gia hạn được license).
        // payload.expires_at === null nghĩa là license perpetual (không hết hạn).
        if (payload.expires_at) {
            const expiresAt = new Date(payload.expires_at);

            if (isNaN(expiresAt.getTime()) || now > expiresAt) {
                return res.redirect('/license/activate');
            }
        }

        // Hết hạn ân hạn offline: heartbeat lỗi quá offlineGraceDays ngày.
        // Chặn dưới 1 ngày: đặt 0 sẽ tạo vòng lặp redirect ngay sau khi kích hoạt thành công,
        // dù heartbeat chạy mỗi 15 phút (services/license/blpClient.js).
        const graceDays = Math.max(state.offlineGraceDays || 0, 1);

        if (!state.lastSuccessAt) {
            return res.redirect('/license/activate');
        }

        const offlineDays =
            (now.getTime() - state.lastSuccessAt.getTime()) / MS_PER_DAY;

        if (offlineDays > graceDays) {
            return res.redirect('/license/activate');
        }

        return next();
    } catch (err) {
        console.log('[license] gate blocked request: ' + err.message);

        return res.redirect('/license/activate');
    }
};
