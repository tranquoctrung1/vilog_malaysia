let userName = document.getElementById('userName').innerHTML;
if (userName == null || userName == undefined || userName.trim() == '') {
    userName = 'admin';
}
let urlGetSites = `${hostname}/GetSiteByUId/${userName}`;

const site = document.getElementById('site');

let currentAction = '';

function fetchSites() {
    axios
        .get(urlGetSites)
        .then((res) => {
            createOptionsSiteAndLoggerIdInSelectBox(res.data, 'listSite');
        })
        .catch((err) => console.log(err));
}

fetchSites();

function updateModbusClicked() {
    let loggerid = site.value;

    if (loggerid == null || loggerid == undefined || loggerid.trim() == '') {
        swal('Error', 'Device id not found', 'error');
    } else if (
        currentAction == null ||
        currentAction == undefined ||
        currentAction.trim() == ''
    ) {
        swal('Error', 'Config not found', 'error');
    } else {
        const valueAction = document.getElementById(`${currentAction}`);

        postModbusConfig(valueAction.value, currentAction, loggerid);
    }
}

function postModbusConfig(value, currentAction, loggerid) {
    if (value == null || value == undefined || value.trim() == '') {
        swal('Error', 'Value config not found', 'error');
    } else {
        let action = '';
        if (currentAction === 'tdc') {
            action = 'AT+TDC=';
        } else if (currentAction === 'ser') {
            action = 'AT+SERVADDR=';
        } else if (currentAction === 'bau') {
            action = 'AT+BAUDR=';
        } else if (currentAction === 'bit') {
            action = 'AT+DATABIT=';
        } else if (currentAction === 'par') {
            action = 'AT+PARITY=';
        } else if (currentAction === 'stop') {
            action = 'AT+STOPBIT=';
        } else if (currentAction === 'client') {
            action = 'AT+CLIENT=';
        } else if (currentAction === 'pub') {
            action = 'AT+PUBTOPIC=';
        } else if (currentAction === 'sup') {
            action = 'AT+SUBTOPIC=';
        }

        const obj = {
            loggerid: loggerid,
            cmd: action,
            command: value,
        };

        const url = `${hostnameConfigVilog}/configModbus`;
        axios
            .post(url, obj)
            .then((res) => {
                if (res.data != 0) {
                    swal('Success', 'Config success', 'success');
                } else {
                    swal('Error', 'Config error', 'error');
                }
            })
            .catch((err) => {
                swal('Error', 'Config error', 'error');
                console.error(err);
            });
    }
}

function onActionChanged(e) {
    const action = e.value;

    currentAction = action;

    const col = document.getElementById(`col-${action}`);
    const functionEls = document.getElementsByClassName('function');

    for (let i = 0; i < functionEls.length; i++) {
        functionEls[i].classList.add('d-none');
    }

    col.classList.remove('d-none');
}
