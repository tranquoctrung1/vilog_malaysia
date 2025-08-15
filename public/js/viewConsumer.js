let urlGetConsumer = `${hostname}/GetConsumer`;
let urlDeleteConsumer = `${hostname}/DeleteConsumer`;
let urlUpdateConsumer = `${hostname}/UpdateConsumer`;

let loading = document.getElementById("loading");

function getData() {
  loading.classList.add("show");
  loading.classList.remove("hide");

  getDataAndDrawTable();
}

function createHeader(data) {
  let head = document.getElementById("head");

  head.innerHTML = "";

  let content = "";

  if (CheckExistsData(data)) {
    content += `<tr>
                    <th>Họ tên</th>
                    <th>Số điện thoại</th>
                    <th>Địa chỉ</th>
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
      content += `<td contentEditable="true" id="${
        item._id
      }fullName">${ConvertDataIntoTable(item.FullName)}</td>`;
      content += `<td contentEditable="true" id="${
        item._id
      }tele">${ConvertDataIntoTable(item.Telephone)}</td>`;
      content += `<td contentEditable="true" id="${
        item._id
      }address">${ConvertDataIntoTable(item.Adrress)}</td>`;
      content += `<td><button class="btn btn-success btn-sm" data-id="${item._id}" onclick="onBtnUpdateClick(this)">Sửa</button> <button class="btn btn-danger btn-sm" data-id="${item._id}" onclick="onBtnDeleteClicked(this)">Xóa</button></td>`;
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
                    <th>Họ tên</th>
                    <th>Số điện thoại</th>
                    <th>Địa chỉ</th>
                    <th></th>
                </tr>`;
  }

  foot.innerHTML = content;
}

function getDataAndDrawTable() {
  axios
    .get(urlGetConsumer)
    .then((res) => {
      loading.classList.add("hide");
      loading.classList.remove("show");

      createTablePlaceHolder();

      createHeader(res.data);
      createBody(res.data);
      createFooter(res.data);

      $("#example").DataTable({
        initComplete: function () {
          this.api()
            .columns([0])
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
            title: `Danh_Sach_Khach_Hang`,
          },
          {
            extend: "csvHtml5",
            title: `Danh_Sach_Khach_Hang`,
          },
          {
            extend: "pdfHtml5",
            title: `Danh_Sach_Khach_Hang`,
          },
        ],
      });
    })
    .catch((err) => console.log(err));
}

function onBtnDeleteClicked(e) {
  let url = `${urlDeleteStaff}/${CreateDataNullForPost(e.dataset.id)}`;
  axios
    .post(url)
    .then((res) => {
      if (res.data != 0) {
        swal("Thành công", "Xóa thành công", "success");
        getDataAndDrawTable();
      } else {
        swal("Lỗi", "Xóa không thành công", "error");
      }
    })
    .catch((err) => console.log(err));
}

function onBtnUpdateClick(e) {
  let fullname = document.getElementById(`${e.dataset.id}fullName`);
  let tele = document.getElementById(`${e.dataset.id}tele`);
  let address = document.getElementById(`${e.dataset.id}address`);
  let id = e.dataset.id;

  let url = `${urlUpdateConsumer}/${id}/${fullname.innerHTML}/${tele.innerHTML}/${address.innerHTML}`;

  axios
    .post(url)
    .then((res) => {
      if (res.data != 0) {
        swal("Thành công", "Cập nhật thành công", "success");
        getDataAndDrawTable();
      } else {
        swal("Lỗi", "Cập nhật không thành công", "error");
      }
    })
    .catch((err) => console.log(err));
}

getData();
