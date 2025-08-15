let userName = document.getElementById("userName").innerHTML;
if (userName == null || userName == undefined || userName.trim() == "") {
  userName = "admin";
}
let urlGetSites = `${hostname}/GetSiteByUId/${userName}`;
let urlGetDataMonthLogger = `${hostname}/GetDataMonthLogger`;

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

let viewDataMonthLogger = document.getElementById("viewDataMonthLogger");

viewDataMonthLogger.addEventListener("click", function (e) {
  loading.classList.add("show");
  loading.classList.remove("hide");

  let startDate = document.getElementById("startDate");
  let endDate = document.getElementById("endDate");
  let siteid = document.getElementById("selectSite").value;

  if (siteid == null || siteid == undefined || siteid.trim() == "") {
    swal("Lỗi", "Chưa chọn vị trí", "error");
  } else if (
    startDate.value == "" ||
    startDate.value == null ||
    startDate.value == undefined
  ) {
    swal("Lỗi", "Tháng bắt đầu chưa có", "error");
  } else if (
    endDate.value == "" ||
    endDate.value == null ||
    endDate.value == undefined
  ) {
    swal("Lỗi", "Tháng kết thúc chưa có", "error");
  } else {
    let start = new Date(startDate.value);
    let end = new Date(endDate.value);

    let totalMilisecondStart = start.getTime();
    let totalMilisecondEnd = end.getTime();

    let url = `${urlGetDataMonthLogger}/${siteid}/${totalMilisecondStart}/${totalMilisecondEnd}`;

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
              .columns([])
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
              title: `Du_Lieu_Logger_Thang_Tu_${startDate}_Den_${endDate}`,
            },
            {
              extend: "csvHtml5",
              title: `Du_Lieu_Logger_Thang_Tu_${startDate}_Den_${endDate}`,
            },
            {
              extend: "pdfHtml5",
              title: `Du_Lieu_Logger_Thang_Tu_${startDate}_Den_${endDate}`,
            },
          ],
        });
      })
      .catch((err) => console.log(err));
  }
});

function createHeader(data) {
  let head = document.getElementById("head");

  head.innerHTML = "";

  let content = "";

  if (CheckExistsData(data)) {
    content += `<tr>
              <th>Thời Gian</th>
            <th>LL Max</th>
            <th>LL Min</th>
            <th>Sản lượng</th>
            <th>AL Max</th>
            <th>AL Min</th>
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
      content += `<td>${ConvertDataIntoTable(
        convertDateToString(convertDateFromApi(item.TimeStamp))
      )}</td>`;
      content += `<td>${ConvertDataIntoTable(item.MaxFlow)}</td>`;
      content += `<td>${ConvertDataIntoTable(item.MinFlow)}</td>`;
      content += `<td>${ConvertDataIntoTable(item.NetIndex)}</td>`;
      content += `<td>${ConvertDataIntoTable(item.MaxPressure)}</td>`;
      content += `<td>${ConvertDataIntoTable(item.MinPressure)}</td>`;
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
    let totalValue = 0;
    for (let item of data) {
      totalValue += parseFloat(item.NetIndex);
    }
    content += `<tr>
                <th colspan="3">Tổng sản lượng</th>
                <th colspan="3">${ConvertDataIntoTable(totalValue)}</th>
      </tr>`;
  }

  foot.innerHTML = content;
}
