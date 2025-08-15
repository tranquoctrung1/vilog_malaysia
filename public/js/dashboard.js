let userName = document.getElementById("userName").innerHTML;
if (userName == null || userName == undefined || userName.trim() == "") {
  userName = "admin";
}
let urlGetSites = `${hostname}/GetSiteByUId/${userName}`;
let urlGetQuantityHour = `${hostname}/GetQuantityHourReport`;
let urlGetQuantityDay = `${hostname}/GetQuantityDayReport`;
let urlGetQuantityMonth = `${hostname}/GetQuantityMonthReport`;
let urlGetQuantiyYear = `${hostname}/GetQuantityYearReport`;

let valueToDay = document.getElementById("valueToDay");
let valuePrevDay = document.getElementById("valuePrevDay");
let valueThisMonth = document.getElementById("valueThisMonth");
let valuePrevMonth = document.getElementById("valuePrevMonth");
let valueThisYear = document.getElementById("valueThisYear");
let valuePrevYear = document.getElementById("valuePrevYear");
let titleChartDay = document.getElementById("titleChartDay");
let titleChartMonth = document.getElementById("titleChartMonth");
let titleChartYear = document.getElementById("titleChartYear");

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
  if (e.target.value.trim() != "") {
    getValueForDay(e.target.value);
    getDataForDay(e.target.value);
    getValueForMonth(e.target.value);
    getDataForMonth(e.target.value);
    getValueForYear(e.target.value);
    getDataForYear(e.target.value);
  }
});

function getValueForDay(siteid) {
  let now = new Date(Date.now());
  let temp = new Date(Date.now());

  let start = new Date(now.setDate(now.getDate() - 1));
  start = new Date(
    start.getFullYear(),
    start.getMonth(),
    start.getDate(),
    7,
    0,
    0
  );
  let end = new Date(
    temp.getFullYear(),
    temp.getMonth(),
    temp.getDate(),
    7,
    0,
    0
  );

  let totalMilisecondStart = start.getTime();
  let totalMilisecondEnd = end.getTime();
  let urlToDay = `${urlGetQuantityDay}/${siteid}/${totalMilisecondEnd}/${totalMilisecondEnd}`;
  let urlPrevDay = `${urlGetQuantityDay}/${siteid}/${totalMilisecondStart}/${totalMilisecondStart}`;

  axios
    .get(urlToDay)
    .then((res) => {
      if (CheckExistsData(res.data)) {
        valueToDay.innerHTML = ConvertDataIntoTable(res.data[0].Value);
      }
    })
    .catch((err) => console.log(err));

  axios
    .get(urlPrevDay)
    .then((res) => {
      if (CheckExistsData(res.data)) {
        valuePrevDay.innerHTML = ConvertDataIntoTable(res.data[0].Value);
      }
    })
    .catch((err) => console.log(err));
}

function getValueForMonth(siteid) {
  let now = new Date(Date.now());
  let temp = new Date(Date.now());

  let start = new Date(now.setMonth(now.getMonth() - 1));
  start = new Date(start.getFullYear(), start.getMonth(), 1, 0, 0, 0);
  let end = new Date(temp.getFullYear(), temp.getMonth(), 1, 0, 0, 0);

  let totalMilisecondStart = start.getTime();
  let totalMilisecondEnd = end.getTime();
  let urlThisMonth = `${urlGetQuantityMonth}/${siteid}/${totalMilisecondEnd}/${totalMilisecondEnd}`;
  let urlPrevMonth = `${urlGetQuantityMonth}/${siteid}/${totalMilisecondStart}/${totalMilisecondStart}`;

  axios
    .get(urlThisMonth)
    .then((res) => {
      if (CheckExistsData(res.data)) {
        valueThisMonth.innerHTML = ConvertDataIntoTable(res.data[0].Value);
      }
    })
    .catch((err) => console.log(err));

  axios
    .get(urlPrevMonth)
    .then((res) => {
      if (CheckExistsData(res.data)) {
        valuePrevMonth.innerHTML = ConvertDataIntoTable(res.data[0].Value);
      }
    })
    .catch((err) => console.log(err));
}

function getValueForYear(siteid) {
  let now = new Date(Date.now());
  let temp = new Date(Date.now());

  let start = new Date(now.setFullYear(now.getFullYear() - 1));
  start = new Date(start.getFullYear(), 0, 1, 0, 0, 0);
  let end = new Date(temp.getFullYear(), 0, 1, 0, 0, 0);

  let totalMilisecondStart = start.getTime();
  let totalMilisecondEnd = end.getTime();
  let urlThisYear = `${urlGetQuantiyYear}/${siteid}/${totalMilisecondEnd}/${totalMilisecondEnd}`;
  let urlPrevYear = `${urlGetQuantiyYear}/${siteid}/${totalMilisecondStart}/${totalMilisecondStart}`;

  axios
    .get(urlThisYear)
    .then((res) => {
      if (CheckExistsData(res.data)) {
        valueThisYear.innerHTML = ConvertDataIntoTable(res.data[0].Value);
      }
    })
    .catch((err) => console.log(err));

  axios
    .get(urlPrevYear)
    .then((res) => {
      if (CheckExistsData(res.data)) {
        valuePrevYear.innerHTML = ConvertDataIntoTable(res.data[0].Value);
      }
    })
    .catch((err) => console.log(err));
}

function getDataForDay(siteid) {
  let now = new Date(Date.now());
  let temp = new Date(Date.now());

  let start = new Date(now.setDate(now.getDate()));
  start = new Date(
    start.getFullYear(),
    start.getMonth(),
    start.getDate(),
    7,
    0,
    0
  );
  let end = new Date(temp.setDate(temp.getDate() + 1));

  end = new Date(end.getFullYear(), end.getMonth(), end.getDate(), 7, 0, 0);
  end.setHours(end.getHours() - 1);

  let totalMilisecondStart = start.getTime();
  let totalMilisecondEnd = end.getTime();
  let url = `${urlGetQuantityHour}/${siteid}/${totalMilisecondStart}/${totalMilisecondEnd}`;

  axios
    .get(url)
    .then((res) => {
      console.log(res.data);
      if (CheckExistsData(res.data)) {
        titleChartDay.innerHTML = `Chart Hourly  ${now.getDate() < 10 ? `0${now.getDate()}` : now.getDate()
          }`;
        drawChart(res.data, "chartDay", "hour");
        createTableData(res.data, "tableDay");
      }
    })
    .catch((err) => console.log(err));
}

function getDataForMonth(siteid) {
  let now = new Date(Date.now());
  let temp = new Date(Date.now());

  let start = new Date(now.setMonth(now.getMonth()));
  start = new Date(start.getFullYear(), start.getMonth(), 1, 7, 0, 0);
  let end = new Date(temp.setMonth(temp.getMonth() + 1));

  end = new Date(end.getFullYear(), end.getMonth(), 1, 7, 0, 0);
  end.setDate(end.getDate() - 1);

  let totalMilisecondStart = start.getTime();
  let totalMilisecondEnd = end.getTime();
  let url = `${urlGetQuantityDay}/${siteid}/${totalMilisecondStart}/${totalMilisecondEnd}`;

  axios
    .get(url)
    .then((res) => {
      if (CheckExistsData(res.data)) {
        titleChartMonth.innerHTML = `Chart Daily ${now.getMonth() + 1 < 10
            ? `0${now.getMonth() + 1}`
            : now.getMonth() + 1
          }`;
        drawChart(res.data, "chartMonth", "day");
        createTableData(res.data, "tableMonth");
      }
    })
    .catch((err) => console.log(err));
}

function getDataForYear(siteid) {
  let now = new Date(Date.now());
  let temp = new Date(Date.now());

  let start = new Date(now.setFullYear(now.getFullYear()));
  start = new Date(start.getFullYear(), 0, 1, 7, 0, 0);
  let end = new Date(temp.setFullYear(temp.getFullYear() + 1));

  end = new Date(end.getFullYear(), 0, 1, 7, 0, 0);
  end.setMonth(end.getMonth() - 1);

  let totalMilisecondStart = start.getTime();
  let totalMilisecondEnd = end.getTime();
  let url = `${urlGetQuantityMonth}/${siteid}/${totalMilisecondStart}/${totalMilisecondEnd}`;

  axios
    .get(url)
    .then((res) => {
      if (CheckExistsData(res.data)) {
        titleChartYear.innerHTML = `Chart Monthly ${now.getFullYear()}`;
        drawChart(res.data, "chartYear", "month");
        createTableData(res.data, "tableYear");
      }
    })
    .catch((err) => console.log(err));
}

// func draw chart
function drawChart(data, idDom, type) {
  if (chart != null && chart != undefined) {
    chart.dispose();
  }

  // Themes begin
  am4core.useTheme(am4themes_animated);
  am4core.addLicense("ch-custom-attribution");
  // Themes end

  var chart = am4core.create(idDom, am4charts.XYChart);
  chart.paddingRight = 20;

  let dataForChart = [];

  for (let item of data) {
    if (
      item.TimeStamp != null &&
      item.TimeStamp != undefined &&
      item.TimeStamp.toString().trim() != ""
    ) {
      if (item.Value != null && item.Value != undefined) {
        let obj = {};
        if (type == "hour") {
          obj.TimeStamp = convertDateFromApi(item.TimeStamp);
          obj.TimeStamp = `${obj.TimeStamp.getHours()}`;
        } else if (type == "day") {
          obj.TimeStamp = convertDateFromApi(item.TimeStamp);
          obj.TimeStamp = `${obj.TimeStamp.getDate()}`;
        } else if (type == "month") {
          obj.TimeStamp = convertDateFromApi(item.TimeStamp);
          obj.TimeStamp = `${obj.TimeStamp.getMonth()}`;
        }

        obj.Value = item.Value;

        dataForChart.push(obj);
      }
    }
  }

  chart.data = dataForChart;

  var categoryAxis = chart.xAxes.push(new am4charts.CategoryAxis());
  categoryAxis.dataFields.category = "TimeStamp";
  categoryAxis.renderer.grid.template.location = 0;
  categoryAxis.renderer.minGridDistance = 30;

  categoryAxis.renderer.labels.template.adapter.add(
    "dy",
    function (dy, target) {
      if (target.dataItem && target.dataItem.index & (2 == 2)) {
        return dy + 25;
      }
      return dy;
    }
  );

  var valueAxis = chart.yAxes.push(new am4charts.ValueAxis());

  // Create series
  var series = chart.series.push(new am4charts.ColumnSeries());
  series.dataFields.valueY = "Value";
  series.dataFields.categoryX = "TimeStamp";
  series.name = "TimeStamp";
  if (type == "hour") {
    series.columns.template.tooltipText =
      "Hour: {categoryX}: [bold]{valueY}[/]";
    series.fill = am4core.color("#0984e3");
    series.strocke = am4core.color("#0984e3");
  } else if (type == "day") {
    series.columns.template.tooltipText = "Day: {categoryX}: [bold]{valueY}[/]";
    series.fill = am4core.color("#f1c40f");
    series.strocke = am4core.color("#f1c40f");
  } else if (type == "month") {
    series.columns.template.tooltipText =
      "Month: {categoryX}: [bold]{valueY}[/]";
    series.fill = am4core.color("#2ecc71");
    series.strocke = am4core.color("#2ecc71");
  }

  series.columns.template.fillOpacity = 0.8;

  var columnTemplate = series.columns.template;
  columnTemplate.strokeWidth = 2;
  columnTemplate.strokeOpacity = 1;

  // var dateAxis = chart.xAxes.push(new am4charts.DateAxis());
  // dateAxis.renderer.grid.template.location = 0;
  // dateAxis.minZoomCount = 5;

  // // this makes the data to be grouped (in the future)
  // // dateAxis.groupData = true;
  // // dateAxis.groupCount = 500;

  // var valueAxis = chart.yAxes.push(new am4charts.ValueAxis());

  // var series = chart.series.push(new am4charts.LineSeries());
  // series.dataFields.dateX = "TimeStamp";
  // series.dataFields.valueY = "Value";
  // series.tooltipText = `{valueY}`;
  // series.tooltip.pointerOrientation = "vertical";
  // series.tooltip.background.fillOpacity = 0.5;
  // series.legendSettings.valueText = "{valueY.close}";
  // series.legendSettings.itemValueText = "{valueY}";

  // // Make bullets grow on hover
  // var bullet = series.bullets.push(new am4charts.CircleBullet());
  // bullet.circle.strokeWidth = 1;
  // bullet.circle.radius = 2;
  // bullet.circle.fill = am4core.color("#fff");

  // var bullethover = bullet.states.create("hover");
  // bullethover.properties.scale = 1.3;

  // chart.cursor = new am4charts.XYCursor();
  // chart.cursor.xAxis = dateAxis;

  // var scrollbarX = new am4core.Scrollbar();
  // scrollbarX.marginBottom = 20;
  // chart.scrollbarX = scrollbarX;

  chart.exporting.menu = new am4core.ExportMenu();
}

function createTableData(data, idDom) {
  let header = `<th>Timestamp</th><th>Value</th>`;
  let body = ``;

  for (let item of data) {
    body += `<tr><td>${convertDateToString(
      convertDateFromApi(item.TimeStamp)
    )}</td><td>${ConvertDataIntoTable(item.Value)}</td></tr>`;
  }

  document.getElementById(
    idDom
  ).innerHTML = `<table class="table table-bordered dataTable no-footer" id="${idDom}2" cellspacing="0" style="width: 100%;overflow-y:auto" role="grid" aria-describedby="dataTable_info"> 
    <thead> ${header} 
    </thead> 
    <tbody>  ${body} 
    </tbody> 
    </table >`;

  $(`#${idDom}2`).DataTable({
    pageLength: 5,
    //order: [[0, "desc"]],
    initComplete: function () {
      this.api()
        .columns([])
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
        title: `Bang_Chi_Tiet`,
      },
      {
        extend: "csvHtml5",
        title: `Bang_Chi_Tiet`,
      },
      {
        extend: "pdfHtml5",
        title: `Bang_Chi_Tiet`,
      },
    ],
  });
}
