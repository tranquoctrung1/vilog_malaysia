// global variable
let config = document.getElementById('config');
let settingChannel = document.getElementById('settingChannel');
let filter = document.getElementById('filter');
let dataForTreeSite = [];
let dataFilter = [];

config.addEventListener('click', function (event) {
    if ($('#panel').hasClass('d-none')) {
        $('#panel').removeClass('d-none');
        $('#panel').slideDown('slow');
    } else {
        $('#panel').slideToggle('slow');
    }
    $('#treeViewSite').addClass('d-block');
    $('#treeViewSite').removeClass('d-none');
    $('#filterSite').addClass('d-none');

    $('#filterSite').removeClass('d-block');
    $('#config').toggleClass('expanse');
    $('#settingChannel').removeClass('expanse');
    $('#filter').removeClass('expanse');
});

// settingChannel.addEventListener("click", function () {
//   $("#panel").slideToggle("slow");
//   $("#config").removeClass("expanse");
//   $("#settingChannel").toggleClass("expanse");
//   $("#filter").removeClass("expanse");
// });

filter.addEventListener('click', function () {
    if ($('#panel').hasClass('d-none')) {
        $('#panel').removeClass('d-none');
        $('#panel').slideDown('slow');
    } else {
        $('#panel').slideToggle('slow');
    }
    $('#treeViewSite').addClass('d-none');
    $('#treeViewSite').removeClass('d-block');
    $('#filterSite').addClass('d-block');
    $('#filterSite').removeClass('d-none');

    $('#config').removeClass('expanse');
    $('#settingChannel').removeClass('expanse');
    $('#filter').toggleClass('expanse');
});

async function getDataForListtree() {
    let dataPayload = [];

    let site = await axios.get(urlGetSiteByUid);
    for (let s of site.data) {
        let index = 0;
        let hasDisplayGroup = false;
        let obj = {};
        if (dataPayload.length != 0) {
            for (let item of dataPayload) {
                if (item.hasOwnProperty('DisplayGroup')) {
                    if (s.DisplayGroup == item.DisplayGroup) {
                        hasDisplayGroup = true;
                        break;
                    } else {
                        index += 1;
                    }
                }
            }
            if (!hasDisplayGroup == true) {
                obj.DisplayGroup = s.DisplayGroup;
                obj.data = [];
            }
        } else {
            obj.DisplayGroup = s.DisplayGroup;
            obj.data = [];
        }

        let logger;

        if (
            s.LoggerId != null &&
            s.LoggerId != undefined &&
            s.LoggerId.trim() != ''
        ) {
            logger = s.LoggerId.trim();
        } else {
            logger = 'nothing';
        }

        let channels = await axios.get(urlGetChannels + logger);
        if (hasDisplayGroup == true) {
            if (channels.data.length > 0) {
                let obj2 = {};
                obj2.name = s.SiteId;
                obj2.location = s.Location;
                obj2.data = [];

                for (let item of channels.data) {
                    obj2.data.push({
                        ChannelName: item.ChannelName,
                        ChannelId: item.ChannelId,
                    });
                }
                dataPayload[index].data.push(obj2);
            }
        } else {
            if (channels.data.length > 0) {
                let obj2 = {};
                obj2.name = s.SiteId;
                obj2.location = s.Location;
                obj2.data = [];

                for (let item of channels.data) {
                    obj2.data.push({
                        ChannelName: item.ChannelName,
                        ChannelId: item.ChannelId,
                    });
                }
                obj.data.push(obj2);
                dataPayload.push(obj);
            }
        }
    }
    dataForTreeSite = [...dataPayload];
    createFilterSite(dataForTreeSite);
    createListtree(dataPayload);
}

getDataForListtree();

function createListtree(data) {
    let listSite = document.getElementById('listSite');

    listSite.innerHTML = '';

    let content = '';
    if (CheckExistsData(data)) {
        content += `<ul class="listree">`;

        for (let item of data) {
            content += `<li><div class="listree-submenu-heading">${item.DisplayGroup}</div><ul class="listree-submenu-items">`;
            for (let id of item.data) {
                content += `<li><div class="listree-submenu-heading" data-site="${id.name}" onclick="openMarker(this)">${id.location}</div><ul class="listree-submenu-items">`;

                for (let i of id.data) {
                    if (i.ChannelName != 'SLN') {
                        content += `<li><span> &nbsp&nbsp </span><input class="form-check-input" type="checkbox" data-location="${id.name}" id="${i.ChannelId}" onChange="onChangeInputChannel(this)"></input><a href="javascript: void(0);" data-channelid="${i.ChannelId}" draggable="true" ondragstart="drag(event)">${i.ChannelName}</a></li>`;
                    } else {
                        content += `<li><span> &nbsp&nbsp </span><a href="javascript: void(0);" data-channelid="${i.ChannelId}" draggable="true" ondragstart="drag(event)">${i.ChannelName}</a></li>`;
                    }
                }
                content += `</ul></li>`;
            }
            content += `</ul></li>`;
        }
        content += `</ul>`;
    }

    listSite.innerHTML = content;

    listree();
}

// let expan = document.getElementById('expan');

// expan.addEventListener('click', function (e) {
//     let expanNode = document.getElementsByClassName('listree-submenu-heading');
//     let submenu = document.getElementsByClassName('listree-submenu-items');

//     if (!e.target.classList.contains('expanded')) {
//         for (element of expanNode) {
//             element.classList.add('expanded');
//             element.classList.remove('collapsed');
//         }

//         for (el of submenu) {
//             el.style.display = 'block';
//         }

//         e.target.src = '/images/collap-icon.png';

//         e.target.classList.add('expanded');
//     } else {
//         for (element of expanNode) {
//             element.classList.remove('expanded');
//             element.classList.add('collapsed');
//         }

//         for (el of submenu) {
//             el.style.display = 'none';
//         }
//         e.target.src = '/images/expan-icon.png';

//         e.target.classList.remove('expanded');
//     }
// });

let searchSite = document.getElementById('searchSite');

function debounce(func, wait, immediate) {
    var timeout;
    return function () {
        var context = this,
            args = arguments;
        var later = function () {
            timeout = null;
            if (!immediate) func.apply(context, args);
        };
        var callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func.apply(context, args);
    };
}

function resetExpanede() {
    //let e = document.getElementById('expan');
    let expanNode = document.getElementsByClassName('listree-submenu-heading');
    let submenu = document.getElementsByClassName('listree-submenu-items');

    for (const element of expanNode) {
        if (element.dataset.site === undefined) {
            element.classList.remove('collapsed');
            element.classList.add('expanded');
        } else {
            element.classList.remove('expanded');
            element.classList.add('collapsed');
        }
    }

    for (const el of submenu) {
        el.style.display = 'block';
    }

    // if (!e.classList.contains('expanded')) {
    //     for (element of expanNode) {
    //         element.classList.add('expanded');
    //         element.classList.remove('colapsed');
    //     }

    //     for (el of submenu) {
    //         el.style.display = 'block';
    //     }

    //     e.src = '/images/collap-icon.png';

    //     e.classList.add('expanded');
    // }
}

searchSite.addEventListener(
    'keyup',
    debounce(function (e) {
        dataFilter = [];
        if (e.target.value.trim() == '') {
            dataFilter = [...dataForTreeSite];
        } else {
            for (let item of dataForTreeSite) {
                let siteFilter = item.data.filter(function (ev) {
                    return (
                        ev.location
                            .toString()
                            .toLowerCase()
                            .indexOf(e.target.value.toString().toLowerCase()) !=
                        -1
                    );
                });

                if (siteFilter.length > 0) {
                    let temp = { ...item };
                    temp.data = siteFilter;
                    dataFilter.push(temp);
                }
            }
        }
        createListtree(dataFilter);
        //resetExpanede();
        //expan.click();
    }, 1000),
);

// drag and drop
function allowDrop(ev) {
    ev.preventDefault();
}

function drag(ev) {
    ev.dataTransfer.setData('text', ev.target.dataset.channelid);
}

function drop(ev) {
    ev.preventDefault();
    var data = ev.dataTransfer.getData('text');
}

function createFilterSite() {
    let filterSite = document.getElementById('filterSiteSub');

    filterSite.innerHTML = '';

    let content = '';

    for (let item of dataForTreeSite) {
        let siteid = '';
        for (let i of item.data) {
            siteid += `m_${i.name}|`;
        }

        content += `<div class="form-check">
    <input class="form-check-input" type="checkbox" value="${siteid}" id="${item.DisplayGroup}" onChange="onFilterChange(this)" checked>
    <label class="form-check-label" for="${item.DisplayGroup}">
    ${item.DisplayGroup}
    </label>
  </div>`;
    }
    filterSite.innerHTML = content;
}

function onFilterChange(e) {
    let sites = e.value.split('|');
    for (let site of sites) {
        if (e.checked == true) {
            for (let marker of markers) {
                if (site == marker.options.id) {
                    map.addLayer(marker);
                }
            }
        } else {
            for (let marker of markers) {
                if (site == marker.options.id) {
                    map.removeLayer(marker);
                }
            }
        }
    }
}
