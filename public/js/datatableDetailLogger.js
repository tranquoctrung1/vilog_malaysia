let userName = document.getElementById("userName").innerHTML;
if (userName == null || userName == undefined || userName.trim() == "") {
  userName = "admin";
}
let urlGetSites = `${hostname}/GetSiteByUId/${userName}`;
let urlGetDataTableDetailLogger = `${hostname}/GetDataTableDetailLogger`;

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

let viewDataTabeDetailLogger = document.getElementById(
  "viewDataTabeDetailLogger"
);

viewDataTabeDetailLogger.addEventListener("click", function (e) {
  loading.classList.add("show");
  loading.classList.remove("hide");

  let startDate = document.getElementById("startDate");
  let endDate = document.getElementById("endDate");
  let siteid = document.getElementById("selectSite").value;

  if (siteid == null || siteid == undefined || siteid.trim() == "") {
    swal("Err", "Please choose loction", "error");
  } else if (
    startDate.value == "" ||
    startDate.value == null ||
    startDate.value == undefined
  ) {
    swal("Err", "Not null start date", "error");
  } else if (
    endDate.value == "" ||
    endDate.value == null ||
    endDate.value == undefined
  ) {
    swal("Err", "Not null end date", "error");
  } else {
    let start = new Date(startDate.value);
    let end = new Date(endDate.value);

    //start.setHours(start.getHours() - 7);
    //end.setHours(end.getHours() - 7);

    let totalMilisecondStart = start.getTime();
    let totalMilisecondEnd = end.getTime();

    let url = `${urlGetDataTableDetailLogger}/${siteid}/${totalMilisecondStart}/${totalMilisecondEnd}`;

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
          pageLength: 50,
          initComplete: function () {
            this.api()
              .columns([0])
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
              title: `Du_Lieu_Bang_Chi_Tiet_Logger_Ngay_Tu_${startDate}_Den_${endDate}`,
            },
            {
              extend: "csvHtml5",
              title: `Du_Lieu_Bang_Chi_Tiet_Logger_Ngay_Tu_${startDate}_Den_${endDate}`,
            },
            {
              extend: "pdfHtml5",
              title: `Du_Lieu_Bang_Chi_Tiet_Logger_Ngay_Tu_${startDate}_Den_${endDate}`,
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
            <th>Timestamp</th>
          <th>Pressure 1</th>
          <th>Áp lực 2</th>
          <th>Lưu lượng thuận</th>
          <th>Lưu lượng nghịch</th>
          <th>Index thuận</th>
          <th>Index nghịch</th>
          <th>Index net</th>
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
      content += `<td>${ConvertDataIntoTable(item.Pressure1)}</td>`;
      content += `<td>${ConvertDataIntoTable(item.Pressure2)}</td>`;
      content += `<td>${ConvertDataIntoTable(item.ForwardFlow)}</td>`;
      content += `<td>${ConvertDataIntoTable(item.ReverseFlow)}</td>`;
      content += `<td>${ConvertDataIntoTable(item.IndexForward)}</td>`;
      content += `<td>${ConvertDataIntoTable(item.IndexReverse)}</td>`;
      content += `<td>${ConvertDataIntoTable(item.IndexNet)}</td>`;
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
                <th>Thời Gian</th>
                <th>Áp lực 1</th>
                <th>Áp lực 2</th>
                <th>Lưu lượng thuận</th>
                <th>Lưu lượng nghịch</th>
                <th>Index thuận</th>
                <th>Index nghịch</th>
                <th>Index net</th>
      </tr>`;
  }

  foot.innerHTML = content;
}
