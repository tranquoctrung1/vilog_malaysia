let urlGetQuantityDayDisplayGroup = `${hostname}/GetQuantityDayDisplayGroup`;
let urlGetQuantityMonthDisplayGroup = `${hostname}/GetQuantityMonthDisplayGroup`;
let urlGetQuantityYearDisplayGroup = `${hostname}/GetQuantityYearDisplayGroup`;

let titleChartDay = document.getElementById("titleChartDay");
let chartDayCircle = document.getElementById("chartDayCircle");
let tableDataDay = document.getElementById("tableDataDay");

let titleChartMonth = document.getElementById("titleChartMonth");
let chartMonthCircle = document.getElementById("chartMonthCircle");
let tableDataMonth = document.getElementById("tableDataMonth");

let titleChartYear = document.getElementById("titleChartYear");
let chartYearCircle = document.getElementById("chartYearCircle");
let tableDataYear = document.getElementById("tableDataYear");

function getDataDay() {
  let now = new Date(Date.now());

  let time = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    now.getHours(),
    0,
    0
  );

  let totalMilisecondStart = time.getTime();

  let url = `${urlGetQuantityDayDisplayGroup}/${totalMilisecondStart}`;

  axios
    .get(url)
    .then((res) => {
      if (CheckExistsData(res.data)) {
        if (checkData(res.data) == true) {
          drawChartCircle(res.data, "chartDayCircle");
          createTable(res.data, "tableDataDay");
        } else {
          chartDayCircle.innerHTML = "Không có dữ liệu";
          tableDataDay.innerHTML = "Không có dữ liệu";
        }
      }
      titleChartDay.innerHTML = `Biểu Đồ Thể Hiện Tổng Quan Sản Lượng Tiêu Thụ Trong Ngày ${now.getDate()}`;
    })
    .catch((err) => console.log(err));
}

function getDataMonth() {
  let now = new Date(Date.now());

  let time = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    now.getHours(),
    0,
    0
  );

  let totalMilisecondStart = time.getTime();

  let url = `${urlGetQuantityMonthDisplayGroup}/${totalMilisecondStart}`;

  axios
    .get(url)
    .then((res) => {
      if (CheckExistsData(res.data)) {
        if (checkData(res.data) == true) {
          drawChartCircle(res.data, "chartMonthCircle");
          createTable(res.data, "tableDataMonth");
        } else {
          chartMonthCircle.innerHTML = "Không có dữ liệu";
          tableDataMonth.innerHTML = "Không có dữ liệu";
        }
      }
      titleChartMonth.innerHTML = `Biểu Đồ Thể Hiện Tổng Quan Sản Lượng Tiêu Thụ Trong Tháng ${
        now.getMonth() + 1
      }`;
    })
    .catch((err) => console.log(err));
}

function getDataYear() {
  let now = new Date(Date.now());

  let time = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    now.getHours(),
    0,
    0
  );

  let totalMilisecondStart = time.getTime();

  let url = `${urlGetQuantityYearDisplayGroup}/${totalMilisecondStart}`;

  axios
    .get(url)
    .then((res) => {
      if (CheckExistsData(res.data)) {
        if (checkData(res.data) == true) {
          drawChartCircle(res.data, "chartYearCircle");
          createTable(res.data, "tableDataYear");
        } else {
          chartYearCircle.innerHTML = "Không có dữ liệu";
          tableDataYear.innerHTML = "Không có dữ liệu";
        }
      }
      titleChartYear.innerHTML = `Biểu Đồ Thể Hiện Tổng Quan Sản Lượng Tiêu Thụ Trong Năm ${now.getFullYear()}`;
    })
    .catch((err) => console.log(err));
}

function drawChartCircle(data, idDom) {
  am4core.ready(function () {
    // Themes begin
    am4core.useTheme(am4themes_animated);
    // Themes end
    am4core.addLicense("ch-custom-attribution");
    // Create chart instance
    var chart = am4core.create(idDom, am4charts.PieChart);

    // Add data
    chart.data = data;

    // Add and configure Series
    var pieSeries = chart.series.push(new am4charts.PieSeries());
    pieSeries.dataFields.value = "Value";
    pieSeries.dataFields.category = "Name";
    pieSeries.slices.template.stroke = am4core.color("#fff");
    pieSeries.slices.template.strokeOpacity = 1;

    // This creates initial animation
    pieSeries.hiddenState.properties.opacity = 1;
    pieSeries.hiddenState.properties.endAngle = -90;
    pieSeries.hiddenState.properties.startAngle = -90;

    chart.hiddenState.properties.radius = am4core.percent(0);
  });
}

function drawBarChart(data, idDom) {
  am4core.ready(function () {
    am4core.useTheme(am4themes_animated);
    am4core.addLicense("ch-custom-attribution");

    chart = am4core.create(idDom, am4charts.XYChart);
    chart.colors.step = 2;

    chart.legend = new am4charts.Legend();
    chart.legend.position = "top";
    chart.legend.paddingBottom = 20;
    chart.legend.labels.template.maxWidth = 95;

    var xAxis = chart.xAxes.push(new am4charts.CategoryAxis());
    xAxis.dataFields.category = "Name";
    xAxis.renderer.cellStartLocation = 0.1;
    xAxis.renderer.cellEndLocation = 0.9;
    xAxis.renderer.grid.template.location = 0;

    var yAxis = chart.yAxes.push(new am4charts.ValueAxis());
    yAxis.min = 0;

    function createSeries(value, name) {
      var series = chart.series.push(new am4charts.ColumnSeries());
      series.dataFields.valueY = value;
      series.dataFields.categoryX = name;
      series.name = name;
      series.columns.template.tooltipText = "[bold]{valueY}[/]";
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

    chart.data = data;

    for (let item of chart.data) {
      createSeries(item.Value, item.Name);
    }

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

function createTable(data, idDom) {
  if (CheckExistsData(data)) {
    let header = `<th>Tên Block</th><th>Giá trị</th>`;
    let body = ``;

    for (let item of data) {
      body += `<tr><td>${ConvertDataIntoTable(
        item.Name
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
  }
}

function checkData(data) {
  let check = false;

  for (let item of data) {
    if (item.Value != null && item.Value != undefined && item.Value != 0) {
      check = true;
      break;
    }
  }

  return check;
}

setTimeout(function () {
  getDataDay();
}, 100);

setTimeout(function () {
  getDataMonth();
}, 100);

setTimeout(function () {
  getDataYear();
}, 100);
