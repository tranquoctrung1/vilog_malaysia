const settings = require('../settings.json');

const hardwareId = require('../services/license/hardwareId');
const blpClient = require('../services/license/blpClient');
const verify = require('../services/license/verify');
const LicenseStateModel = require('../model/LicenseState');
const RouterConfigMiddleware = require('../middleware/routerConfig');

// license_type labels from BLP (app/models/license.py: LicenseType enum).
const LICENSE_TYPE_LABELS = {
    perpetual: 'Perpetual (one-time purchase, no expiry)',
    subscription: 'Subscription (renews periodically)',
    trial: 'Trial (time-limited)',
};

// Display name for each module code (the token only carries the code, not the name).
// Code list matches the routers mounted in this project's index.js.
const MODULE_LABELS = {
    map: 'Overview Map',
    pressureReport: 'Pressure Report',
    quantityReport: 'Quantity Report',
    tableDataCurrent: 'Current Data Table',
    dataHourLogger: 'Logger Data - Hourly',
    dataDayLogger: 'Logger Data - Daily',
    dataMonthLogger: 'Logger Data - Monthly',
    dataTableDetailLogger: 'Logger Data Detail',
    dataManual: 'Manual Data Entry',
    logger: 'Logger Management',
    siteConfig: 'Site Configuration',
    createUser: 'Create User',
    viewUser: 'View Users',
    viewStaff: 'View Staff',
    viewConsumer: 'View Consumers',
    permissionStaff: 'Staff Permissions',
    permissionConsumer: 'Consumer Permissions',
    dataOnline: 'Online Data',
    cameraOnline: 'Camera Online',
    dashboard: 'Dashboard',
    alarmLostWater: 'Water Loss Alarm',
    quantityHourForcast: 'Quantity Forecast - Hourly',
    quantityDayForcast: 'Quantity Forecast - Daily',
    quantityMonthForcast: 'Quantity Forecast - Monthly',
    detailAlarmLostWater: 'Water Loss Alarm Detail',
    dashboardTotal: 'Dashboard Total',
    dashboardVilog: 'Dashboard Vilog',
    dashboardLevel: 'Dashboard Water Level',
    historyAlarm: 'Alarm History',
    configVilog: 'Vilog Configuration',
    configTelegram: 'Telegram Configuration',
    configVilogTable: 'Vilog Table Configuration',
};

module.exports.activatePage = async function (req, res) {
    let hwId = '';

    try {
        hwId = await hardwareId.getOrCreateHardwareId();
    } catch (err) {
        console.log('[license] cannot read hardware id: ' + err.message);
    }

    res.render('license', {
        title: settings.title,
        companyName: settings.CompanyName,
        errorLicense: '',
        licenseKey: '',
        hardwareId: hwId,
    });
};

module.exports.activate = async function (req, res) {
    const licenseKey = (req.body.licenseKey || '').trim();

    let hwId = '';

    try {
        hwId = await hardwareId.getOrCreateHardwareId();
    } catch (err) {
        console.log('[license] cannot read hardware id: ' + err.message);
    }

    if (licenseKey.length === 0) {
        return res.render('license', {
            title: settings.title,
            companyName: settings.CompanyName,
            errorLicense: '(*) Please enter a license key',
            licenseKey: '',
            hardwareId: hwId,
        });
    }

    try {
        await blpClient.activate(licenseKey);

        return res.redirect('/');
    } catch (err) {
        return res.render('license', {
            title: settings.title,
            companyName: settings.CompanyName,
            errorLicense: '(*) Activation failed: ' + err.message,
            licenseKey: licenseKey,
            hardwareId: hwId,
        });
    }
};

// Trang thông tin license hiện tại - chỉ đọc, cần đăng nhập (mount kèm Auth.auth).
// Nút "Tải lại" trỏ về chính route này -> mỗi lần load đều heartbeat ngay (không đợi
// chu kỳ nền 15 phút), nên đổi module/ngày hết hạn/loại license trên BLP thấy cập nhật
// ngay thay vì phải restart app hoặc kích hoạt lại license key.
module.exports.infoPage = async function (req, res) {
    const content = await RouterConfigMiddleware.RouterConfig(req, res);

    await blpClient.heartbeat();

    const state = await LicenseStateModel.findOne({});

    let payload = null;
    let payloadError = '';

    if (state && state.signedToken) {
        try {
            payload = verify.verifyToken(state.signedToken);
        } catch (err) {
            payloadError = err.message;
        }
    }

    const fmt = (d) =>
        d ? new Date(d).toLocaleString('en-US') : 'Perpetual (no expiry)';
    const fmtDate = (d) =>
        d ? new Date(d).toLocaleDateString('en-US') : 'Perpetual';

    // Số ngày còn lại tới khi hết hạn + % thanh tiến trình (dựa trên khoảng issuedAt -> expiresAt).
    let daysLeft = null;
    let percentLeft = 100;

    if (payload && payload.expires_at) {
        const now = Date.now();
        const expiresMs = new Date(payload.expires_at).getTime();
        daysLeft = Math.max(0, Math.ceil((expiresMs - now) / 86400000));

        if (payload.issued_at) {
            const issuedMs = new Date(payload.issued_at).getTime();
            const totalDays = Math.max(
                1,
                Math.ceil((expiresMs - issuedMs) / 86400000),
            );
            percentLeft = Math.min(
                100,
                Math.max(0, Math.round((daysLeft / totalDays) * 100)),
            );
        }
    }

    res.render('licenseInfo', {
        title: settings.title,
        companyName: settings.CompanyName,
        username: req.cookies.username,
        content: content,
        hardwareId: state ? state.hardwareId : '',
        licenseKey: state ? state.licenseKey : '',
        lastSuccessAt:
            state && state.lastSuccessAt
                ? new Date(state.lastSuccessAt).toLocaleString('en-US')
                : 'Never contacted',
        lastError: state ? state.lastError : '',
        offlineGraceDays: state ? state.offlineGraceDays : '',
        hasToken: !!(state && state.signedToken),
        payload: payload,
        payloadError: payloadError,
        productCode: payload ? payload.product_code : '',
        licenseType: payload ? payload.license_type : '',
        licenseTypeLabel: payload
            ? LICENSE_TYPE_LABELS[payload.license_type] || payload.license_type
            : '',
        seats: payload ? payload.seats : '',
        moduleCodes: payload
            ? payload.module_codes && payload.module_codes.length > 0
                ? payload.module_codes.join(', ')
                : 'All'
            : '',
        moduleCodesList:
            payload && payload.module_codes
                ? [...new Set(payload.module_codes)].map((code) => ({
                      code: code,
                      name: MODULE_LABELS[code] || code,
                  }))
                : [],
        moduleCount:
            payload && payload.module_codes
                ? new Set(payload.module_codes).size
                : 0,
        issuedAt: payload ? fmt(payload.issued_at) : '',
        expiresAt: payload ? fmt(payload.expires_at) : '',
        expiresAtShort: payload ? fmtDate(payload.expires_at) : '',
        licenseId: payload ? payload.license_id : '',
        customerId: payload ? payload.customer_id : '',
        customerName: payload
            ? payload.customer_name || payload.customer_id || ''
            : '',
        daysLeft: daysLeft,
        percentLeft: percentLeft,
    });
};
