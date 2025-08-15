let urlGetListNameStation = `${hostname}/GetListNameStation`;
let urlGetListDataCameraByStationName = `${hostname}/GetListDataCameraByStationName`;

var canvas1;
var ws1;
var player1;
var canvas2;
var ws2;
var player2;
let dataCam;

let linkCamera = document.getElementById("linkCamera");

// cam1
let play1 = document.getElementById("play1");
let pause1 = document.getElementById("pause1");
let zoomIn1 = document.getElementById("zoomIn1");
let zoomOut1 = document.getElementById("zoomOut1");
// cam2
let play2 = document.getElementById("play2");
let pause2 = document.getElementById("pause2");
let zoomIn2 = document.getElementById("zoomIn2");
let zoomOut2 = document.getElementById("zoomOut2");

async function fetchStation() {
  let result = await axios.get(urlGetListNameStation);
  createOptionsInNameStationSelectox(result.data, "selectStation");
}

//fetchStation();

async function GetDataCamera(name) {
  let url = `${urlGetListDataCameraByStationName}/${name}`;
  let result = await axios.get(url);
  return result.data;
}

document.addEventListener("DOMContentLoaded", async (event) => {
  await fetchStation();

  dataCam = await GetDataCamera(selectStation.value);

  if (dataCam.length > 0) {
    if (dataCam[0] != null && dataCam[0] != undefined) {
      // init camera
      // cam1
      canvas1 = document.getElementById("canvas1");
      ws1 = new WebSocket(`ws://${dataCam[0].Ip}:${dataCam[0].Port}`);
      player1 = new jsmpeg(ws1, {
        canvas: canvas1,
        autoplay: true,
        audio: true,
        loop: true,
        seekable: true,
      });
    }

    if (dataCam[1] != null && dataCam[1] != undefined) {
      // cam2
      canvas2 = document.getElementById("canvas2");
      ws2 = new WebSocket(`ws://${dataCam[1].Ip}:${dataCam[1].Port}`);
      player2 = new jsmpeg(ws2, {
        canvas: canvas2,
        autoplay: true,
        audio: true,
        loop: true,
        seekable: true,
      });
    }
  }
  linkCamera.href = `http://${dataCam[0].IpWeb}/doc/page/preview.asp`;
});

// function for cam 1
play1.addEventListener("click", function () {
  ws1 = new WebSocket(`ws://${dataCam[0].Ip}:${dataCam[0].Port}`);
  player1 = new jsmpeg(ws1, {
    canvas: canvas1,
    autoplay: true,
    audio: true,
    loop: true,
  });
  console.log("cam1 is started");
  pause1.disabled = false;
  pause1.classList.remove("disabled");
  play1.disabled = true;
  play1.classList.add("disabled");
  return false;
});
pause1.addEventListener("click", function () {
  console.log("cam1 is stoped");
  player1.stop();
  play1.disabled = false;
  play1.classList.remove("disabled");
  pause1.disabled = true;
  pause1.classList.add("disabled");
  return false;
});
zoomIn1.addEventListener("click", function (e) {
  let boxCamera = document.getElementById(`camera1`);
  boxCamera.classList.add("zoom");
  zoomIn1.disabled = true;
  zoomIn1.classList.add("disabled");
  zoomOut1.disabled = false;
  zoomOut1.classList.remove("disabled");
  console.log("zoom in cam1");
  return false;
});
zoomOut1.addEventListener("click", function (e) {
  let boxCamera = document.getElementById(`camera1`);
  boxCamera.classList.remove("zoom");
  zoomIn1.disabled = false;
  zoomIn1.classList.remove("disabled");
  zoomOut1.disabled = true;
  zoomOut1.classList.add("disabled");
  console.log("zoom out cam1");
  return false;
});
// function for cam2
play2.addEventListener("click", function () {
  ws2 = new WebSocket(`ws://${dataCam[1].Ip}:${dataCam[1].Port}`);
  player2 = new jsmpeg(ws2, {
    canvas: canvas2,
    autoplay: true,
    audio: true,
    loop: true,
  });
  console.log("cam2 is started");
  pause2.disabled = false;
  pause2.classList.remove("disabled");
  play2.disabled = true;
  play2.classList.add("disabled");
  return false;
});
pause2.addEventListener("click", function () {
  console.log("cam2 is stoped");
  player2.stop();
  play2.disabled = false;
  play2.classList.remove("disabled");
  pause2.disabled = true;
  pause2.classList.add("disabled");
  return false;
});
zoomIn2.addEventListener("click", function (e) {
  let boxCamera = document.getElementById(`camera2`);
  boxCamera.classList.add("zoom");
  zoomIn2.disabled = true;
  zoomIn2.classList.add("disabled");
  zoomOut2.disabled = false;
  zoomOut2.classList.remove("disabled");
  console.log("zoom in cam2");
  return false;
});
zoomOut2.addEventListener("click", function (e) {
  let boxCamera = document.getElementById(`camera2`);
  boxCamera.classList.remove("zoom");
  zoomIn2.disabled = false;
  zoomIn2.classList.remove("disabled");
  zoomOut2.disabled = true;
  zoomOut2.classList.add("disabled");
  console.log("zoom out cam2");
  return false;
});

let selectStation = document.getElementById("selectStation");

selectStation.addEventListener("change", async function (e) {
  dataCam = await GetDataCamera(e.target.value);
  if (dataCam.length > 0) {
    if (dataCam[0] != null && dataCam[0] != undefined) {
      // init camera
      // cam1
      player1.stop();
      canvas1 = document.getElementById("canvas1");
      ws1 = new WebSocket(`ws://${dataCam[0].Ip}:${dataCam[0].Port}`);
      player1 = new jsmpeg(ws1, {
        canvas: canvas1,
        autoplay: true,
        audio: true,
        loop: true,
        seekable: true,
      });
    }
    if (dataCam[1] != null && dataCam[1] != undefined) {
      // cam2
      player2.stop();
      canvas2 = document.getElementById("canvas2");
      ws2 = new WebSocket(`ws://${dataCam[1].Ip}:${dataCam[1].Port}`);
      player2 = new jsmpeg(ws2, {
        canvas: canvas2,
        autoplay: true,
        audio: true,
        loop: true,
        seekable: true,
      });
    }
  }
  linkCamera.href = `http://${dataCam[0].IpWeb}/doc/page/preview.asp`;
});
