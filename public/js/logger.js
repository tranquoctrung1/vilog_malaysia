const urlGetAllDeviceLogger = `${hostname}/GetAllDeviceLogger`;
const urlInsertDeviceLogger = `${hostname}/InsertDeviceLogger`;
const urlGetDeviceLoggerBySerial = `${hostname}/GetDeviceLoggerBySerial`;
const urlUpdateDeviceLogger = `${hostname}/UpdateDeviceLogger`;
const urlDeleteDeviceLogger = `${hostname}/DeleteDeviceLogger`;

function fetchSerialLogger() {
  axios
    .get(urlGetAllDeviceLogger)
    .then((res) => {
      createOptionsInSerialLoggerSelectBox(res.data, "listSerial");
    })
    .catch((err) => console.log(err));
}

fetchSerialLogger();

let serial = document.getElementById("serialNumber");
let datePushStock = document.getElementById("datePushStock");
let producer = document.getElementById("producer");
let branch = document.getElementById("branch");
let model = document.getElementById("model");
let status = document.getElementById("status");
let urlUploadFile = document.getElementById("urlUploadFile");
let isInstall = document.getElementById("isInstall");
let note = document.getElementById("note");
let id = document.getElementById("id");

let btnInsert = document.getElementById("btnInsert");

btnInsert.addEventListener("click", function (e) {
  if (
    serial.value == null ||
    serial.value == undefined ||
    serial.value.trim() == ""
  ) {
    //swal("Thành công", "Thêm thành công", "success");
    swal("Lỗi", "Chưa có số Serial", "error");
  } else {
    let totalMilisecond = new Date(datePushStock.value).getTime();
    let url = `${urlInsertDeviceLogger}/${CreateDataNullForPost(
      serial.value
    )}/${CreateDataNullForPost(totalMilisecond)}/${CreateDataNullForPost(
      producer.value
    )}/${CreateDataNullForPost(branch.value)}/${CreateDataNullForPost(
      model.value
    )}/${CreateDataNullForPost(status.value)}/${CreateDataNullForPost(
      note.value
    )}/${CreateDataNullForPost(isInstall.checked)}/${CreateDataNullForPost(
      urlUploadFile.value
    )}`;

    axios
      .post(url)
      .then((res) => {
        console.log(res.data);
        if (res.data != 0) {
          swal("Thành công", "Thêm thành công", "success");
          id.value = res.data;
          fetchSerialLogger();
        } else {
          swal("Lỗi", "Thêm không thành công", "error");
        }
      })
      .catch((err) => {
        console.log(err);
      });
  }
});

let serialNumber = document.getElementById("serialNumber");

serialNumber.addEventListener("change", function (e) {
  console.log(e.target.value);

  let url = `${urlGetDeviceLoggerBySerial}/${e.target.value}`;
  axios
    .get(url)
    .then((res) => {
      console.log(res.data);
      FillData(res.data);
    })
    .catch((err) => console.log(err));
});

function FillData(data) {
  if (CheckExistsData(data)) {
    datePushStock.value = convertDateToDateInputTag(
      convertDateFromApi(data[0].DatePushStock)
    );
    producer.value = fillDataIntoInputTag(data[0].Producer);
    branch.value = fillDataIntoInputTag(data[0].Branch);
    model.value = fillDataIntoInputTag(data[0].Model);
    status.value = fillDataIntoInputTag(data[0].Status);
    isInstall.checked = data[0].IsInstall;
    note.value = fillDataIntoInputTag(data[0].Note);
    id.value = fillDataIntoInputTag(data[0]._id);
  }
}

function SetEmpty(data) {
  serial.value = "";
  datePushStock.value = "";
  producer.value = "";
  branch.value = "";
  model.value = "";
  status.value = "";
  isInstall.checked = false;
  note.value = "";
  id.value = "";
}

let btnUpdate = document.getElementById("btnUpdate");

btnUpdate.addEventListener("click", function (e) {
  if (
    serial.value == null ||
    serial.value == undefined ||
    serial.value.trim() == ""
  ) {
    //swal("Thành công", "Thêm thành công", "success");
    swal("Err", "Please input serial", "error");
  } else {
    let totalMilisecond = new Date(datePushStock.value).getTime();
    let url = `${urlUpdateDeviceLogger}/${CreateDataNullForPost(
      id.value
    )}/${CreateDataNullForPost(serial.value)}/${CreateDataNullForPost(
      totalMilisecond
    )}/${CreateDataNullForPost(producer.value)}/${CreateDataNullForPost(
      branch.value
    )}/${CreateDataNullForPost(model.value)}/${CreateDataNullForPost(
      status.value
    )}/${CreateDataNullForPost(note.value)}/${CreateDataNullForPost(
      isInstall.checked
    )}/${CreateDataNullForPost(urlUploadFile.value)}`;

    axios
      .post(url)
      .then((res) => {
        console.log(res.data);
        if (res.data != 0) {
          swal("Done", "Update success", "success");
          fetchSerialLogger();
        } else {
          swal("Err", "Update failed", "error");
        }
      })
      .catch((err) => {
        console.log(err);
      });
  }
});

let btnDelete = document.getElementById("btnDelete");

btnDelete.addEventListener("click", async function (e) {
  swal({
    title: "Delete sure?",
    text: "confirmn delete data!!!",
    icon: "warning",
    buttons: true,
    dangerMode: true,
  }).then(async (willDelete) => {
    let url = `${urlDeleteDeviceLogger}/${id.value}`;
    axios
      .post(url)
      .then((res) => {
        if (res.data != 0) {
          swal("Done", "Delete success", "success");
          SetEmpty();
          fetchSerialLogger();
        } else {
          swal("Err", "Delete failed", "error");
        }
      })
      .catch((err) => console.log(err));
  });
});
