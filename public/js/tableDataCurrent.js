let userName = document.getElementById('userName').innerHTML;
if (userName == null || userName == undefined || userName.trim() == '') {
    userName = 'admin';
}

let urlGetTabledDataCurrent = `${hostname}/GetTableDataCurrent/${userName}`;

let dataElement = document.getElementById('data');
let loadingElement = document.getElementById('loading');
let reload = document.getElementById('reload');
let loadMoreButton = document.getElementById('loadMoreButton');
let search = document.getElementById('searchInfo');

let startPage = 0;
let totalPage;

let totalData = [];

loadMoreButton.classList.add('hide');

function GetData() {
    let url = `${urlGetTabledDataCurrent}`;

    axios
        .get(url)
        .then((res) => {
            totalData = res.data;
            totalPage = Math.ceil(res.data.length / 12);

            loadingElement.classList.add('hide');
            loadingElement.classList.remove('show');

            dataElement.insertAdjacentHTML(
                'beforeend',
                createTable(totalData, startPage),
            );

            if (totalPage > 1) {
                loadMoreButton.classList.remove('hide');
                loadMoreButton.classList.add('show');
            }
        })
        .catch((err) => console.log(err));
}

function createTable(data, startPage) {
    let content = '';
    if (CheckExistsData(data)) {
        for (let item of [
            ...data.slice(startPage * 12, (startPage + 1) * 12),
        ]) {
            let colorCard = `normal`;
            if (item.isDelay === true) {
                colorCard = `delay`;
            } else {
                if (item.isError === true) {
                    colorCard = `error`;
                }
            }

            console.log(item);

            content += `<div class="col-md-6 col-lg-6 col-xl-4">
                <div class="card card-${colorCard} text-dark bg-light mb-3">
                    <div class="card-header card-header-${colorCard}">
                        <span>SiteId</span>
                        <span class="bolder">${ConvertDataIntoTable(
                            item.SiteId,
                        )}</span>
                    </div>
                    <div class="card-body">
                        <div class="content-card  mt-3 location">
                            <p>Location</p>
                            <p class="bolder">${ConvertDataIntoTable(
                                item.Location,
                            )}</p>
                        </div>
                        ${createListChannel(item.ListChannel, item.TypeMeter)}
                    </div>
                </div>
            </div>`;

            // <div class="content-card">
            //     <p>LoggerId</p>
            //     <p class="bolder">${ConvertDataIntoTable(
            //       item.LoggerId
            //     )}</p>
            // </div>
        }
    }

    return content;
}

function createTableForSearch(data) {
    let content = '';
    if (CheckExistsData(data)) {
        for (let item of data) {
            let colorCard = `normal`;
            if (item.isDelay === true) {
                colorCard = `delay`;
            } else {
                if (item.isError === true) {
                    colorCard = `error`;
                }
            }

            content += `<div class="col-md-6 col-lg-6 col-xl-4">
                <div class="card card-${colorCard} text-dark bg-light mb-3">
                    <div class="card-header card-header-${colorCard}">
                        <span>SiteId</span>
                        <span class="bolder">${ConvertDataIntoTable(
                            item.SiteId,
                        )}</span>
                    </div>
                    <div class="card-body">
                        <div class="content-card  mt-3 location">
                            <p>Location</p>
                            <p class="bolder">${ConvertDataIntoTable(
                                item.Location,
                            )}</p>
                        </div>
                        
                        ${createListChannel(item.ListChannel, item.TypeMeter)}
                    </div>
                </div>
            </div>`;

            // <div class="content-card">
            //     <p>LoggerId</p>
            //     <p class="bolder">${ConvertDataIntoTable(
            //       item.LoggerId
            //     )}</p>
            // </div>
        }
    }

    return content;
}

function createListChannel(data, typeMeter) {
    let content = '';
    if (data != null) {
        for (let item of data) {
            let colorText = `normal`;
            if (item.isDelay === true) {
                colorText = `delay`;
            } else {
                if (item.isError === true) {
                    colorText = `error`;
                }
            }

            let value = item.Value;
            if (typeMeter === 'SU') {
                if (item.ChannelName[0] === '1') {
                    if (value === 0) {
                        value = 'No';
                    } else {
                        value = 'Yes';
                    }
                }
            } else if (typeMeter === 'Kronhe') {
                if (item.ChannelName[0] === '6' || item.OtherChannel === true) {
                    if (value <= 0) {
                        value = 'No error';
                    } else if (value === 1) {
                        value = ' Flow measurement ';
                    } else if (value === 2) {
                        value = ' < 10% battery ';
                    } else if (value === 4) {
                        value = ' EEPROM error ';
                    } else if (value === 8) {
                        value = ' Communication error ';
                    } else if (value === 16) {
                        value = ' Empty pipe';
                    } else if (value === 32) {
                        value = 'Mains power failure ';
                    }
                }
            }

            content += ` <div class="content-card row channel">
                        <div class="bolder col-5 value-${colorText}">${ConvertDataIntoTable(
                item.ChannelName,
            )}</div>
                        <div class="bolder col-4 value-${colorText}">${convertDateToString(
                convertDateFromApi(item.TimeStamp),
            )}</div>
                        <div class="bolder value col-3 value-${colorText}">${ConvertDataIntoTable(
                value,
            )} <span>${ConvertDataIntoTable(item.Unit)}</span> </div>
                    </div>`;
        }
    }

    return content;
}

reload.addEventListener('click', function () {
    startPage = 0;
    dataElement.innerHTML = '';
    // hide button is first
    loadMoreButton.classList.add('hide');
    dataElement.insertAdjacentHTML(
        'beforeend',
        createTable(totalData, startPage),
    );
    // show button when load all data
    loadingElement.classList.add('hide');
    loadingElement.classList.remove('show');
    if (totalPage > 1) {
        loadMoreButton.classList.remove('hide');
        loadMoreButton.classList.add('show');
    }
});

function onLoadmoreClick() {
    startPage += 1;
    dataElement.insertAdjacentHTML(
        'beforeend',
        createTable(totalData, startPage),
    );
    if (startPage == totalPage) {
        loadMoreButton.classList.add('hide');
        loadMoreButton.classList.remove('show');
    }
}

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

search.addEventListener(
    'keyup',
    debounce(function (e) {
        let data = totalData.filter(
            (item) =>
                item.Location.toLowerCase().indexOf(
                    e.target.value.toLowerCase(),
                ) !== -1,
        );
        loadMoreButton.classList.add('hide');
        loadMoreButton.classList.remove('show');
        dataElement.innerHTML = createTableForSearch(data);
    }),
    1000,
);

GetData();
