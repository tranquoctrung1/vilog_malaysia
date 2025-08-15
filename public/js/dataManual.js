let userName = document.getElementById("userName").innerHTML;
if (userName == null || userName == undefined || userName.trim() == "") {
  userName = "admin";
}
let urlGetSites = `${hostname}/GetSiteByUId/${userName}`;
let urlGetDataManual = `${hostname}/GetDataManual`;
let urlInsertDataManual = `${hostname}/InsertDataManual`;
let urlUpdateDataManual = `${hostname}/UpdateDataManual`;
let urlDeleteDataManual = `${hostname}/DeleteDataManual`;

let oldValue;

let loading = document.getElementById("loading");

// add hide
loading.classList.add("hide");

function fetchSites() {
  axios
    .get(urlGetSites)
    .then((res) => {
      createOptionsInSelectBox(res.data, "selectSite");
    })
    .catch((err) => console.log(err));
}

fetchSites();

let selectSite = document.getElementById("selectSite");

selectSite.addEventListener("change", function (e) {
  loading.classList.add("show");
  loading.classList.remove("hide");

  let url = `${urlGetDataManual}/${e.target.value}`;
  axios
    .get(url)
    .then((res) => {
      console.log(res.data);
      loading.classList.add("hide");
      loading.classList.remove("show");

      createTablePlaceHolder();

      createHeader(res.data);
      createBody(res.data);
      createFooter(res.data);

      $("#example").DataTable({
        initComplete: function () {
          this.api()
            .columns([1])
            .every(function () {
              var column = this;
              var select = $('<select><option value=""></option></select>')
                .appendTo($(column.footer()).empty())
                .on("change", function () {
                  var val = $.fn.dataTable.util.escapeRegex($(this).val());
                  column.search(val ? "^" + val + "$" : "", true, false).draw();
                });
              column
                .data()
                .unique()
                .sort()
                .each(function (d, j) {
                  select.append('<option value="' + d + '">' + d + "</option>");
                });
            });
        },
        dom: "Bfrtip",
        buttons: [
          {
            extend: "excelHtml5",
            title: `Du_Lieu_Nhap_Tay_Cua_${e.target.value}`,
          },
          {
            extend: "csvHtml5",
            title: `Du_Lieu_Nhap_Tay_Cua_${e.target.value}`,
          },
          {
            extend: "pdfHtml5",
            title: `Du_Lieu_Nhap_Tay_Cua_${e.target.value}`,
          },
        ],
      });
    })
    .catch((err) => console.log(err));
});

function createHeader(data) {
  let head = document.getElementById("head");

  head.innerHTML = "";

  let content = "";

  if (CheckExistsData(data)) {
    content += `<tr>
              <th>Vị trí</th>
            <th>Thời Gian</th>
            <th>Giá trị</th>
            <th></th>
        </tr>`;
  }

  head.innerHTML = content;
}

function createBody(data) {
  let body = document.getElementById("body");

  body.innerHTML = "";

  let content = "";

  if (CheckExistsData(data)) {
    for (let item of data) {
      content += `<tr>`;
      content += `<td>${ConvertDataIntoTable(item.SiteId)}</td>`;
      content += `<td>${ConvertDataIntoTable(
        convertDateToString(convertDateFromApi(item.TimeStamp))
      )}</td>`;
      content += `<td contentEditable="true" id="${
        item._id
      }" onfocus="getOldValue(this)">${ConvertDataIntoTable(item.Value)}</td>`;
      content += `<td><button class="btn btn-success btn-sm" data-id="${item._id}" onclick="onBtnUpdateClicked(this)">Sửa</button> <button class="btn btn-danger btn-sm" data-id="${item._id}" onclick="onBtnDeleteClicked(this)">Xóa</button></td>`;
      content += `</tr>`;
    }
  }

  body.innerHTML = content;
}

function createFooter(data) {
  let foot = document.getElementById("foot");

  foot.innerHTML = "";

  let content = "";

  if (CheckExistsData(data)) {
    content += `<tr>
                <th>Vị trí</th>
                <th>Thời Gian</th>
                <th>Giá trị</th>
                <th></th>
        </tr>`;
  }

  foot.innerHTML = content;
}

let InsertDataManual = document.getElementById("InsertDataManual");

InsertDataManual.addEventListener("click", async function (e) {
  let startDate = document.getElementById("startDate");
  let siteid = document.getElementById("selectSite").value;
  let value = document.getElementById("value").value;

  if (siteid == null || siteid == undefined || siteid.trim() == "") {
    swal("Lỗi", "Chưa chọn vị trí", "error");
  } else if (
    startDate.value == "" ||
    startDate.value == null ||
    startDate.value == undefined
  ) {
    swal("Lỗi", "Thời gian chưa có", "error");
  } else if (
    value == null ||
    value == undefined ||
    value.toString().trim() == ""
  ) {
    swal("Lỗi", "Giá trị chưa có", "error");
  } else {
    let start = new Date(startDate.value);
    start.setHours(start.getHours() + 7);

    let totalMilisecondStart = start.getTime();

    let url = `${urlInsertDataManual}/${siteid}/${totalMilisecondStart}/${value}`;

    let res = await axios.post(url);

    if (res.toString().trim() != "") {
      swal("Thành công", "Thêm thành công", "success");
    } else {
      swal("Lỗi", "Thêm không thành công", "error");
    }

    loading.classList.add("show");
    loading.classList.remove("hide");

    url = `${urlGetDataManual}/${siteid}`;
    axios
      .get(url)
      .then((res) => {
        console.log(res.data);
        loading.classList.add("hide");
        loading.classList.remove("show");

        createTablePlaceHolder();

        createHeader(res.data);
        createBody(res.data);
        createFooter(res.data);

        $("#example").DataTable({
          initComplete: function () {
            this.api()
              .columns([1])
              .every(function () {
                var column = this;
                var select = $('<select><option value=""></option></select>')
                  .appendTo($(column.footer()).empty())
                  .on("change", function () {
                    var val = $.fn.dataTable.util.escapeRegex($(this).val());
                    column
                      .search(val ? "^" + val + "$" : "", true, false)
                      .draw();
                  });
                column
                  .data()
                  .unique()
                  .sort()
                  .each(function (d, j) {
                    select.append(
                      '<option value="' + d + '">' + d + "</option>"
                    );
                  });
              });
          },
          dom: "Bfrtip",
          buttons: [
            {
              extend: "excelHtml5",
              title: `Du_Lieu_Nhap_Tay_Cua_${siteid}`,
            },
            {
              extend: "csvHtml5",
              title: `Du_Lieu_Nhap_Tay_Cua_${siteid}`,
            },
            {
              extend: "pdfHtml5",
              title: `Du_Lieu_Nhap_Tay_Cua_${siteid}`,
            },
          ],
        });
      })
      .catch((err) => console.log(err));
  }
});

function onBtnUpdateClicked(e) {
  let value = document.getElementById(`${e.dataset.id}`);

  let valueChanged = value.innerHTML;

  if (valueChanged.match(/^[0-9]*$/gm)) {
    let url = `${urlUpdateDataManual}/${e.dataset.id}/${valueChanged}`;

    axios
      .post(url)
      .then((res) => {
        if (res.data.toString() != 0) {
          swal("Thành công", "Cập nhật thành công", "success");
        } else {
          value.innerHTML = oldValue;
          swal("Lỗi", "Cập nhật không thành công", "error");
        }
      })
      .catch((err) => console.log(err));
  } else {
    swal(
      "Lỗi",
      "Giá trị không đúng định dạng. Giá trị phải hoàn toàn là số",
      "error"
    );
  }
}

function getOldValue(e) {
  oldValue = e.innerHTML;
}

function onBtnDeleteClicked(e) {
  swal({
    title: "Bạn có muốn xóa không?",
    text: "Một khi xóa thì dữ liệu sẽ không còn nữa!!!",
    icon: "warning",
    buttons: true,
    dangerMode: true,
  }).then(async (willDelete) => {
    if (willDelete) {
      let siteid = document.getElementById("selectSite").value;
      let url = `${urlDeleteDataManual}/${e.dataset.id}`;

      let result = await axios.post(url);

      if (result.toString().trim() != 0) {
        loading.classList.add("show");
        loading.classList.remove("hide");

        url = `${urlGetDataManual}/${siteid}`;
        axios
          .get(url)
          .then((res) => {
            console.log(res.data);
            loading.classList.add("hide");
            loading.classList.remove("show");

            createTablePlaceHolder();

            createHeader(res.data);
            createBody(res.data);
            createFooter(res.data);

            $("#example").DataTable({
              initComplete: function () {
                this.api()
                  .columns([1])
                  .every(function () {
                    var column = this;
                    var select = $(
                      '<select><option value=""></option></select>'
                    )
                      .appendTo($(column.footer()).empty())
                      .on("change", function () {
                        var val = $.fn.dataTable.util.escapeRegex(
                          $(this).val()
                        );
                        column
                          .search(val ? "^" + val + "$" : "", true, false)
                          .draw();
                      });
                    column
                      .data()
                      .unique()
                      .sort()
                      .each(function (d, j) {
                        select.append(
                          '<option value="' + d + '">' + d + "</option>"
                        );
                      });
                  });
              },
              dom: "Bfrtip",
              buttons: [
                {
                  extend: "excelHtml5",
                  title: `Du_Lieu_Nhap_Tay_Cua_${siteid}`,
                },
                {
                  extend: "csvHtml5",
                  title: `Du_Lieu_Nhap_Tay_Cua_${siteid}`,
                },
                {
                  extend: "pdfHtml5",
                  title: `Du_Lieu_Nhap_Tay_Cua_${siteid}`,
                },
              ],
            });
          })
          .catch((err) => console.log(err));

        swal("Thành công", "Xóa thành công", "success");
      } else {
        swal("Lỗi", "Xóa không thành công", "error");
      }
    }
  });
}
