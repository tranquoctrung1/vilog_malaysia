const axios = require('axios');
const os = require('os');

const LicenseStateModel = require('../../model/LicenseState');
const hardwareId = require('./hardwareId');

const HEARTBEAT_INTERVAL_MS = 15 * 60 * 1000; // 15 phút

let heartbeatTimer = null;

function blpUrl(pathname) {
    const base = (process.env.BLP_URL || '').replace(/\/+$/, '');

    return `${base}${pathname}`;
}

function authHeaders() {
    return {
        'X-API-Key': process.env.PRODUCT_API_KEY,
        'Content-Type': 'application/json',
    };
}

function errorMessage(err) {
    if (err && err.response && err.response.data) {
        const data = err.response.data;

        if (typeof data === 'string') {
            return data;
        }

        return data.detail || data.message || JSON.stringify(data);
    }

    return err && err.message ? err.message : 'Unknown error';
}

// POST /api/v1/activation/activate
// Ném lỗi khi thất bại (controller hiển thị lại form kèm thông báo).
module.exports.activate = async function (licenseKey) {
    const hwId = await hardwareId.getOrCreateHardwareId();

    const body = {
        license_key: licenseKey,
        hardware_id: hwId,
        hostname: os.hostname(),
        os_info: `${os.type()} ${os.release()} ${os.arch()}`,
    };

    try {
        const response = await axios.post(
            blpUrl('/api/v1/activation/activate'),
            body,
            { headers: authHeaders() },
        );

        const data = response.data || {};

        await LicenseStateModel.updateOne(
            { hardwareId: hwId },
            {
                licenseKey: licenseKey,
                hardwareId: hwId,
                signedToken: data.signed_token,
                // BLP xoay session_id sau mỗi activate/heartbeat -> phải lưu DB,
                // nếu chỉ giữ trong RAM thì restart app sẽ mất và heartbeat 409 vĩnh viễn.
                sessionId: data.session_id || null,
                expiresAt: data.expires_at ? new Date(data.expires_at) : null,
                offlineGraceDays: data.offline_grace_days || 0,
                lastSuccessAt: new Date(),
                lastError: null,
            },
            { upsert: true },
        );

        return data;
    } catch (err) {
        const message = errorMessage(err);

        await LicenseStateModel.updateOne(
            { hardwareId: hwId },
            { hardwareId: hwId, lastError: message },
            { upsert: true },
        );

        throw new Error(message);
    }
};

// POST /api/v1/activation/heartbeat
// Chạy nền theo timer -> KHÔNG throw, chỉ ghi lastError.
module.exports.heartbeat = async function () {
    try {
        const state = await LicenseStateModel.findOne({});

        if (!state || !state.licenseKey || !state.hardwareId) {
            return false;
        }

        const body = {
            license_key: state.licenseKey,
            hardware_id: state.hardwareId,
            // Đọc thẳng từ document vừa load, KHÔNG fallback sang hardwareId:
            // session_id sai sẽ bị BLP trả 409 mãi mãi, còn null nghĩa là "chưa có phiên".
            session_id: state.sessionId || null,
        };

        const response = await axios.post(
            blpUrl('/api/v1/activation/heartbeat'),
            body,
            { headers: authHeaders() },
        );

        const data = response.data || {};

        // BLP xoay session_id ở MỌI lần heartbeat (kể cả khi license đã bị thu hồi),
        // nên luôn lưu lại giá trị mới trước khi xét status.
        const set = {};

        if (data.session_id !== undefined) {
            set.sessionId = data.session_id || null;
        }

        // License bị thu hồi/hết hạn/tạm ngưng: BLP trả HTTP 200 kèm status != 'active'
        // và signed_token = null -> phải chặn ngay, không coi là heartbeat thành công.
        if (data.status && data.status !== 'active') {
            set.lastError = data.status;

            await LicenseStateModel.updateOne(
                { _id: state._id },
                { $set: set, $unset: { signedToken: '' } },
            );

            console.log('[license] heartbeat status: ' + data.status);

            return false;
        }

        set.lastSuccessAt = new Date();
        set.lastError = null;

        if (data.signed_token) {
            set.signedToken = data.signed_token;
        }

        if (data.expires_at) {
            set.expiresAt = new Date(data.expires_at);
        }

        if (data.offline_grace_days !== undefined) {
            set.offlineGraceDays = data.offline_grace_days;
        }

        await LicenseStateModel.updateOne({ _id: state._id }, { $set: set });

        return true;
    } catch (err) {
        const message = errorMessage(err);

        console.log('[license] heartbeat failed: ' + message);

        try {
            await LicenseStateModel.updateOne({}, { lastError: message });
        } catch (dbErr) {
            console.log('[license] cannot save lastError: ' + dbErr.message);
        }

        return false;
    }
};

// Gọi 1 lần từ index.js sau khi kết nối MongoDB thành công.
module.exports.startHeartbeat = function () {
    if (heartbeatTimer) {
        return heartbeatTimer;
    }

    module.exports.heartbeat();

    heartbeatTimer = setInterval(
        module.exports.heartbeat,
        HEARTBEAT_INTERVAL_MS,
    );

    console.log('[license] heartbeat scheduled every 15 minutes');

    return heartbeatTimer;
};

module.exports.HEARTBEAT_INTERVAL_MS = HEARTBEAT_INTERVAL_MS;
