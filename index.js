require('dotenv').config();

const express = require('express');
const path = require('path');
const http = require('http');
const bodyParser = require('body-parser');
const reload = require('reload');
require('express-async-errors');
const session = require('express-session');
const socket = require('socket.io');
const cookieParser = require('cookie-parser');

const livereload = require('livereload');
const connectLiveReload = require('connect-livereload');

const cors = require('./middleware/cors');
const Auth = require('./middleware/auth');
const permissionPage = require('./middleware/permissionPage');

const mongoose = require('mongoose');

const app = express();

// connect mongodb
mongoose.connect(process.env.CONNECTION_STRING, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

// call router

const Map = require('./router/map');
const Login = require('./router/login');
const Logout = require('./router/logout');
const PressureReport = require('./router/pressureReport');
const QuantityReport = require('./router/quantityReport');
const TableDataCurrent = require('./router/tableDataCurrent');
const DataHourLogger = require('./router/dataHourLogger');
const DataDayLogger = require('./router/dataDayLogger');
const DataMonthLogger = require('./router/dataMonthLogger');
const DataTableDetailLogger = require('./router/dataTableDetailLogger');
const DataManual = require('./router/dataManual');
const Logger = require('./router/logger');
const SiteConfig = require('./router/siteConfig');
const CreateUser = require('./router/createUser');
const ViewUser = require('./router/viewUser');
const ViewStaff = require('./router/viewStaff');
const ViewConsumer = require('./router/viewConsumer');
const PermissionStaff = require('./router/permissionStaff');
const PermissionConsumer = require('./router/permissionConsumer');
const DataOnline = require('./router/dataOnline');
const CameraOnline = require('./router/cameraOnline');
const DashBoard = require('./router/dashBoard');
const AlarmLostWater = require('./router/lostWater');
const QuantityHourForcast = require('./router/quantityHourForcast');
const QuantityDayForcast = require('./router/quantityDayForcast');
const QuantityMonthForcast = require('./router/quantityMonthForcast');
const DetailAlarmLostWater = require('./router/detailAlarmLostWater');
const DashBoardTotal = require('./router/dashBoardTotal');
const DashBoardVilog = require('./router/dashboardVilog');
const HistoryAlarm = require('./router/historyAlarm');
const ConfigVilog = require('./router/configVilog');

// call api
const Api = require('./router/api/api');
const SWOCApi = require('./router/api/SWOCApi');

// app.set("trust proxy", 1); // trust first proxy
// app.use(
//   session({
//     secret: "keyboard cat",
//     resave: false,
//     saveUninitialized: true,
//     cookie: {
//       // secure: true
//     },
//     // 30 minutes to expire date
//     cookie: { maxAge: 60000 * 30 },
//   })
// );

const port = process.env.PORT || 3000;

app.use(express.json()); // for parsing application/json
app.use(express.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

if (process.env.NODE_ENV === 'dev') {
    // LiveReload server
    const liveReloadServer = livereload.createServer();
    liveReloadServer.watch(path.join(__dirname, 'views'));

    // Middleware
    app.use(connectLiveReload());
}

app.set('view engine', 'pug');

// use dependencies library
app.use(
    '/bootstrap',
    express.static(`${__dirname}/node_modules/bootstrap/dist`),
);
app.use('/jquery', express.static(`${__dirname}/node_modules/jquery/dist`));
app.use(
    '/popper',
    express.static(`${__dirname}/node_modules/popper.js/dist/umd`),
);
app.use('/axios', express.static(`${__dirname}/node_modules/axios/dist`));
app.use(
    '/amcharts4',
    express.static(`${__dirname}/node_modules/@amcharts/amcharts4`),
);

// use static file
app.use('/', express.static(path.join(__dirname, '/public')));

// use cors
app.use(cors);

// cal api router
app.use('/api', Api);

// call SWOC api
app.use('/SWOCApi', SWOCApi);

// use router
// app.use('/login', login);
app.use('/login', Login);
app.use('/', Auth.auth, Map);
app.use('/pressureReport', Auth.auth, PressureReport);
app.use('/quantityReport', Auth.auth, QuantityReport);
app.use('/tableDataCurrent', Auth.auth, TableDataCurrent);
app.use('/dataHourLogger', Auth.auth, DataHourLogger);
app.use('/dataDayLogger', Auth.auth, DataDayLogger);
app.use('/dataMonthLogger', Auth.auth, DataMonthLogger);
app.use('/dataTableDetailLogger', Auth.auth, DataTableDetailLogger);
app.use('/dataManual', Auth.auth, DataManual);
app.use('/logger', Auth.auth, Logger);
app.use('/siteConfig', Auth.auth, SiteConfig);
app.use('/createUser', Auth.auth, CreateUser);
app.use('/viewUser', Auth.auth, ViewUser);
app.use('/viewStaff', Auth.auth, ViewStaff);
app.use('/viewConsumer', Auth.auth, ViewConsumer);
app.use('/permissionStaff', Auth.auth, PermissionStaff);
app.use('/permissionConsumer', Auth.auth, PermissionConsumer);
app.use('/dataOnline', Auth.auth, DataOnline);
app.use('/cameraOnline', Auth.auth, CameraOnline);
app.use('/dashboard', Auth.auth, DashBoard);
app.use('/alarmLostWater', Auth.auth, AlarmLostWater);
app.use('/quantityHourForcast', Auth.auth, QuantityHourForcast);
app.use('/quantityDayForcast', Auth.auth, QuantityDayForcast);
app.use('/quantityMonthForcast', Auth.auth, QuantityMonthForcast);
app.use('/detailAlarmLostWater', Auth.auth, DetailAlarmLostWater);
app.use('/dashboardTotal', Auth.auth, DashBoardTotal);
app.use('/dashboardVilog', Auth.auth, DashBoardVilog);
app.use('/historyAlarm', Auth.auth, HistoryAlarm);
app.use('/configVilog', Auth.auth, ConfigVilog);

// log out
app.use('/logout', Logout);

// page not found
app.use(function (req, res) {
    res.render('404');
});

// other error
app.use(function (err, req, res, next) {
    console.log(err);
    res.status(500).render('500');
});

const server = http.createServer(app);

server.listen(port, () => {
    console.log(`App is running on port ${port}`);
});

if (process.env.NODE_ENV === 'dev') {
    // Reload when views change
    liveReloadServer.server.once('connection', () => {
        setTimeout(() => {
            liveReloadServer.refresh('/');
        }, 100);
    });
}
