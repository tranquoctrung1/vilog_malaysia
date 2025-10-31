const express = require('express');
const router = express.Router();

const TokenController = require('../../controller/api/token');
const SiteController = require('../../controller/api/site');
const ChannelConfigController = require('../../controller/api/channel');
const DataLoggerController = require('../../controller/api/dataLogger');
const Auth = require('../../middleware/auth');

router.post('/getToken', TokenController.getToken);

router.post('/insertToken', TokenController.InsertDeviceTokenApp);

router.get(
    '/GetSiteSWOC',
    Auth.verifyAccessToken,
    SiteController.GetSiteForSWOC,
);

router.get(
    '/GetChannelConfigSWOC',
    Auth.verifyAccessToken,
    ChannelConfigController.GetChannelConfigSWOC,
);

router.get(
    '/GetLastDataChannelConfigSWOC',
    Auth.verifyAccessToken,
    ChannelConfigController.GetLastDataChannelConfigSWOC,
);

router.get(
    '/GetDataLoggerSWOC',
    Auth.verifyAccessToken,
    DataLoggerController.GetDataLoggerByTimeStampSWOC,
);

router.get(
    `/GetChannels`,
    Auth.verifyAccessToken,
    ChannelConfigController.GetChannelsSWOC,
);

module.exports = router;
