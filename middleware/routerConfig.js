const UserModel = require('../model/user');
const RouterConfigModel = require('../model/routerConfig');

module.exports.RouterConfig = async function (req, res) {
    let username = req.cookies.username;

    let result = await UserModel.find({ Username: username });

    let content = '';

    if (result.length > 0) {
        let dataRouter = await RouterConfigModel.find({ Role: result[0].Role });

        for (let item of dataRouter[0].Function) {
            let icon = '';
            let parent = '';

            if (item.Parent == 'Map') {
                content += `
            <li><a href="/"><i class="ti-map"></i> Map</a></li>`;
            } else if (item.Parent == 'Dashboard Vilog') {
                content += `
            <li><a href="/dashboardVilog"><i class="ti-dashboard"></i>Dashboard Vilog</a></li>`;
            } else if (item.Parent == 'HistoryAlarm') {
                content += `
        <li><a href="/historyAlarm"><i class="ti-bell"></i> History Alarm</a></li>`;
            } else if (item.Parent == 'DashBoard') {
                content += `
            <li><a href="/dashboard"><i class="ti-layers"></i> DashBoard</a></li>`;
            } else if (item.Parent == 'DashBoardTotal') {
                content += `
              <li><a href="/dashboardTotal"><i class="ti-layers"></i>DashBoard general</a></li>`;
            } else if (item.Parent == 'AlarmLostWater') {
                content += `
        <li><a href="/alarmLostWater"><i class="ti-bell"></i>Alarm water lost</a></li>`;
            } else if (item.Parent == 'ConfigVilog') {
                content += `
              <li><a href="/configVilog"><i class="ti-pencil-alt"></i>Config Vilog</a></li>`;
            } else {
                if (item.Parent == 'Forcast') {
                    icon = 'ti-pie-chart';
                    parent = 'Forcast';
                } else if (item.Parent == 'Report') {
                    icon = 'ti-server';
                    parent = 'Report';
                } else if (item.Parent == 'Data') {
                    icon = 'ti-layout-grid4-alt';
                    parent = 'Data';
                } else if (item.Parent == 'Device') {
                    icon = 'ti-desktop';
                    parent = 'Device';
                } else if (item.Parent == 'SiteConfig') {
                    icon = 'ti-desktop';
                    parent = 'Points';
                } else if (item.Parent == 'UserManager') {
                    icon = 'ti-user';
                    parent = 'Management User';
                } else if (item.Parent == 'Permission') {
                    icon = 'ti-layout-media-center-alt';
                    parent = 'Permission';
                } else if (item.Parent == 'Camera Online') {
                    icon = 'ti-video-camera';
                    parent = 'Camera Online';
                }

                // <li class="label">${parent}</li>
                content += `
                    <li><a class="sidebar-sub-toggle"><i class="${icon}"></i> ${parent}<span class="sidebar-collapse-icon ti-angle-down"></span></a>
                        <ul>`;
                for (let i of item.Children) {
                    content += `<li><a href="${i.url}">${i.name}</a></li>`;
                }
                content += `     </ul>
                    </li>`;
            }
        }
    } else {
        content = `
    <li><a href="/"><i class="ti-map"></i> Map</a></li>
    <li><a href="/dashboard"><i class="ti-layout-grid4-alt"></i> DashBoard</a></li>
    <li class="label">Report</li>
    <li><a class="sidebar-sub-toggle"><i class="ti-layout-grid4-alt"></i> Report<span class="sidebar-collapse-icon ti-angle-down"></span></a>
        <ul>
            <li><a href="/pressureReport">Pressure</a></li>
            <li><a href="/quantityReport/hour">Consumption Hourly</a></li>
            <li><a href="/quantityReport/day">Consumption Daily</a></li>
            <li><a href="/quantityReport/month">Consumption Monthly</a></li>
            <li><a href="/quantityReport/year">Consumption Yearly</a></li>
        </ul>
    </li>
    
    <li><a class="sidebar-sub-toggle"><i class="ti-layout-grid4-alt"></i>Data<span class="sidebar-collapse-icon ti-angle-down"></span></a>
        <ul>
            <li><a href="/tableDataCurrent">Data table view</a></li>
            <li><a href="/dataHourLogger">Logger data hourly</a></li>
            <li><a href="/dataDayLogger">Logger data daily</a></li>
            <li><a href="/dataMonthLogger">Logger data monthly</a></li>
            <li><a href="/dataTableDetailLogger">Detail Data Logger</a></li>
            <li><a href="/dataManual">Manual Data Entry</a></li>
        </ul>
    </li>
    <li><a class="sidebar-sub-toggle"><i class="ti-camera"></i> Camera Online<span class="sidebar-collapse-icon ti-angle-down"></span></a>
        <ul>
            <li><a href="/cameraOnline">Camera Online</a></li>
        </ul>
    </li>
    <li><a class="sidebar-sub-toggle"><i class="ti-desktop"></i> Device<span class="sidebar-collapse-icon ti-angle-down"></span></a>
        <ul>
            <li><a href="/logger">Logger</a></li>
        </ul>
    </li>
    
    <li><a class="sidebar-sub-toggle"><i class="ti-desktop"></i> Points<span class="sidebar-collapse-icon ti-angle-down"></span></a>
        <ul>
            <li><a href="/siteConfig">Points Config</a></li>
        </ul>
    </li>
    
    <li><a class="sidebar-sub-toggle"><i class="ti-user"></i> Management User<span class="sidebar-collapse-icon ti-angle-down"></span></a>
        <ul>
            <li><a href="/createUser">Create User</a></li>
            <li><a href="/viewUser">View User</a></li>
            <li><a href="/viewStaff">View Staff</a></li>
            <li><a href="/viewConsumer">View Consumer</a></li>
        </ul>
    </li>

    <li><a class="sidebar-sub-toggle"><i class="ti-layout-media-center-alt"></i> Permission<span class="sidebar-collapse-icon ti-angle-down"></span></a>
        <ul>
            <li><a href="/permissionStaff">Staff Permission</a></li>
            <li><a href="/permissionConsumer">Consumer Permission</a></li>
        </ul>
    </li>`;
    }

    return content;
};
