let userName = document.getElementById("userName").innerHTML;
if (userName == null || userName == undefined || userName.trim() == "") {
  userName = "admin";
}
let urlGetSites = `${hostname}/GetSiteByUId/${userName}`;
let urlGetQuantityDayForcast = `${hostname}/GetQuantityDayForcast`;
let urlGetCurrentTimeStampBySiteId = `${hostname}/GetCurrentTimeStampBySiteId`;

let titleChart = document.getElementById("title-chart");
let titlChartCircle = document.getElementById("title-chart-circle");

let chart;

let loading = document.getElementById("loading");

// add hide
loading.classList.add("hide");

function fetchSites() {
  axios
    .get(urlGetSites)
    .then((res) => {
      createOptionsInSelectBoxAndSelectFirstValue(res.data, "selectSite");
    })
    .catch((err) => console.log(err));
}

fetchSites();

let viewQuantityDayForcast = document.getElementById("viewQuantityDayForcast");

viewQuantityDayForcast.addEventListener("click", function (e) {
  loading.classList.add("show");
  loading.classList.remove("hide");

  let startDate = document.getElementById("startDate");

  let siteid = document.getElementById("selectSite").value;

  if (siteid == null || siteid == undefined || siteid.trim() == "") {
    swal("Lỗi", "Chưa chọn vị trí", "error");
  } else if (
    startDate.value == "" ||
    startDate.value == null ||
    startDate.value == undefined
  ) {
    swal("Lỗi", "Tháng bắt đầu chưa có", "error");
  } else {
    let start = new Date(startDate.value);
    let end = new Date(startDate.value);
    end.setMonth(end.getMonth() + 1);
    end.setDate(end.getDate() - 1);

    let totalMilisecondStart = start.getTime();
    let totalMilisecondEnd = end.getTime();

    let url = `${urlGetQuantityDayForcast}/${siteid}/${totalMilisecondStart}/${totalMilisecondEnd}`;

    getData(url);
    titleChart.innerHTML = `Biểu đồ sản lượng và dự báo sản lượng hàng ngày của tháng ${
      start.getMonth() + 1
    }`;
    titlChartCircle.innerHTML = `Biểu đồ tổng sản lượng thật và tổng dự báo sản lượng hàng ngày của tháng ${
      start.getMonth() + 1
    }`;
  }
});

function getData(url) {
  axios
    .get(url)
    .then(function (res) {
      loading.classList.add("hide");
      loading.classList.remove("show");
      if (CheckExistsData(res.data)) {
        drawChart(res.data);
        drawChartCircle(res.data);
        createTable(res.data);
      }
    })
    .catch((err) => console.log(err));
}

function drawChart(data) {
  am4core.ready(function () {
    if (chart != null && chart != undefined) {
      chart.dispose();
    }
    // Themes begin
    am4core.useTheme(am4themes_animated);
    // Themes end

    am4core.useTheme(am4themes_animated);
    am4core.addLicense("ch-custom-attribution");

    chart = am4core.create("chart", am4charts.XYChart);
    chart.colors.step = 2;

    chart.legend = new am4charts.Legend();
    chart.legend.position = "top";
    chart.legend.paddingBottom = 20;
    chart.legend.labels.template.maxWidth = 95;

    var xAxis = chart.xAxes.push(new am4charts.CategoryAxis());
    xAxis.dataFields.category = "TimeStamp";
    xAxis.renderer.cellStartLocation = 0.1;
    xAxis.renderer.cellEndLocation = 0.9;
    xAxis.renderer.grid.template.location = 0;

    var yAxis = chart.yAxes.push(new am4charts.ValueAxis());
    yAxis.min = 0;

    function createSeries(value, name) {
      var series = chart.series.push(new am4charts.ColumnSeries());
      series.dataFields.valueY = value;
      series.dataFields.categoryX = "TimeStamp";
      series.name = name;
      series.columns.template.tooltipText =
        "Day {categoryX}: [bold]{valueY}[/]";
      series.columns.template.fillOpacity = 0.8;

      series.events.on("hidden", arrangeColumns);
      series.events.on("shown", arrangeColumns);

      // var bullet = series.bullets.push(new am4charts.LabelBullet());
      // bullet.interactionsEnabled = false;
      // bullet.dy = -10;
      // bullet.label.text = "{valueY}";
      // bullet.label.fill = am4core.color("#000000");

      return series;
    }

    chart.data = convertData(data);
    console.log(chart.data);

    createSeries("Value", "Sản lượng thật");
    createSeries("ForcastValue", "Sản lượng dự Báo");

    function arrangeColumns() {
      var series = chart.series.getIndex(0);

      var w =
        1 -
        xAxis.renderer.cellStartLocation -
        (1 - xAxis.renderer.cellEndLocation);
      if (series.dataItems.length > 1) {
        var x0 = xAxis.getX(series.dataItems.getIndex(0), "categoryX");
        var x1 = xAxis.getX(series.dataItems.getIndex(1), "categoryX");
        var delta = ((x1 - x0) / chart.series.length) * w;
        if (am4core.isNumber(delta)) {
          var middle = chart.series.length / 2;

          var newIndex = 0;
          chart.series.each(function (series) {
            if (!series.isHidden && !series.isHiding) {
              series.dummyData = newIndex;
              newIndex++;
            } else {
              series.dummyData = chart.series.indexOf(series);
            }
          });
          var visibleCount = newIndex;
          var newMiddle = visibleCount / 2;

          chart.series.each(function (series) {
            var trueIndex = chart.series.indexOf(series);
            var newIndex = series.dummyData;

            var dx = (newIndex - trueIndex + middle - newMiddle) * delta;

            series.animate(
              { property: "dx", to: dx },
              series.interpolationDuration,
              series.interpolationEasing
            );
            series.bulletsContainer.animate(
              { property: "dx", to: dx },
              series.interpolationDuration,
              series.interpolationEasing
            );
          });
        }
      }
    }
  });
}

function drawChartCircle(data) {
  am4core.ready(function () {
    // Themes begin
    am4core.useTheme(am4themes_animated);
    // Themes end

    // Create chart instance
    var chart = am4core.create("chartCircle", am4charts.PieChart);

    // Add data
    chart.data = convertDataForCircle(data);

    // Add and configure Series
    var pieSeries = chart.series.push(new am4charts.PieSeries());
    pieSeries.dataFields.value = "Value";
    pieSeries.dataFields.category = "name";
    pieSeries.slices.template.stroke = am4core.color("#fff");
    pieSeries.slices.template.strokeOpacity = 1;

    // This creates initial animation
    pieSeries.hiddenState.properties.opacity = 1;
    pieSeries.hiddenState.properties.endAngle = -90;
    pieSeries.hiddenState.properties.startAngle = -90;

    chart.hiddenState.properties.radius = am4core.percent(0);
  });
}

function convertData(data) {
  let convetData = [];

  for (let item of data) {
    let obj = {};

    let time = convertDateFromApi(item.TimeStamp);

    obj.TimeStamp = `${time.getDate()}`;
    obj.Value = parseFloat(item.Value);
    obj.ForcastValue = parseFloat(item.ForcastValue);

    convetData.push(obj);
  }

  return convetData;
}

function convertDataForCircle(data) {
  let convertData = [];

  let objReal = {};
  objReal.name = "Tổng sản lượng thật";
  objReal.Value = 0;

  let objForcast = {};
  objForcast.name = "Tổng  dự báo sản lượng";
  objForcast.Value = 0;

  for (let item of data) {
    if (item != null && item != undefined) {
      if (item.Value != null && item.Value != undefined) {
        objReal.Value += parseFloat(item.Value);
      }

      if (item.ForcastValue != null && item.ForcastValue != undefined) {
        objForcast.Value += parseFloat(item.ForcastValue);
      }
    }
  }

  convertData.push(objReal);
  convertData.push(objForcast);

  return convertData;
}

function createTable(data) {
  createTablePlaceHolder();

  createHeader(data);
  createBody(data);

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
        title: `Bao_Cao_San_Luong_Va_Du_Bao_San_Luong_Hang_Ngay_Theo_Thang`,
      },
      {
        extend: "csvHtml5",
        title: `Bao_Cao_San_Luong_Va_Du_Bao_San_Luong_Hang_Ngay_Theo_Thang`,
      },
      {
        extend: "pdfHtml5",
        title: `Bao_Cao_San_Luong_Va_Du_Bao_San_Luong_Hang_Ngay_Theo_Thang`,
      },
    ],
  });
}

function createHeader(data) {
  let head = document.getElementById("head");

  head.innerHTML = "";

  let content = "";

  if (CheckExistsData(data)) {
    content += `<tr>
    <th>Thời gian</th>
    <th>Sản lượng thật</th>
    <th>Sản lượng dự báo</th>
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
      content += `<td>${ConvertDataIntoTable(item.Value)}</td>`;
      content += `<td>${ConvertDataIntoTable(item.ForcastValue)}</td>`;
      content += `</tr>`;
    }
  }

  body.innerHTML = content;
}

document.addEventListener("DOMContentLoaded", function (event) {
  let startDate = document.getElementById("startDate");
  let siteid = document.getElementById("selectSite");
  setTimeout(function () {
    let url = `${urlGetCurrentTimeStampBySiteId}/${siteid.value}`;

    axios
      .get(url)
      .then((res) => {
        console.log(res.data);
        if (res.data != null && res.data != undefined) {
          if (res.data[0] != null && res.data[0] != undefined) {
            if (
              res.data[0].TimeStamp != null &&
              res.data[0].TimeStamp != undefined
            ) {
              let time = new Date(res.data[0].TimeStamp);

              startDate.value = `${time.getFullYear()}-${
                time.getMonth() + 1 < 10
                  ? `0${time.getMonth() + 1}`
                  : time.getMonth() + 1
              }`;

              let start = new Date(startDate.value);
              let end = new Date(startDate.value);
              end.setMonth(end.getMonth() + 1);
              end.setDate(end.getDate() - 1);

              let totalMilisecondStart = start.getTime();
              let totalMilisecondEnd = end.getTime();

              let urlGetData = `${urlGetQuantityDayForcast}/${siteid.value}/${totalMilisecondStart}/${totalMilisecondEnd}`;

              getData(urlGetData);
              titleChart.innerHTML = `Biểu đồ sản lượng và dự báo sản lượng hàng ngày của tháng ${
                start.getMonth() + 1
              }`;
              titlChartCircle.innerHTML = `Biểu đồ tổng sản lượng thật và tổng dự báo sản lượng hàng ngày của tháng ${
                start.getMonth() + 1
              }`;
            }
          }
        }
      })
      .catch((err) => console.log(err));
  }, 500);
});
