const express = require('express');
const router = express.Router();

const Auth = require('../middleware/auth');
const license = require('../controller/license');

router.get('/activate', license.activatePage);
router.post('/activate', license.activate);

// Trang thông tin license: cần đăng nhập, KHÔNG áp dụng cho /license/activate
// (không thể bắt đăng nhập trước khi license được kích hoạt).
// Chỉ admin xem được (staff/consumer bị chặn).
router.get('/info', Auth.auth, Auth.requireAdmin, license.infoPage);

module.exports = router;
