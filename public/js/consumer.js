let modalFullNameConsumer = document.getElementById('modalFullNameConsumer');
let modalTelephoneConsumer = document.getElementById('modalTelephoneConsumer');
let modalAddressConsumer = document.getElementById('modalAddressConsumer');
let modalIdConsumer = document.getElementById('modalIdConsumer');

let urlGetConsumer = `${hostname}/GetConsumer`;
let urlGetConsumerById = `${hostname}/GetConsumerById`;
let urlGetConsumerByName = `${hostname}/GetConsumerByName`;
let urlInsertConsumer = `${hostname}/InsertConsumer`;
let urlUpdateConsumer = `${hostname}/UpdateConsumer`;
let urlDeleteConsumer = `${hostname}/DeleteConsumer`;

lbConsumerId.addEventListener('click', function (e) {
    rowStaff.style.display = 'none';
    rowConsumer.style.display = 'flex';

    $('#Model').modal('show');
    SetEmptyConsumer();
    GetComsumer();
});

function GetComsumer() {
    axios
        .get(urlGetConsumer)
        .then((res) => {
            createOptionsInStaffAndConsumerSelectBox(
                res.data,
                'modalFullNameConsumer',
            );
            new TomSelect('#modalFullNameConsumer', {
                create: true, // Disallow custom entries
                sortField: { field: 'text', direction: 'asc' },
                persist: false,
                selectOnTab: false, // ⛔ don't select on Tab or Enter
                preload: false,
            });
            createOptionsInStaffAndConsumerSelectBox(res.data, 'consumerId');
            consumerSelect = new TomSelect('#consumerId', {
                create: false, // Disallow custom entries
                sortField: { field: 'text', direction: 'asc' },
                persist: false,
                selectOnTab: false, // ⛔ don't select on Tab or Enter
                preload: false,
            });
        })
        .catch((err) => console.log(err));
}

function SetEmptyConsumer() {
    modalFullNameConsumer.value = '';
    modalTelephoneConsumer.value = '';
    modalAddressConsumer.value = '';
    modalIdConsumer.value = '';
}

function GetConsumerById(name) {
    let url = `${urlGetConsumerByName}/${name}`;

    axios
        .get(url)
        .then((res) => {
            if (res.data.length > 0) {
                modalFullNameConsumer.value = fillDataIntoInputTag(
                    res.data[0].FullName,
                );
                modalTelephoneConsumer.value = fillDataIntoInputTag(
                    res.data[0].Telephone,
                );
                modalAddressConsumer.value = fillDataIntoInputTag(
                    res.data[0].Adrress,
                );
                modalIdConsumer.value = fillDataIntoInputTag(res.data[0]._id);
            }
        })
        .catch((err) => console.log(err));
}

function modalFullNameConsumerChanged(e) {
    GetConsumerById(e.value);
}

function insertConsumer(e) {
    if (
        modalFullNameConsumer.value == null ||
        modalFullNameConsumer.value == undefined ||
        modalFullNameConsumer.value.trim() == ''
    ) {
        swal('Err', 'Fill fullname', 'error');
    } else {
        let url = `${urlInsertConsumer}/${CreateDataNullForPost(
            modalFullNameConsumer.value,
        )}/${CreateDataNullForPost(
            modalTelephoneConsumer.value,
        )}/${CreateDataNullForPost(
            modalAddressConsumer.value.replaceAll('/', '_'),
        )}`;

        axios
            .post(url)
            .then((res) => {
                if (res.data != 0) {
                    swal('Done', 'Add success', 'success');
                    modalIdConsumer.value = res.data;
                    GetComsumer();
                } else {
                    swal('Err', 'Add failed', 'error');
                }
            })
            .catch((err) => console.log(err));
    }
}

function updateConsumer(e) {
    if (
        modalFullNameConsumer.value == null ||
        modalFullNameConsumer.value == undefined ||
        modalFullNameConsumer.value.trim() == ''
    ) {
        swal('Err', 'Fill fullname', 'error');
    } else {
        let url = `${urlUpdateConsumer}/${CreateDataNullForPost(
            lbIdConsumer.value,
        )}/${CreateDataNullForPost(
            modalFullNameConsumer.value,
        )}/${CreateDataNullForPost(
            modalTelephoneConsumer.value,
        )}/${CreateDataNullForPost(
            modalAddressConsumer.value.replaceAll('/', '_'),
        )}`;

        axios
            .post(url)
            .then((res) => {
                if (res.data != 0) {
                    swal('Done', 'Update success', 'success');
                    GetComsumer();
                } else {
                    swal('Err', 'Update failed', 'error');
                }
            })
            .catch((err) => console.log(err));
    }
}

function deleteConsumer(e) {
    if (
        modalFullNameConsumer.value == null ||
        modalFullNameConsumer.value == undefined ||
        modalFullNameConsumer.value.trim() == ''
    ) {
        swal('Err', 'Not Full name', 'error');
    } else {
        let url = `${urlDeleteConsumer}/${CreateDataNullForPost(
            modalIdConsumer.value,
        )}`;

        axios
            .post(url)
            .then((res) => {
                if (res.data != 0) {
                    swal('Done', 'Delete success', 'success');
                    SetEmptyConsumer();
                    GetComsumer();
                } else {
                    swal('Err', 'Delete failed', 'error');
                }
            })
            .catch((err) => console.log(err));
    }
}
