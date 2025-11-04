let lbDisplayGroup = document.getElementById('lbDisplayGroup');
let rowDisplayGroup = document.getElementById('rowDisplayGroup');
let rowLoggerId = document.getElementById('rowLoggerId');
let modalDisplayGroup = document.getElementById('modalDisplayGroup');
let modalNoteDisplayGroup = document.getElementById('modalNoteDisplayGroup');
let modalIdDisplayGroup = document.getElementById('modalIdDisplayGroup');

let urlGetDisplayGroup = `${hostname}/GetDisplayGroup`;
let urlGetDisplayGroupByGroup = `${hostname}/GetDisplayGroupByGroup`;
let urlInsertDisplayGroup = `${hostname}/InsertDisplayGroup`;
let urlUpdateDisplayGroup = `${hostname}/UpdateDisplayGroup`;
let urlDeleteDisplayGroup = `${hostname}/DeleteDisplayGroup`;

lbDisplayGroup.addEventListener('click', function (e) {
    rowLoggerId.style.display = 'none';
    rowDisplayGroup.style.display = 'flex';
    $('#Model').modal('show');
    fetchDisplayGroup();
});

function fetchDisplayGroup() {
    axios
        .get(urlGetDisplayGroup)
        .then((res) => {
            createOptionsInDisplayGroupSelectBox(res.data, 'modalDisplayGroup');
            new TomSelect('#modalDisplayGroup', {
                create: true, // Disallow custom entries
                sortField: { field: 'text', direction: 'asc' },
                persist: false,
                selectOnTab: false, // ⛔ don't select on Tab or Enter
                preload: false,
            });
        })
        .catch((err) => console.log(err));
}

function modalDisplayGroupChanged(e) {
    let url = `${urlGetDisplayGroupByGroup}/${e.value}`;
    axios
        .get(url)
        .then((res) => {
            if (CheckExistsData(res.data)) {
                modalNoteDisplayGroup.value = fillDataIntoInputTag(
                    res.data[0].Description,
                );
                modalIdDisplayGroup.value = fillDataIntoInputTag(
                    res.data[0]._id,
                );
            }
        })
        .catch((err) => console.log(err));
}

function SetEmptyDisplayGroup() {
    modalDisplayGroup.value = '';
    modalNoteDisplayGroup.value = '';
    modalIdDisplayGroup.value = '';
}

function insertDisplayGroup(e) {
    if (
        modalDisplayGroup.value == null ||
        modalDisplayGroup.value == undefined ||
        modalDisplayGroup.value.trim() == ''
    ) {
        swal('Error', 'Display group blank!!!!', 'error');
    } else {
        let url = `${urlInsertDisplayGroup}/${CreateDataNullForPost(
            modalDisplayGroup.value,
        )}/${CreateDataNullForPost(modalNoteDisplayGroup.value)}`;

        axios
            .post(url)
            .then((res) => {
                if (res.data != 0) {
                    swal('Success', 'Create display group success', 'success');
                    modalIdDisplayGroup.value = res.data;
                    fetchDisplayGroup();
                } else {
                    swal('Error', 'Create display group failed', 'error');
                }
            })
            .catch((err) => console.log(err));
    }
}

function updateDisplayGroup(e) {
    if (
        modalDisplayGroup.value == null ||
        modalDisplayGroup.value == undefined ||
        modalDisplayGroup.value.trim() == ''
    ) {
        swal('Error', 'Display group blank!!!!', 'error');
    } else {
        let url = `${urlUpdateDisplayGroup}/${CreateDataNullForPost(
            modalIdDisplayGroup.value,
        )}/${CreateDataNullForPost(
            modalDisplayGroup.value,
        )}/${CreateDataNullForPost(modalNoteDisplayGroup.value)}`;

        axios
            .post(url)
            .then((res) => {
                if (res.data != 0) {
                    swal('Success', 'Update display group success', 'success');
                    fetchDisplayGroup();
                } else {
                    swal('Error', 'Update display group failed', 'error');
                }
            })
            .catch((err) => console.log(err));
    }
}

function deleteDisplayGroup(e) {
    if (
        modalDisplayGroup.value == null ||
        modalDisplayGroup.value == undefined ||
        modalDisplayGroup.value.trim() == ''
    ) {
        swal('Error', 'Display group blank!!!!', 'error');
    } else {
        let url = `${urlDeleteDisplayGroup}/${CreateDataNullForPost(
            modalIdDisplayGroup.value,
        )}`;

        axios
            .post(url)
            .then((res) => {
                if (res.data != 0) {
                    swal('Success', 'Delete display group success', 'success');
                    SetEmptyDisplayGroup();
                    fetchDisplayGroup();
                } else {
                    swal('Error', 'Delete display group failed', 'error');
                }
            })
            .catch((err) => console.log(err));
    }
}
