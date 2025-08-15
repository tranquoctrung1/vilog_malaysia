let userName = document.getElementById("userName").innerHTML;
if (userName == null || userName == undefined || userName.trim() == "") {
  userName = "admin";
}
let urlGetSites = `${hostname}/GetSiteByUId/${userName}`;
let urlGetChannelBySiteId = `${hostname}/GetChannelBySiteId`;
let urlGetChannelCard = `${hostname}/GetChannelCard`;
let urlGetCurrentTimeStampBySiteId = `${hostname}/GetCurrentTimeStampBySiteId`;
let urlGetDataMultipleChannel = `${hostname}/GetMultipleChannelData`;
let urlGetDataMultipleChannelToCreateTable = `${hostname}/GetDataMultipleChannelToCreateTable`;

let loading = document.getElementById("loading");

let listChannel = [];
let channels = [];
let startDateTime;
let endDateTime;

let chart;

// add hide
loading.classList.add("hide");

function fetchSites() {
  axios
    .get(urlGetSites)
    .then((res) => {
      if (res.data.length > 0) {
        createOptionsInSelectBox(res.data, "selectSite");

        // first load data
        selectSite.selectedIndex = 1;
        loading.classList.remove("hide");
        loading.classList.add("show");

        LoadListChannel(selectSite.value);
        LoadCurrentTimeStampBySiteId(selectSite.value);
      }
    })
    .catch((err) => console.log(err));
}

fetchSites();

function CardsLoad(siteID, start, end) {
  var url = `${urlGetChannelCard}/${siteID}/${start}/${end}`;
  var html = "";
  axios
    .get(url)
    .then(function (res) {
      loading.classList.remove("show");
      loading.classList.add("hide");
      for (let c of res.data) {
        if (CheckIsDisplay(c.ChannelId) > -1) {
          html +=
            '<div class="col-xl-4 col-md-6 mb-4" id="card-' +
            c.ChannelId +
            '">' +
            '<div class="card border-left-primary shadow h-100" style="border-left: 5px solid #74b9ff">' +
            '<div class="card-body">' +
            '<div class="row no-gutters align-items-center">' +
            '<div class="col-7 mr-2">' +
            '<div class="h5 font-weight-bold text-primary mb-1">' +
            c.ChannelName +
            " (" +
            c.Unit +
            ")</div>" +
            '<div class="h6 font-weight-bold text-success mb-1">' +
            c.LastValue +
            "</div>" +
            '<div class="text-xs">' +
            convertDateToString(convertDateFromApi(c.TimeStamp)) +
            "</div>" +
            "</div>" +
            '<div class="col-4">' +
            '<div class="row">' +
            '<div class="col-12 text-xs text-primary text-center " style="font-weight: bold">MAX</div>' +
            '<div class="col-12 text-center"  style="font-weight: bold">' +
            c.MaxValue +
            "</div>" +
            '<div class="col-12 text-xs text-primary text-center"  style="font-weight: bold">MIN</div>' +
            '<div class="col-12 text-center"  style="font-weight: bold">' +
            c.MinValue +
            "</div>" +
            "</div></div>" +
            "</div>" +
            "</div>" +
            "</div>" +
            "</div>" +
            "</div>";
        } else {
          html +=
            '<div class="col-xl-4 col-md-6 mb-4 d-none" id="card-' +
            c.ChannelId +
            '">' +
            '<div class="card border-left-primary shadow h-100" style="border-left: 5px solid #74b9ff">' +
            '<div class="card-body">' +
            '<div class="row no-gutters align-items-center">' +
            '<div class="col-7 mr-2">' +
            '<div class="h5 font-weight-bold text-primary mb-1">' +
            c.ChannelName +
            " (" +
            c.Unit +
            ")</div>" +
            '<div class="h6 font-weight-bold text-success mb-1">' +
            c.LastValue +
            "</div>" +
            '<div class="text-xs">' +
            convertDateToString(convertDateFromApi(c.TimeStamp)) +
            "</div>" +
            "</div>" +
            '<div class="col-4">' +
            '<div class="row">' +
            '<div class="col-12 text-xs text-primary text-center " style="font-weight: bold">MAX</div>' +
            '<div class="col-12 text-center"  style="font-weight: bold">' +
            c.MaxValue +
            "</div>" +
            '<div class="col-12 text-xs text-primary text-center"  style="font-weight: bold">MIN</div>' +
            '<div class="col-12 text-center"  style="font-weight: bold">' +
            c.MinValue +
            "</div>" +
            "</div></div>" +
            "</div>" +
            "</div>" +
            "</div>" +
            "</div>" +
            "</div>";
        }
      }
      document.getElementById("channel_cards").innerHTML = html;
    })
    .catch((err) => console.log(err));
}
////Cards
function CheckIsDisplay(channelid) {
  return listChannel.indexOf(channelid);
}

function LoadListChannel(siteid) {
  listChannel = [];

  let url = `${urlGetChannelBySiteId}/${siteid}`;
  let bodyModal = document.getElementById("bodyModal");
  bodyModal.innerHTML = "";
  axios
    .get(url)
    .then(function (res) {
      let content = "";
      for (let item of res.data) {
        content += `<div class="form-check">
                        <input class="form-check-input" type="checkbox" value="${item.ChannelId}" id="${item.ChannelId}" data-channel="${item.ChannelId}" checked>
                        <label class="form-check-label" for="${item.ChannelId}">
                        ${item.ChannelName}
                        </label>
                </div>`;
        listChannel.push(item.ChannelId);
      }
      bodyModal.innerHTML = content;
      AllowChangeCheckBox();
    })
    .catch((err) => console.log(err));
}

function AllowChangeCheckBox() {
  let checkBoxs = document.getElementsByClassName("form-check-input");
  for (let checkbox of checkBoxs) {
    checkbox.addEventListener("change", function (e) {
      if (checkbox.checked == true) {
        let cardElement = document.getElementById(
          `card-${checkbox.dataset.channel}`
        );
        listChannel.push(checkbox.dataset.channel);
        if (cardElement.classList.contains("d-none")) {
          cardElement.classList.remove("d-none");
        }

        let seriesId = chart.map.getKey(checkbox.dataset.channel);
        seriesId.show();
      } else {
        let cardElement = document.getElementById(
          `card-${checkbox.dataset.channel}`
        );
        if (!cardElement.classList.contains("d-none")) {
          cardElement.classList.add("d-none");
        }

        let seriesId = chart.map.getKey(checkbox.dataset.channel);
        seriesId.hide();

        let indexOfElement = listChannel.indexOf(checkbox.dataset.channel);
        if (indexOfElement > -1) {
          listChannel.splice(indexOfElement, 1);
        }
      }
    });
  }
}

let selectSite = document.getElementById("selectSite");

selectSite.addEventListener("change", function (e) {
  loading.classList.remove("hide");
  loading.classList.add("show");

  LoadListChannel(e.target.value);
  LoadCurrentTimeStampBySiteId(e.target.value);
});

let filterChannel = document.getElementById("filterChannel");

filterChannel.addEventListener("click", function () {
  $("#Model").modal("show");
});

function LoadCurrentTimeStampBySiteId(siteId) {
  let startDate = document.getElementById("startDate");
  let endDate = document.getElementById("endDate");

  let url = `${urlGetCurrentTimeStampBySiteId}/${siteId}`;

  axios
    .get(url)
    .then((res) => {
      if (CheckExistsData(res.data)) {
        let end = convertDateFromApi(res.data[0].TimeStamp);
        let t = convertDateFromApi(res.data[0].TimeStamp);

        t.setDate(t.getDate() - 1);
        end.setDate(end.getDate() + 1);

        startDate.value = convertDateToDateInputTag(t);
        endDate.value = convertDateToDateInputTag(end);

        let totalMilisecondStart = t.getTime();
        let totalMilisecondEnd = end.getTime();

        startDateTime = totalMilisecondStart;
        endDateTime = totalMilisecondEnd;

        CardsLoad(siteId, totalMilisecondStart, totalMilisecondEnd);
        GetDataMultipleChannel();
        CreateDataTable();
      }
    })
    .catch((err) => console.log(err));
}

function GetDataMultipleChannel() {
  let mutipleChannels = listChannel.join("|");

  let url = `${urlGetDataMultipleChannel}/${mutipleChannels}/${startDateTime}/${endDateTime}`;

  axios
    .get(url)
    .then((res) => {
      if (CheckExistsData(res.data)) {
        drawChartMultiple(res.data);
      }
    })
    .catch((err) => console.log(err));
}

function drawChartMultiple(data) {
  if (chart != null && chart != undefined) {
    chart.dispose();
  }

  if (data.length > 1) {
    am4core.useTheme(am4themes_animated);
    // Themes end
    am4core.addLicense("ch-custom-attribution");
    // Create chart instance
    chart = am4core.create("chart", am4charts.XYChart);

    // Create axes
    var dateAxis = chart.xAxes.push(new am4charts.DateAxis());
    var valueAxis = chart.yAxes.push(new am4charts.ValueAxis());

    for (var i = 0; i < data.length; i++) {
      if (data[i].length > 1) {
        createSeries(data[i], data[i][data[i].length - 1]);
      }
    }

    // Create series
    function createSeries(s, name) {
      var series = chart.series.push(new am4charts.LineSeries());
      series.dataFields.valueY = "Value";
      series.dataFields.dateX = "TimeStamp";
      series.id = name.channelid;
      series.name = name.channelname;
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
      for (let i = 0; i < s.length - 1; i++) {
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

function CreateDataTable() {
  let mutipleChannels = listChannel.join("|");

  let url = `${urlGetDataMultipleChannelToCreateTable}/${mutipleChannels}/${startDateTime}/${endDateTime}`;

  axios
    .get(url)
    .then((res) => {
      let dataTable = document.getElementById("dataTable");

      dataTable.innerHTML = "";

      if (CheckExistsData(res.data)) {
        let header = "";
        let body = "";

        let dataConvert = convertData(res.data);
        for (let i = 0; i < dataConvert.length; i++) {
          if (i == 0) {
            for (let pro of Object.getOwnPropertyNames(dataConvert[0])) {
              if (pro == "TimeStamp") {
                header += `<th>TimeStamp</th>`;
              } else {
                header += `<th>${pro}</th>`;
              }
            }
          } else {
            body += `<tr>`;
            for (let pro in dataConvert[i]) {
              if (pro == "TimeStamp") {
                body += `<td>${convertDateToString(dataConvert[i][pro])}</td>`;
              } else {
                body += `<td>${dataConvert[i][pro]}</td>`;
              }
            }
            body += `</tr>`;
          }
        }

        dataTable.innerHTML = `<table class="table table-bordered dataTable no-footer" id="dataTable2" cellspacing="0" style="width: 100%;overflow-y:auto" role="grid" aria-describedby="dataTable_info"> 
        <thead> ${header} 
        </thead> 
        <tbody>  ${body} 
        </tbody> 
        <tfoot>${header}</tfoot>
        </table > `;

        $("#dataTable2").DataTable({
          pageLength: 20,
          order: [[0, "desc"]],
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
              title: `Bang_Chi_Tiet_Tu_${startDateTime}_Den_${endDateTime}`,
            },
            {
              extend: "csvHtml5",
              title: `Bang_Chi_Tiet_Tu_${startDateTime}_Den_${endDateTime}`,
            },
            {
              extend: "pdfHtml5",
              title: `Bang_Chi_Tiet_Tu_${startDateTime}_Den_${endDateTime}`,
            },
          ],
        });
      }
    })
    .catch((err) => console.log(err));
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
      if (data[i][0] != undefined) {
        channels.push(data[i][0].ChannelName);
      }
    }
    for (let i = 0; i < max; i++) {
      let obj = {};
      obj.TimeStamp = convertDateFromApi(data[index][i].TimeStamp);
      for (let j = 0; j < data.length; j++) {
        try {
          if (data != null && data != undefined) {
            if (data[j] != null && data[j] != undefined) {
              if (data[j][i] != null && data[j][i] != undefined) {
                if (data[j][i].Value != null && data[j][i].Value != undefined) {
                  obj[`${data[j][i].ChannelName}`] = data[j][i].Value;
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

let viewDataOnline = document.getElementById("viewDataOnline");

viewDataOnline.addEventListener("click", function (e) {
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
    swal("Lỗi", "Ngày bắt đầu chưa có", "error");
  } else if (
    endDate.value == "" ||
    endDate.value == null ||
    endDate.value == undefined
  ) {
    swal("Lỗi", "Ngày kết thúc chưa có", "error");
  } else {
    let start = new Date(startDate.value);
    let end = new Date(endDate.value);

    // start.setHours(start.getHours() + 7);
    // end.setHours(end.getHours() + 7);

    let totalMilisecondStart = start.getTime();
    let totalMilisecondEnd = end.getTime();

    startDateTime = totalMilisecondStart;
    endDateTime = totalMilisecondEnd;

    CardsLoad(siteid, totalMilisecondStart, totalMilisecondEnd);
    GetDataMultipleChannel();
    CreateDataTable();
  }
});

setInterval(function () {
  let siteid = document.getElementById("selectSite").value;

  startDateTime += 300000;
  endDateTime += 300000;

  CardsLoad(siteid, startDateTime, endDateTime);
  GetDataMultipleChannel();
  CreateDataTable();
}, 300000);
