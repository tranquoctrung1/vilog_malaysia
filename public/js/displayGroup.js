let lbDisplayGroup = document.getElementById("lbDisplayGroup");
let rowDisplayGroup = document.getElementById("rowDisplayGroup");
let rowLoggerId = document.getElementById("rowLoggerId");
let modalDisplayGroup = document.getElementById("modalDisplayGroup");
let modalNoteDisplayGroup = document.getElementById("modalNoteDisplayGroup");
let modalIdDisplayGroup = document.getElementById("modalIdDisplayGroup");

let urlGetDisplayGroup = `${hostname}/GetDisplayGroup`;
let urlGetDisplayGroupByGroup = `${hostname}/GetDisplayGroupByGroup`;
let urlInsertDisplayGroup = `${hostname}/InsertDisplayGroup`;
let urlUpdateDisplayGroup = `${hostname}/UpdateDisplayGroup`;
let urlDeleteDisplayGroup = `${hostname}/DeleteDisplayGroup`;

lbDisplayGroup.addEventListener("click", function (e) {
  rowLoggerId.style.display = "none";
  rowDisplayGroup.style.display = "flex";
  $("#Model").modal("show");
  fetchDisplayGroup();
});

function fetchDisplayGroup() {
  axios
    .get(urlGetDisplayGroup)
    .then((res) => {
      createOptionsInDisplayGroupSelectBox(res.data, "listModalDisplayGroup");
    })
    .catch((err) => console.log(err));
}

function modalDisplayGroupChanged(e) {
  let url = `${urlGetDisplayGroupByGroup}/${e.value}`;
  axios
    .get(url)
    .then((res) => {
      if (CheckExistsData(res.data)) {
        console.log(res.data);
        modalNoteDisplayGroup.value = fillDataIntoInputTag(
          res.data[0].Description
        );
        modalIdDisplayGroup.value = fillDataIntoInputTag(res.data[0]._id);
      }
    })
    .catch((err) => console.log(err));
}

function SetEmptyDisplayGroup() {
  modalDisplayGroup.value = "";
  modalNoteDisplayGroup.value = "";
  modalIdDisplayGroup.value = "";
}

function insertDisplayGroup(e) {
  if (
    modalDisplayGroup.value == null ||
    modalDisplayGroup.value == undefined ||
    modalDisplayGroup.value.trim() == ""
  ) {
    swal("Lỗi", "Chưa có hiển thị", "error");
  } else {
    let url = `${urlInsertDisplayGroup}/${CreateDataNullForPost(
      modalDisplayGroup.value
    )}/${CreateDataNullForPost(modalNoteDisplayGroup.value)}`;

    axios
      .post(url)
      .then((res) => {
        if (res.data != 0) {
          swal("Thành công", "Thêm thành công", "success");
          modalIdDisplayGroup.value = res.data;
          fetchDisplayGroup();
        } else {
          swal("Lỗi", "Thêm không thành công", "error");
        }
      })
      .catch((err) => console.log(err));
  }
}

function updateDisplayGroup(e) {
  if (
    modalDisplayGroup.value == null ||
    modalDisplayGroup.value == undefined ||
    modalDisplayGroup.value.trim() == ""
  ) {
    swal("Lỗi", "Chưa có hiển thị", "error");
  } else {
    let url = `${urlUpdateDisplayGroup}/${CreateDataNullForPost(
      modalIdDisplayGroup.value
    )}/${CreateDataNullForPost(
      modalDisplayGroup.value
    )}/${CreateDataNullForPost(modalNoteDisplayGroup.value)}`;

    axios
      .post(url)
      .then((res) => {
        if (res.data != 0) {
          swal("Thành công", "Cập nhật thành công", "success");
          fetchDisplayGroup();
        } else {
          swal("Lỗi", "Cập nhật không thành công", "error");
        }
      })
      .catch((err) => console.log(err));
  }
}

function deleteDisplayGroup(e) {
  if (
    modalDisplayGroup.value == null ||
    modalDisplayGroup.value == undefined ||
    modalDisplayGroup.value.trim() == ""
  ) {
    swal("Lỗi", "Chưa có hiển thị", "error");
  } else {
    let url = `${urlDeleteDisplayGroup}/${CreateDataNullForPost(
      modalIdDisplayGroup.value
    )}`;

    axios
      .post(url)
      .then((res) => {
        if (res.data != 0) {
          swal("Thành công", "Xóa thành công", "success");
          SetEmptyDisplayGroup();
          fetchDisplayGroup();
        } else {
          swal("Lỗi", "Xóa không thành công", "error");
        }
      })
      .catch((err) => console.log(err));
  }
}
