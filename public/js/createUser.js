let userName = document.getElementById('userName2');
let password = document.getElementById('password');
let email = document.getElementById('email');
let role = document.getElementById('role');
let staffId = document.getElementById('staffId');
let consumerId = document.getElementById('consumerId');
let id = document.getElementById('id');

let btnInsert = document.getElementById('btnInsert');
let btnUpdate = document.getElementById('btnUpdate');
let btnDelete = document.getElementById('btnDelete');

let urlGetRole = `${hostname}/GetRole`;
let urlGetUser = `${hostname}/GetUser`;
let urlGetUserById = `${hostname}/GetUserById`;
let urlGetUserByUserName = `${hostname}/GetUserByUserName`;
let urlCheckExistsUserName = `${hostname}/CheckExistsUserName`;
let urlInsertUser = `${hostname}/InsertUser`;
let urlUpdateUser = `${hostname}/UpdateUser`;
let urlDeleteUser = `${hostname}/DeleteUser`;

let roleSelect = null;
let staffSelect = null;
let consumerSelect = null;
let usernameSelect = null;

function GetRole() {
    axios
        .get(urlGetRole)
        .then((res) => {
            createOptionsInRoleSelectBox(res.data, 'role');
            roleSelect = new TomSelect('#role', {
                create: false, // Disallow custom entries
                sortField: { field: 'text', direction: 'asc' },
                persist: false,
                selectOnTab: false, // ⛔ don't select on Tab or Enter
                preload: false,
                maxOptions: null,
            });
        })
        .catch((err) => console.log(err));
}

function GetUser() {
    axios
        .get(urlGetUser)
        .then((res) => {
            if (usernameSelect !== null) {
                usernameSelect.destroy();
            }

            createOptionsInUserNameSelectBox(res.data, 'userName2');
            usernameSelect = new TomSelect('#userName2', {
                create: true, // Disallow custom entries
                sortField: { field: 'text', direction: 'asc' },
                persist: false,
                selectOnTab: false, // ⛔ don't select on Tab or Enter
                preload: false,
                maxOptions: null,
            });
        })
        .catch((err) => console.log(err));
}

function GetUserNameById(name) {
    let url = `${urlGetUserByUserName}/${name}`;

    axios
        .get(url)
        .then((res) => {
            if (res.data.length > 0) {
                userName.value = fillDataIntoInputTag(res.data[0].Username);
                //password.value = fillDataIntoInputTag(res.data[0].Password);
                email.value = fillDataIntoInputTag(res.data[0].Email);
                role.value = fillDataIntoInputTag(res.data[0].Role);
                roleSelect.setValue(res.data[0].Role);
                staffId.value = fillDataIntoInputTag(res.data[0].StaffId);
                staffSelect.setValue(res.data[0].StaffId);
                consumerId.value = fillDataIntoInputTag(res.data[0].ConsumerId);
                consumerSelect.setValue(res.data[0].ConsumerId);
                id.value = fillDataIntoInputTag(res.data[0]._id);
            }
        })
        .catch((err) => console.log(err));
}

async function CheckExistsUserName(name) {
    let url = `${urlGetUserByUserName}/${name}`;
    let result = await axios.get(url);

    if (result.data.length > 0) {
        swal('Err', 'Username already exists', 'error');
        return 0;
    } else {
        return 1;
    }
}

function SetEmptyUser() {
    userName.value = '';
    password.value = '';
    email.value = '';
    role.value = '';
    staffId.value = '';
    consumerId.value = '';
    id.value = '';
}

GetUser();
GetRole();
GetStaff();
GetComsumer();

userName.addEventListener('change', function (e) {
    GetUserNameById(e.target.value);
});

btnInsert.addEventListener('click', async function (e) {
    if (
        userName.value == null ||
        userName.value == undefined ||
        userName.value.trim() == ''
    ) {
        swal('Err', 'Username not entered', 'error');
    } else if (
        password.value == null ||
        password.value == undefined ||
        password.value.trim() == ''
    ) {
        swal('Err', 'Password not entered', 'error');
    } else {
        if ((await CheckExistsUserName(userName.value)) > 0) {
            let url = `${urlInsertUser}/${CreateDataNullForPost(
                userName.value,
            )}/${CreateDataNullForPost(password.value)}/${CreateDataNullForPost(
                email.value,
            )}/${CreateDataNullForPost(
                consumerId.value,
            )}/${CreateDataNullForPost(staffId.value)}/${CreateDataNullForPost(
                role.value,
            )}`;

            axios
                .post(url)
                .then((res) => {
                    if (res.data != 0) {
                        swal('Done', 'Add success', 'success');
                        id.value = res.data;
                        GetUser();
                    } else {
                        swal('Err', 'Add success', 'error');
                    }
                })
                .catch((err) => console.log(err));
        }
    }
});

btnUpdate.addEventListener('click', function (e) {
    if (
        userName.value == null ||
        userName.value == undefined ||
        userName.value.trim() == ''
    ) {
        swal('Err', 'Not null Username', 'error');
    } else if (
        password.value == null ||
        password.value == undefined ||
        password.value.trim() == ''
    ) {
        swal('Err', 'Not null Password', 'error');
    } else {
        let url = `${urlUpdateUser}/${CreateDataNullForPost(
            id.value,
        )}/${CreateDataNullForPost(userName.value)}/${CreateDataNullForPost(
            password.value,
        )}/${CreateDataNullForPost(email.value)}/${CreateDataNullForPost(
            consumerId.value,
        )}/${CreateDataNullForPost(staffId.value)}/${CreateDataNullForPost(
            role.value,
        )}`;

        axios
            .post(url)
            .then((res) => {
                if (res.data != 0) {
                    swal('Done', 'Update success', 'success');
                    GetUser();
                } else {
                    swal('Err', 'Update failed', 'error');
                }
            })
            .catch((err) => console.log(err));
    }
});

btnDelete.addEventListener('click', function (e) {
    if (
        userName.value == null ||
        userName.value == undefined ||
        userName.value.trim() == ''
    ) {
        swal('Err', 'Not null Username', 'error');
    } else {
        swal({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, delete it!',
        }).then((willDelete) => {
            if (willDelete) {
                let url = `${urlDeleteUser}/${CreateDataNullForPost(id.value)}`;
                axios
                    .post(url)
                    .then((res) => {
                        if (res.data != 0) {
                            swal('Done', 'Delete success', 'success');
                            SetEmptyUser();
                            GetUser();
                        } else {
                            swal('Err', 'Delete failed', 'error');
                        }
                    })
                    .catch((err) => console.log(err));
            }
        });
    }
});
