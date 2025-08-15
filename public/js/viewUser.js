let urlGetUser = `${hostname}/GetUser`;
let urlDeleteUser = `${hostname}/DeleteUser`;

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
                    <th>Tên đăng nhập</th>
                    <th>Email</th>
                    <th>Quyền</th>
                    <th>Tên nhân viên</th>
                    <th>Tên khách hàng</th>
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
      content += `<td>${ConvertDataIntoTable(item.Username)}</td>`;
      content += `<td>${ConvertDataIntoTable(item.Email)}</td>`;
      content += `<td>${ConvertDataIntoTable(item.Role)}</td>`;
      content += `<td>${ConvertDataIntoTable(item.StaffId)}</td>`;
      content += `<td>${ConvertDataIntoTable(item.ConsumerId)}</td>`;
      content += `<td> <button class="btn btn-danger btn-sm" data-id="${item._id}" onclick="onBtnDeleteClicked(this)">Xóa</button></td>`;
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
                    <th>Tên đăng nhập</th>
                    <th>Email</th>
                    <th>Quyền</th>
                    <th>Tên nhân viên</th>
                    <th>Tên khách hàng</th>
                    <th></th>
                </tr>`;
  }

  foot.innerHTML = content;
}

function getDataAndDrawTable() {
  axios
    .get(urlGetUser)
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
            title: `Danh_Sach_Nguoi_Dung`,
          },
          {
            extend: "csvHtml5",
            title: `Danh_Sach_Nguoi_Dung`,
          },
          {
            extend: "pdfHtml5",
            title: `Danh_Sach_Nguoi_Dung`,
          },
        ],
      });
    })
    .catch((err) => console.log(err));
}

function onBtnDeleteClicked(e) {
  let url = `${urlDeleteUser}/${CreateDataNullForPost(e.dataset.id)}`;
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
getData();
