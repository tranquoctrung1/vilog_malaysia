let urlGetUserByRoleStaff = `${hostname}/GetUserByRoleStaff`;
let urlGetUserByUserName = `${hostname}/GetUserByUserName`;
let urlGetSiteNotPermission = `${hostname}/GetSiteNotPremission`;
let urlGetSitePermission = `${hostname}/GetSitePremission`;
let urlUpdateStaffSite = `${hostname}/UpdateStaffSite`;

let idUser = document.getElementById("idUser");

let siteDragSortable;
let siteDropSortable;

function GetUser() {
  axios
    .get(urlGetUserByRoleStaff)
    .then((res) => {
      createOptionsInUserNameSelectBox(res.data, "listUser");
    })
    .catch((err) => console.log(err));
}

GetUser();

let userName = document.getElementById("userName2");

userName.addEventListener("change", function (e) {
  console.log(111111);
  GetUserByName(e.target.value);
});

function GetUserByName(name) {
  let url = `${urlGetUserByUserName}/${name}`;
  axios
    .get(url)
    .then((res) => {
      if (CheckExistsData(res.data)) {
        idUser.value = fillDataIntoInputTag(res.data[0]._id);

        FillDataListSiteNotPermission(idUser.value);
        FillDataListSitePermission(idUser.value);
      }
    })
    .catch((err) => console.log(er));
}

function FillDataListSiteNotPermission(id) {
  let url = `${urlGetSiteNotPermission}/${id}`;

  axios
    .get(url)
    .then((res) => {
      createDataForListSite(res.data, "siteDrag");
    })
    .catch((err) => console.log(err));
}
siteDragSortable = Sortable.create(siteDrag, {
  group: "sorting",
  sort: true,
});

function FillDataListSitePermission(id) {
  let url = `${urlGetSitePermission}/${id}`;

  axios
    .get(url)
    .then((res) => {
      createDataForListSite(res.data, "siteDrop");
    })
    .catch((err) => console.log(err));
}
siteDropSortable = Sortable.create(siteDrop, {
  group: "sorting",
  sort: true,
});

let btnUpdate = document.getElementById("btnUpdate");

btnUpdate.addEventListener("click", function (e) {
  let dataPost = [];

  let array = siteDropSortable.toArray();

  for (let idSite of array) {
    let obj = {};

    obj.IdSite = idSite;
    obj.IdUser = idUser.value;

    dataPost.push(obj);
  }

  let url = `${urlUpdateStaffSite}/${JSON.stringify(dataPost)}`;

  axios
    .post(url)
    .then((res) => {
      console.log(res.data);
      if (res.data != 0) {
        swal("Done", "Update success", "success");
        FillDataListSiteNotPermission(idUser.value);
        FillDataListSitePermission(idUser.value);
      } else {
        swal("Err", "Update failed", "error");
      }
    })
    .catch((err) => console.log(err));
});
