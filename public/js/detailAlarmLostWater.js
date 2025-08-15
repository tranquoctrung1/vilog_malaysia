const urlSearchParams = new URLSearchParams(window.location.search);
const params = Object.fromEntries(urlSearchParams.entries());

let userName = document.getElementById("userName").innerHTML;
if (userName == null || userName == undefined || userName.trim() == "") {
  userName = "admin";
}
let urlGetSites = `${hostname}/GetSiteByUId/${userName}`;
let urlGetDataPressureHistory2Day = `${hostname}/GetDataHistoryPressure2Day`;
let urlGetDataFlowHistory2Day = `${hostname}/GetDataFlowHistory2Day`;
let urlGetMinNigthFlow = `${hostname}/GetMinNightFlow`;

let startDate = document.getElementById("startDate");
let startDatePrev = document.getElementById("startDatePrev");
let endDate = document.getElementById("endDate");
let endDatePrev = document.getElementById("endDatePrev");
let urlGetQuantityHourReport = `${hostname}/GetQuantityHourReport`;

let titleChartPressure = document.getElementById("titleChartPressure");
let titleChartFlow = document.getElementById("titleChartFlow");
let titleChartQuantity = document.getElementById("titleChartQuantity");
let titleChartMNF = document.getElementById("titleChartMNF");

let viewDetailAlarmLostWater = document.getElementById(
  "viewDetailAlarmLostWater"
);

let chart;
let chart2;
let chart3;
let chart4;

let loading = document.getElementById("loading");

// add hide
loading.classList.add("hide");

function fetchSites() {
  axios
    .get(urlGetSites)
    .then((res) => {
      createOptionsInSelectBoxWithSelectedValue(
        res.data,
        "selectSite",
        params.id
      );
    })
    .catch((err) => console.log(err));
}

fetchSites();

document.addEventListener(
  "DOMContentLoaded",
  function () {
    let time = new Date(parseInt(params.time));
    time.setHours(0);
    time.setMinutes(0);
    time.setSeconds(0);
    let temp = new Date(parseInt(params.time));
    temp.setHours(0);
    temp.setMinutes(0);
    temp.setSeconds(0);
    temp.setDate(temp.getDate() - 1);
    let temp2 = new Date(parseInt(params.time));
    temp2.setHours(0);
    temp2.setMinutes(0);
    temp2.setSeconds(0);
    temp2.setDate(temp2.getDate() - 2);
    let temp3 = new Date(parseInt(params.time));
    temp3.setHours(0);
    temp3.setMinutes(0);
    temp3.setSeconds(0);
    temp3.setDate(temp3.getDate() - 30);

    startDate.value = convertDateToDateTimeLocalInputTag(temp);
    endDate.value = convertDateToDateTimeLocalInputTag(time);
    startDatePrev.value = convertDateToDateTimeLocalInputTag(temp2);
    endDatePrev.value = convertDateToDateTimeLocalInputTag(temp);

    time.setHours(time.getHours() + 7);
    temp.setHours(temp.getHours() + 7);
    temp2.setHours(temp2.getHours() + 7);
    temp3.setHours(temp3.getHours() + 7);

    let totalMilisecondStart = temp.getTime();
    let totalMilisecondEnd = time.getTime();
    let totalMilisecondStartPrev = temp2.getTime();
    let totalMilisecond30Day = temp3.getTime();

    let url = `${urlGetDataPressureHistory2Day}/${params.id}/${totalMilisecondStart}/${totalMilisecondEnd}/${totalMilisecondStartPrev}/${totalMilisecondStart}`;

    let url2 = `${urlGetDataFlowHistory2Day}/${params.id}/${totalMilisecondStart}/${totalMilisecondEnd}/${totalMilisecondStartPrev}/${totalMilisecondStart}`;

    let url3 = `${urlGetQuantityHourReport}/${params.id}/${totalMilisecondStart}/${totalMilisecondEnd}`;
    let url4 = `${urlGetQuantityHourReport}/${params.id}/${totalMilisecondStartPrev}/${totalMilisecondStart}`;

    let url5 = `${urlGetMinNigthFlow}/${params.id}/${totalMilisecond30Day}/${totalMilisecondEnd}`;

    loading.classList.add("show");
    loading.classList.remove("hide");
    getData(url);
    titleChartPressure.innerHTML = `Biểu đồ thể hiện áp lực của ngày ${temp.getDate()} và ngày ${time.getDate()}`;
    getDataFlow(url2);
    titleChartFlow.innerHTML = `Biểu đồ thể hiện lưu lượng của ngày ${temp.getDate()} và ngày ${time.getDate()}`;
    getDataQuantity(url3, url4);
    titleChartQuantity.innerHTML = `Biểu đồ thể hiện sản lượng của ngày ${temp.getDate()} và ngày ${time.getDate()}`;
    getDataMNF(url5);
    titleChartMNF.innerHTML = `Biểu đồ thể hiện MNF từ ngày ${temp3.getDate()}/${
      temp3.getMonth() + 1
    } dến ngày ${time.getDate()}/${time.getMonth() + 1}`;
  },
  false
);

viewDetailAlarmLostWater.addEventListener("click", function () {
  loading.classList.add("show");
  loading.classList.remove("hide");

  let siteid = document.getElementById("selectSite").value;

  if (siteid == null || siteid == undefined || siteid.trim() == "") {
    swal("Lỗi", "Chưa chọn vị trí", "error");
  } else if (
    startDate.value == "" ||
    startDate.value == null ||
    startDate.value == undefined
  ) {
    swal("Lỗi", "Ngày bắt đầu chưa có", "error");
  } else if (
    endDate.value == "" ||
    endDate.value == null ||
    endDate.value == undefined
  ) {
    swal("Lỗi", "Ngày kết thúc chưa có", "error");
  } else if (
    startDatePrev.value == "" ||
    startDatePrev.value == null ||
    startDatePrev.value == undefined
  ) {
    swal("Lỗi", "Ngày bắt đầu chưa có", "error");
  } else if (
    endDatePrev.value == "" ||
    endDatePrev.value == null ||
    endDatePrev.value == undefined
  ) {
    swal("Lỗi", "Ngày kết thúc chưa có", "error");
  } else {
    let time = new Date(endDate.value);
    let temp = new Date(startDate.value);
    let temp2 = new Date(endDatePrev.value);
    let temp3 = new Date(startDatePrev.value);
    let temp4 = new Date(endDate.value);
    temp4.setDate(temp4.getDate() - 30);

    time.setHours(time.getHours() + 7);
    temp.setHours(temp.getHours() + 7);
    temp2.setHours(temp2.getHours() + 7);
    temp3.setHours(temp3.getHours() + 7);
    temp4.setHours(temp4.getHours() + 7);

    let totalMilisecondStart = temp.getTime();
    let totalMilisecondEnd = time.getTime();
    let totalMilisecondStartPrev = temp3.getTime();
    let totalMilisecondEndPrev = temp2.getTime();
    let totalMilisecond30Day = temp4.getTime();

    let url = `${urlGetDataPressureHistory2Day}/${siteid}/${totalMilisecondStart}/${totalMilisecondEnd}/${totalMilisecondStartPrev}/${totalMilisecondEndPrev}`;

    let url2 = `${urlGetDataFlowHistory2Day}/${siteid}/${totalMilisecondStart}/${totalMilisecondEnd}/${totalMilisecondStartPrev}/${totalMilisecondEndPrev}`;

    let url3 = `${urlGetQuantityHourReport}/${siteid}/${totalMilisecondStart}/${totalMilisecondEnd}`;
    let url4 = `${urlGetQuantityHourReport}/${siteid}/${totalMilisecondStartPrev}/${totalMilisecondEndPrev}`;

    let url5 = `${urlGetMinNigthFlow}/${siteid}/${totalMilisecond30Day}/${totalMilisecondEnd}`;

    loading.classList.add("show");
    loading.classList.remove("hide");
    getData(url);
    titleChartPressure.innerHTML = `Biểu đồ thể hiện áp lực của ngày ${temp.getDate()} và ngày ${time.getDate()}`;
    getDataFlow(url2);
    titleChartFlow.innerHTML = `Biểu đồ thể hiện lưu lượng của ngày ${temp.getDate()} và ngày ${time.getDate()}`;
    getDataQuantity(url3, url4);
    titleChartQuantity.innerHTML = `Biểu đồ thể hiện sản lượng của ngày ${temp.getDate()} và ngày ${time.getDate()}`;
    getDataMNF(url5);
    titleChartMNF.innerHTML = `Biểu đồ thể hiện MNF từ ngày ${temp3.getDate()}/${
      temp3.getMonth() + 1
    } dến ngày ${time.getDate()}/${time.getMonth() + 1}`;
  }
});

function getData(url) {
  axios
    .get(url)
    .then((res) => {
      loading.classList.add("hide");
      loading.classList.remove("show");
      drawChartMultiple(res.data, "chartPressure", chart);
      createTable(res.data, "tableDataPressure");
    })
    .catch((err) => console.log(err));
}

function getDataFlow(url) {
  axios
    .get(url)
    .then((res) => {
      loading.classList.add("hide");
      loading.classList.remove("show");
      drawChartMultiple(res.data, "chartFlow", chart2);
      createTable(res.data, "tableDataFlow");
    })
    .catch((err) => console.log(err));
}

function getDataQuantity(url, url2) {
  let result = [];

  axios
    .get(url)
    .then((res) => {
      loading.classList.add("hide");
      loading.classList.remove("show");
      result.push(res.data);
      axios
        .get(url2)
        .then((resp) => {
          result.push(resp.data);
          convertDataCommom(result);
          //drawChartMultiple(result, "chartQuantity", chart3);
          drawChartColumn(result, "chartQuantity", chart3);
          createTableQuantity(result, "tableDataQuantity");
        })
        .catch((err) => console.log(err));
    })
    .catch((err) => console.log(err));
}

function getDataMNF(url) {
  axios
    .get(url)
    .then((res) => {
      loading.classList.add("hide");
      loading.classList.remove("show");
      drawChartMultipleMNF(res.data, "chartMNF", chart4);
      createTableMNF(res.data[0], "tableDataMNF");
    })
    .catch((err) => console.log(err));
}

function drawChartMultiple(data, idDom, chart) {
  if (chart != null && chart != undefined) {
    chart.dispose();
  }

  if (data.length > 0) {
    am4core.useTheme(am4themes_animated);
    // Themes end
    am4core.addLicense("ch-custom-attribution");
    // Create chart instance
    chart = am4core.create(`${idDom}`, am4charts.XYChart);

    // Create axes
    var dateAxis = chart.xAxes.push(new am4charts.DateAxis());
    var valueAxis = chart.yAxes.push(new am4charts.ValueAxis());

    if (data[0].length > 0) {
      createSeries(data[0], "Giá trị sau");
    }
    if (data[1].length > 0) {
      createSeries(data[1], "Giá trị trước");
    }

    // Create series
    function createSeries(s, name) {
      var series = chart.series.push(new am4charts.LineSeries());
      series.dataFields.valueY = "Value";
      series.dataFields.dateX = "TimeStamp";
      series.id = name;
      series.name = name;
      series.tooltipText = "{valueY}";
      series.tooltip.pointerOrientation = "vertical";
      series.tooltip.background.fillOpacity = 0.5;
      series.legendSettings.valueText = "{valueY.close}";
      series.legendSettings.itemValueText = "{valueY}";

      var segment = series.segments.template;
      segment.interactionsEnabled = true;

      var hoverState = segment.states.create("hover");
      hoverState.properties.strokeWidth = 3;

      var dimmed = segment.states.create("dimmed");
      dimmed.properties.stroke = am4core.color("#dadada");

      segment.events.on("over", function (event) {
        processOver(event.target.parent.parent.parent);
      });

      segment.events.on("out", function (event) {
        processOut(event.target.parent.parent.parent);
      });
      for (let i = 0; i < s.length; i++) {
        s[i].TimeStamp = convertDateFromApi(s[i].TimeStamp);
      }
      series.data = s;
      return series;
    }

    chart.legend = new am4charts.Legend();
    chart.legend.position = "bottom";
    chart.legend.scrollable = true;
    chart.legend.labels.template.text = "[bold {color}]{name}[/]";

    chart.cursor = new am4charts.XYCursor();
    chart.cursor.xAxis = dateAxis;

    var scrollbarX = new am4core.Scrollbar();
    scrollbarX.marginBottom = 20;
    chart.scrollbarX = scrollbarX;

    // setTimeout(function() {
    //   chart.legend.markers.getIndex(0).opacity = 0.3;
    // }, 3000)
    chart.legend.markers.template.states.create(
      "dimmed"
    ).properties.opacity = 0.3;
    chart.legend.labels.template.states.create(
      "dimmed"
    ).properties.opacity = 0.3;

    chart.legend.itemContainers.template.events.on("over", function (event) {
      processOver(event.target.dataItem.dataContext);
    });

    chart.legend.itemContainers.template.events.on("out", function (event) {
      processOut(event.target.dataItem.dataContext);
    });

    function processOver(hoveredSeries) {
      hoveredSeries.toFront();

      hoveredSeries.segments.each(function (segment) {
        segment.setState("hover");
      });

      hoveredSeries.legendDataItem.marker.setState("default");
      hoveredSeries.legendDataItem.label.setState("default");

      chart.series.each(function (series) {
        if (series != hoveredSeries) {
          series.segments.each(function (segment) {
            segment.setState("dimmed");
          });
          series.bulletsContainer.setState("dimmed");
          series.legendDataItem.marker.setState("dimmed");
          series.legendDataItem.label.setState("dimmed");
        }
      });
    }

    function processOut() {
      chart.series.each(function (series) {
        series.segments.each(function (segment) {
          segment.setState("default");
        });
        series.bulletsContainer.setState("default");
        series.legendDataItem.marker.setState("default");
        series.legendDataItem.label.setState("default");
      });
    }

    // document.getElementById("button").addEventListener("click", function () {
    //   processOver(chart.series.getIndex(3));
    // });
  }
}

function drawChartMultipleMNF(data, idDom, chart) {
  if (chart != null && chart != undefined) {
    chart.dispose();
  }

  if (data.length > 0) {
    am4core.useTheme(am4themes_animated);
    // Themes end
    am4core.addLicense("ch-custom-attribution");
    // Create chart instance
    chart = am4core.create(`${idDom}`, am4charts.XYChart);

    // Create axes
    var dateAxis = chart.xAxes.push(new am4charts.DateAxis());
    var valueAxis = chart.yAxes.push(new am4charts.ValueAxis());

    if (data[0].length > 0) {
      createSeries(data[0], "MNF", false);
    }
    if (data[1].length > 0) {
      createSeries(data[1], "MNF Set", true);
    }

    // Create series
    function createSeries(s, name, isRed) {
      var series = chart.series.push(new am4charts.LineSeries());
      series.dataFields.valueY = "Value";
      series.dataFields.dateX = "TimeStamp";
      series.id = name;
      series.name = name;
      series.tooltipText = "{valueY}";
      series.tooltip.pointerOrientation = "vertical";
      series.tooltip.background.fillOpacity = 0.5;
      series.legendSettings.valueText = "{valueY.close}";
      series.legendSettings.itemValueText = "{valueY}";
      if (isRed == true) {
        series.stroke = am4core.color("#eb2f06");
      }

      var segment = series.segments.template;
      segment.interactionsEnabled = true;

      var hoverState = segment.states.create("hover");
      hoverState.properties.strokeWidth = 3;

      var dimmed = segment.states.create("dimmed");
      dimmed.properties.stroke = am4core.color("#dadada");

      segment.events.on("over", function (event) {
        processOver(event.target.parent.parent.parent);
      });

      segment.events.on("out", function (event) {
        processOut(event.target.parent.parent.parent);
      });
      for (let i = 0; i < s.length; i++) {
        s[i].TimeStamp = convertDateFromApi(s[i].TimeStamp);
      }
      series.data = s;
      return series;
    }

    chart.legend = new am4charts.Legend();
    chart.legend.position = "bottom";
    chart.legend.scrollable = true;
    chart.legend.labels.template.text = "[bold {color}]{name}[/]";

    chart.cursor = new am4charts.XYCursor();
    chart.cursor.xAxis = dateAxis;

    var scrollbarX = new am4core.Scrollbar();
    scrollbarX.marginBottom = 20;
    chart.scrollbarX = scrollbarX;

    // setTimeout(function() {
    //   chart.legend.markers.getIndex(0).opacity = 0.3;
    // }, 3000)
    chart.legend.markers.template.states.create(
      "dimmed"
    ).properties.opacity = 0.3;
    chart.legend.labels.template.states.create(
      "dimmed"
    ).properties.opacity = 0.3;

    chart.legend.itemContainers.template.events.on("over", function (event) {
      processOver(event.target.dataItem.dataContext);
    });

    chart.legend.itemContainers.template.events.on("out", function (event) {
      processOut(event.target.dataItem.dataContext);
    });

    function processOver(hoveredSeries) {
      hoveredSeries.toFront();

      hoveredSeries.segments.each(function (segment) {
        segment.setState("hover");
      });

      hoveredSeries.legendDataItem.marker.setState("default");
      hoveredSeries.legendDataItem.label.setState("default");

      chart.series.each(function (series) {
        if (series != hoveredSeries) {
          series.segments.each(function (segment) {
            segment.setState("dimmed");
          });
          series.bulletsContainer.setState("dimmed");
          series.legendDataItem.marker.setState("dimmed");
          series.legendDataItem.label.setState("dimmed");
        }
      });
    }

    function processOut() {
      chart.series.each(function (series) {
        series.segments.each(function (segment) {
          segment.setState("default");
        });
        series.bulletsContainer.setState("default");
        series.legendDataItem.marker.setState("default");
        series.legendDataItem.label.setState("default");
      });
    }

    // document.getElementById("button").addEventListener("click", function () {
    //   processOver(chart.series.getIndex(3));
    // });
  }
}

function createTable(data, idDom) {
  if (CheckExistsData(data)) {
    let dataConvert = convertData(data);

    let header = `<th>Thời gian</th><th>Giá trị trước</th><th>Giá trị sau</th>`;
    let body = ``;

    for (let item of dataConvert) {
      body += `<tr><td>${ConvertDataIntoTable(
        item.TimeStamp
      )}</td><td>${ConvertDataIntoTable(
        item.Prev
      )}</td><td>${ConvertDataIntoTable(item.Current)}</td></tr>`;
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

function createTableQuantity(data, idDom) {
  if (CheckExistsData(data)) {
    let dataConvert = convertDataForChartColum(data);

    let header = `<th>Thời gian</th><th>Giá trị trước</th><th>Giá trị sau</th>`;
    let body = ``;

    for (let item of dataConvert) {
      body += `<tr><td>${ConvertDataIntoTable(
        item.TimeStamp
      )}</td><td>${ConvertDataIntoTable(
        item.Prev
      )}</td><td>${ConvertDataIntoTable(item.Current)}</td></tr>`;
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

function createTableMNF(data, idDom) {
  if (CheckExistsData(data)) {
    let header = `<th>Thời gian</th><th>Giá trị</th>`;
    let body = ``;

    for (let item of data) {
      body += `<tr><td>${convertDateToStringNotTime(
        new Date(item.TimeStamp)
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

function convertData(data) {
  let result = [];

  if (data.length > 0) {
    let max = data[0].length;
    let index = 0;
    for (let i = 0; i < data.length; i++) {
      if (max < data[i].length) {
        max = data[i].length;
        index = i;
      }
    }
    for (let i = 0; i < max; i++) {
      let obj = {};
      let time = new Date(data[index][i].TimeStamp);
      obj.TimeStamp = `${time.getHours()}: ${time.getMinutes()}`;
      for (let j = 0; j < data.length; j++) {
        try {
          if (data != null && data != undefined) {
            if (data[j] != null && data[j] != undefined) {
              if (data[j][i] != null && data[j][i] != undefined) {
                if (data[j][i].Value != null && data[j][i].Value != undefined) {
                  if (j == 0) {
                    obj.Current = data[j][i].Value;
                  } else if (j == 1) {
                    obj.Prev = data[j][i].Value;
                  }
                }
              }
            }
          }
        } catch (err) {
          console.log(err);
        }
      }
      result.push(obj);
    }
  }

  return result;
}

function convertDataForChartColum(data) {
  let result = [];

  if (data.length > 0) {
    let max = data[0].length;
    let index = 0;
    for (let i = 0; i < data.length; i++) {
      if (max < data[i].length) {
        max = data[i].length;
        index = i;
      }
    }
    for (let i = 0; i < max - 1; i++) {
      let obj = {};
      let time = convertDateFromApi(data[index][i].TimeStamp);
      obj.TimeStamp = `${time.getHours()}`;
      for (let j = 0; j < data.length; j++) {
        try {
          if (data != null && data != undefined) {
            if (data[j] != null && data[j] != undefined) {
              if (data[j][i] != null && data[j][i] != undefined) {
                if (data[j][i].Value != null && data[j][i].Value != undefined) {
                  if (j == 0) {
                    obj.Current = data[j][i].Value;
                  } else if (j == 1) {
                    obj.Prev = data[j][i].Value;
                  }
                }
              }
            }
          }
        } catch (err) {
          console.log(err);
        }
      }
      result.push(obj);
    }
  }

  return result;
}

function convertDataCommom(data) {
  if (data[0].length > 0) {
    for (let i = 0; i < data[0].length; i++) {
      data[1][i].TimeStamp = data[0][i].TimeStamp;
    }
  }
}

function drawChartColumn(data, idDom, chart) {
  am4core.ready(function () {
    if (chart != null && chart != undefined) {
      chart.dispose();
    }
    // Themes begin
    am4core.useTheme(am4themes_animated);
    // Themes end

    am4core.useTheme(am4themes_animated);
    am4core.addLicense("ch-custom-attribution");

    chart = am4core.create(`${idDom}`, am4charts.XYChart);
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
        "Hour {categoryX}: [bold]{valueY}[/]";
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

    chart.data = convertDataForChartColum(data);

    createSeries("Current", "Sản lượng sau");
    createSeries("Prev", "Sản lượng trước");

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
