let lbStaffId = document.getElementById("lbStaffId");
let lbConsumerId = document.getElementById("lbConsumerId");
let rowConsumer = document.getElementById("rowConsumer");
let rowStaff = document.getElementById("rowStaff");

let modalFullNameStaff = document.getElementById("modalFullNameStaff");
let modalTelephoneStaff = document.getElementById("modalTelephoneStaff");
let modalAddressStaff = document.getElementById("modalAddressStaff");
let modalIdStaff = document.getElementById("modalIdStaff");

let urlGetStaff = `${hostname}/GetStaff`;
let urlGetStaffById = `${hostname}/GetStaffById`;
let urlGetStaffByName = `${hostname}/GetStaffByName`;
let urlInsertStaff = `${hostname}/InsertStaff`;
let urlUpdateStaff = `${hostname}/UpdateStaff`;
let urlDeleteStaff = `${hostname}/DeleteStaff`;

lbStaffId.addEventListener("click", function (e) {
  rowConsumer.style.display = "none";
  rowStaff.style.display = "flex";

  $("#Model").modal("show");

  SetEmptyStaff();
  GetStaff();
});

function GetStaff() {
  axios
    .get(urlGetStaff)
    .then((res) => {
      createOptionsInStaffAndConsumerSelectBox(
        res.data,
        "listModalFullNameStaff"
      );
      createOptionsInStaffAndConsumerSelectBox(res.data, "listStaffId");
    })
    .catch((err) => console.log(err));
}

function SetEmptyStaff() {
  modalFullNameStaff.value = "";

  modalTelephoneStaff.value = "";

  modalAddressStaff.value = "";

  modalIdStaff.value = "";
}

function GetStaffById(name) {
  let url = `${urlGetStaffByName}/${name}`;

  axios
    .get(url)
    .then((res) => {
      if (res.data.length > 0) {
        modalFullNameStaff.value = fillDataIntoInputTag(res.data[0].FullName);
        modalTelephoneStaff.value = fillDataIntoInputTag(res.data[0].Telephone);
        modalAddressStaff.value = fillDataIntoInputTag(res.data[0].Adrress);
        modalIdStaff.value = fillDataIntoInputTag(res.data[0]._id);
      }
    })
    .catch((err) => console.log(err));
}

function modalFullNameStaffChanged(e) {
  GetStaffById(e.value);
}

function insertStaff(e) {
  if (
    modalFullNameStaff.value == null ||
    modalFullNameStaff.value == undefined ||
    modalFullNameStaff.value.trim() == ""
  ) {
    swal("Err", "Not null fullname", "error");
  } else {
    let url = `${urlInsertStaff}/${CreateDataNullForPost(
      modalFullNameStaff.value
    )}/${CreateDataNullForPost(
      modalTelephoneStaff.value
    )}/${CreateDataNullForPost(modalAddressStaff.value.replaceAll("/", "_"))}`;

    console.log(url);
    axios
      .post(url)
      .then((res) => {
        if (res.data != 0) {
          swal("Done", "Add success", "success");
          modalIdStaff.value = res.data;
          GetStaff();
        } else {
          swal("Err", "Add failed", "error");
        }
      })
      .catch((err) => console.log(err));
  }
}

function updateStaff(e) {
  if (
    modalFullNameStaff.value == null ||
    modalFullNameStaff.value == undefined ||
    modalFullNameStaff.value.trim() == ""
  ) {
    swal("Err", "Not null fullname", "error");
  } else {
    let url = `${urlUpdateStaff}/${CreateDataNullForPost(
      modalIdStaff.value
    )}/${CreateDataNullForPost(
      modalFullNameStaff.value
    )}/${CreateDataNullForPost(
      modalTelephoneStaff.value
    )}/${CreateDataNullForPost(modalAddressStaff.value.replaceAll("/", "_"))}`;

    axios
      .post(url)
      .then((res) => {
        if (res.data != 0) {
          swal("Done", "update success", "success");
          GetStaff();
        } else {
          swal("Err", "Update failed", "error");
        }
      })
      .catch((err) => console.log(err));
  }
}

function deleteStaff(e) {
  if (
    modalFullNameStaff.value == null ||
    modalFullNameStaff.value == undefined ||
    modalFullNameStaff.value.trim() == ""
  ) {
    swal("Err", "Not null fullname", "error");
  } else {
    let url = `${urlDeleteStaff}/${CreateDataNullForPost(modalIdStaff.value)}`;

    axios
      .post(url)
      .then((res) => {
        if (res.data != 0) {
          swal("Done", "Delete success", "success");
          SetEmptyStaff();
          GetStaff();
        } else {
          swal("Err", "Delete failed", "error");
        }
      })
      .catch((err) => console.log(err));
  }
}
