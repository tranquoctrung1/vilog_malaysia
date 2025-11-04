let lbLoggerId = document.getElementById('lbLoggerId');

let modalLoggerId = document.getElementById('modalLoggerId');
let modalChannelId = document.getElementById('modalChannelId');
let modalChannelName = document.getElementById('modalChannelName');
let modalUnit = document.getElementById('modalUnit');
let modalBaseMin = document.getElementById('modalBaseMin');
let modalBaseMax = document.getElementById('modalBaseMax');
let modalBaseLine = document.getElementById('modalBaseLine');
let modalBatThreshold = document.getElementById('modalBatThreshold');
let modalIdChannelConfig = document.getElementById('modalIdChannelConfig');
let modalPressure1 = document.getElementById('modalPressure1');
let modalPressure2 = document.getElementById('modalPressure2');
let modalForwardFlow = document.getElementById('modalForwardFlow');
let modalReverseFlow = document.getElementById('modalReverseFlow');
let modalBatSolarChannel = document.getElementById('modalBatSolarChannel');
let modalBatMetterChannel = document.getElementById('modalBatMetterChannel');
let modalBatLoggerChannel = document.getElementById('modalBatLoggerChannel');
let modalOtherChannel = document.getElementById('modalOtherChannel');
let listModalChannelId = document.getElementById('listModalChannelId');
let modalFromHour = document.getElementById('modalFromHour');
let modalToHour = document.getElementById('modalToHour');

let urlGetAllChannel = `${hostname}/GetAllChannel`;
let urlGetChannelByChannelId = `${hostname}/GetChannelByChannelId`;
let urlInsertChannelConfig = `${hostname}/InsertChannelConfig`;
let urlUpdateChannelConfig = `${hostname}/UpdateChannelConfig`;
let urlDeleteChannelConfig = `${hostname}/DeleteChannelConfig`;

lbLoggerId.addEventListener('click', function (e) {
    rowDisplayGroup.style.display = 'none';
    rowLoggerId.style.display = 'flex';
    $('#Model').modal('show');
    modalLoggerId.value = loggerId.value;
    SetEmptyChannelConfigNotLoggerId();
    fetchAllChannel();
});

function fetchAllChannel() {
    let url = `${urlGetAllChannel}/${modalLoggerId.value}`;

    axios
        .get(url)
        .then((res) => {
            if (res.data.length > 0) {
                createOptionsInChannelConfigSelectBox(
                    res.data,
                    'modalChannelId',
                );
                new TomSelect('#modalChannelId', {
                    create: true, // Disallow custom entries
                    sortField: { field: 'text', direction: 'asc' },
                    persist: false,
                    selectOnTab: false, // ⛔ don't select on Tab or Enter
                    preload: false,
                });
            }
        })
        .catch((err) => console.log(error));
}

function modalChannelIdChanged(e) {
    let url = `${urlGetChannelByChannelId}/${e.value}`;
    axios
        .get(url)
        .then((res) => {
            if (res.data.length > 0) {
                modalLoggerId.value = fillDataIntoInputTag(
                    res.data[0].LoggerId,
                );
                modalChannelId.value = fillDataIntoInputTag(
                    res.data[0].ChannelId,
                );
                modalChannelName.value = fillDataIntoInputTag(
                    res.data[0].ChannelName,
                );
                modalUnit.value = fillDataIntoInputTag(res.data[0].Unit);
                modalBaseLine.value = fillDataIntoInputTag(
                    res.data[0].BaseLine,
                );
                modalBaseMax.value = fillDataIntoInputTag(res.data[0].BaseMax);
                modalBaseMin.value = fillDataIntoInputTag(res.data[0].BaseMin);
                modalBatThreshold.value = fillDataIntoInputTag(
                    res.data[0].BatThreshold,
                );
                modalPressure2.checked = res.data[0].Pressure2;
                modalPressure1.checked = res.data[0].Pressure1;
                modalForwardFlow.checked = res.data[0].ForwardFlow;
                modalReverseFlow.checked = res.data[0].ReverseFlow;
                modalBatSolarChannel.checked = res.data[0].BatSolarChannel;
                modalBatMetterChannel.checked = res.data[0].BatMetterChannel;
                modalBatLoggerChannel.checked = res.data[0].BatLoggerChannel;
                modalOtherChannel.checked = res.data[0].OtherChannel;
                modalFromHour.value = fillDataIntoInputTag(
                    res.data[0].FromHour,
                );
                modalToHour.value = fillDataIntoInputTag(res.data[0].ToHour);
                modalIdChannelConfig.value = fillDataIntoInputTag(
                    res.data[0]._id,
                );
            }
        })
        .catch((err) => console.log(error));
}

function SetEmptyChannelConfigNotLoggerId() {
    modalChannelId.value = '';
    modalChannelName.value = '';
    modalUnit.value = '';
    modalBaseLine.value = '';
    modalBaseMax.value = '';
    modalBaseMin.value = '';
    modalBatThreshold.value = '';
    modalPressure2.checked = false;
    modalPressure1.checked = false;
    modalForwardFlow.checked = false;
    modalReverseFlow.checked = false;
    modalBatSolarChannel.checked = false;
    modalBatMetterChannel.checked = false;
    modalBatLoggerChannel.checked = false;
    modalOtherChannel.checked = false;
    modalFromHour.value = '';
    modalToHour.value = '';
}

function insertChannelConfig(e) {
    if (
        modalChannelId.value == null ||
        modalChannelId.value == undefined ||
        modalChannelId.value.trim() == ''
    ) {
        swal('Err', 'Not Channel Code', 'error');
    } else if (
        modalChannelName.value == null ||
        modalChannelName.value == undefined ||
        modalChannelName.value.trim() == ''
    ) {
        swal('Err', 'Not Channel Name!', 'error');
    }
    // else if (modalChannelName.value.length > 6) {
    //   swal("Lỗi", "Tên kênh không quá 6 ký tự", "error");
    // }
    else {
        const obj = {
            ChannelId: CreateDataNullForPost(modalChannelId.value),
            LoggerId: CreateDataNullForPost(modalLoggerId.value),
            ChannelName: CreateDataNullForPost(modalChannelName.value),
            Unit: CreateDataNullForPost(modalUnit.value),
            Pressure1: modalPressure1.checked,
            Pressure2: modalPressure2.checked,
            ForwardFlow: modalForwardFlow.checked,
            ReverseFlow: modalReverseFlow.checked,
            BaseLine: CreateDataNullForPost(modalBaseLine.value),
            BaseMin: CreateDataNullForPost(modalBaseMin.value),
            BaseMax: CreateDataNullForPost(modalBaseMax.value),
            OtherChannel: modalOtherChannel.checked,
            BatThreshold: CreateDataNullForPost(modalBatThreshold.value),
            BatSolarChannel: modalBatSolarChannel.checked,
            BatMetterChannel: modalBatMetterChannel.checked,
            BatLoggerChannel: modalBatLoggerChannel.checked,
            FromHour: CreateDataNullForPost(modalFromHour.value),
            ToHour: CreateDataNullForPost(modalToHour.value),
        };

        let url = `${urlInsertChannelConfig}`;

        axios
            .post(url, obj)
            .then((res) => {
                if (res.data != 0) {
                    swal('Success', 'Add success', 'success');
                    modalIdChannelConfig.value = res.data;
                    fetchAllChannel();
                } else {
                    swal('Err', 'Add failed', 'error');
                }
            })
            .catch((err) => console.log(err));
    }
}

function UpdateChannelConfig(e) {
    if (
        modalChannelId.value == null ||
        modalChannelId.value == undefined ||
        modalChannelId.value.trim() == ''
    ) {
        swal('Err', 'Not channel code', 'error');
    } else if (
        modalChannelName.value == null ||
        modalChannelName.value == undefined ||
        modalChannelName.value.trim() == ''
    ) {
        swal('Err', 'Not channel name', 'error');
    }
    //else if (modalChannelName.value.length > 6) {
    //swal("Lỗi", "Tên kênh không quá 6 ký tự", "error");
    //}
    else {
        const obj = {
            id: CreateDataNullForPost(modalIdChannelConfig.value),
            ChannelId: CreateDataNullForPost(modalChannelId.value),
            LoggerId: CreateDataNullForPost(modalLoggerId.value),
            ChannelName: CreateDataNullForPost(modalChannelName.value),
            Unit: CreateDataNullForPost(modalUnit.value),
            Pressure1: modalPressure1.checked,
            Pressure2: modalPressure2.checked,
            ForwardFlow: modalForwardFlow.checked,
            ReverseFlow: modalReverseFlow.checked,
            BaseLine: CreateDataNullForPost(modalBaseLine.value),
            BaseMin: CreateDataNullForPost(modalBaseMin.value),
            BaseMax: CreateDataNullForPost(modalBaseMax.value),
            OtherChannel: modalOtherChannel.checked,
            BatThreshold: CreateDataNullForPost(modalBatThreshold.value),
            BatSolarChannel: modalBatSolarChannel.checked,
            BatMetterChannel: modalBatMetterChannel.checked,
            BatLoggerChannel: modalBatLoggerChannel.checked,
            FromHour: CreateDataNullForPost(modalFromHour.value),
            ToHour: CreateDataNullForPost(modalToHour.value),
        };

        let url = `${urlUpdateChannelConfig}`;

        axios
            .post(url, obj)
            .then((res) => {
                if (res.data != 0) {
                    swal('Success', 'Update success', 'success');
                    fetchAllChannel();
                } else {
                    swal('err', 'Update failed', 'error');
                }
            })
            .catch((err) => console.log(err));
    }
}

function DeleteChannelConfig(e) {
    if (
        modalChannelId.value == null ||
        modalChannelId.value == undefined ||
        modalChannelId.value.trim() == ''
    ) {
        swal('Err', 'Not channel code', 'error');
    } else {
        const obj = {
            id: CreateDataNullForPost(modalIdChannelConfig.value),
            ChannelId: CreateDataNullForPost(modalChannelId.value),
        };

        let url = `${urlDeleteChannelConfig}`;

        axios
            .post(url, obj)
            .then((res) => {
                if (res.data != 0) {
                    swal('Success', 'Delete success', 'success');
                    SetEmptyChannelConfigNotLoggerId();
                    fetchAllChannel();
                } else {
                    swal('Err', 'Delete failed', 'error');
                }
            })
            .catch((err) => console.log(err));
    }
}
