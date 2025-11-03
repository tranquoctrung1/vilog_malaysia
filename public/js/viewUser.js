const urlGetUser = `${hostname}/GetUser`;
const urlDeleteUser = `${hostname}/DeleteUser`;
const urlGetStatusSite = `${hostname}/GetStatusSite`;

let bodyTable = document.getElementById('bodyTable');

function getData() {
    getDataAndDrawTable();
}

function createBody(data) {
    bodyTable.innerHTML = '';

    let content = '';

    if (CheckExistsData(data)) {
        for (let item of data) {
            content += `<tr>`;
            content += `<td>${ConvertDataIntoTable(item.Username)}</td>`;
            content += `<td>${ConvertDataIntoTable(item.Email)}</td>`;
            content += `<td>${ConvertDataIntoTable(item.Role)}</td>`;
            content += `<td>${ConvertDataIntoTable(item.StaffId)}</td>`;
            content += `<td>${ConvertDataIntoTable(item.ConsumerId)}</td>`;
            content += `<td class="text-center"><span class="site-count-link" data-bs-toggle="modal" data-bs-target="#siteListModal" data-username="${item.Username}" data-site-count="${item.sites}" data-id="${item._id}"><span class="site-count-badge">${item.sites}</span></span></td>`;
            content += `<td> <button class="btn btn-danger btn-sm" data-id="${item._id}" onclick="onBtnDeleteClicked(this)"><i class="fa fa-trash"></i> Delete</button></td>`;
            content += `</tr>`;
        }
    }
    bodyTable.innerHTML = content;
}

function getDataAndDrawTable() {
    axios
        .get(urlGetUser)
        .then((res) => {
            if ($.fn.DataTable.isDataTable('#userTable')) {
                $('#userTable').DataTable().clear().destroy();
            }

            createBody(res.data);

            const isMobile = /Mobi|Android/i.test(navigator.userAgent);

            $('#userTable').DataTable({
                language: {
                    search: 'Search:',
                    lengthMenu: 'Show _MENU_ entries',
                    info: 'Showing _START_ to _END_ of _TOTAL_ entries',
                    paginate: { previous: 'Previous', next: 'Next' },
                },
                pageLength: 20,
                order: [[0, 'desc']],
                initComplete: function () {
                    this.api()
                        .columns([0])
                        .every(function () {
                            var column = this;
                            var select = $(
                                '<select><option value=""></option></select>',
                            )
                                .appendTo($(column.footer()).empty())
                                .on('change', function () {
                                    var val = $.fn.dataTable.util.escapeRegex(
                                        $(this).val(),
                                    );
                                    column
                                        .search(
                                            val ? '^' + val + '$' : '',
                                            true,
                                            false,
                                        )
                                        .draw();
                                });
                            column
                                .data()
                                .unique()
                                .sort()
                                .each(function (d, j) {
                                    select.append(
                                        '<option value="' +
                                            d +
                                            '">' +
                                            d +
                                            '</option>',
                                    );
                                });
                        });
                },
                dom: isMobile ? 'frtip' : 'lBrtip',
                buttons: isMobile
                    ? []
                    : [
                          {
                              extend: 'excel',
                              text: '<i class="fas fa-file-excel me-1"></i> Excel',
                              className: 'btn btn-sm buttons-excel',
                              filename: `user_list`,
                          },
                          {
                              extend: 'csv',
                              text: '<i class="fas fa-file-csv me-1"></i> CSV',
                              className: 'btn btn-sm buttons-csv',
                              filename: `user_list`,
                          },
                          {
                              extend: 'pdf',
                              text: '<i class="fas fa-file-pdf me-1"></i> PDF',
                              className: 'btn btn-sm buttons-pdf',
                              filename: `user_list`,
                          },
                      ],
                responsive: isMobile
                    ? {
                          details: {
                              type: 'inline',
                              display:
                                  $.fn.dataTable.Responsive.display.childRow,
                          },
                      }
                    : false,
                columnDefs: [
                    { responsivePriority: 1, targets: 0 },
                    { responsivePriority: 2, targets: -1 },
                ],
            });
        })
        .catch((err) => console.log(err));
}

function onBtnDeleteClicked(e) {
    swal({
        title: 'Are you sure?',
        text: "You won't be able to revert this!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, delete it!',
    }).then((willDelete) => {
        if (willDelete) {
            let url = `${urlDeleteUser}/${CreateDataNullForPost(e.dataset.id)}`;
            axios
                .post(url)
                .then((res) => {
                    if (res.data != 0) {
                        swal('success', 'Delete success!!', 'success');
                        getDataAndDrawTable();
                    } else {
                        swal('Error', 'Delete failed', 'error');
                    }
                })
                .catch((err) => console.log(err));
        }
    });
}
getData();

$('#siteListModal').on('show.bs.modal', function (event) {
    if ($.fn.DataTable.isDataTable('#siteListTable')) {
        $('#siteListTable').DataTable().clear().destroy();
    }

    const button = $(event.relatedTarget);
    const username = button.data('username');
    const siteCount = button.data('site-count');
    const sitesJson = button.closest('tr').attr('data-sites-details');

    const modal = $(this);
    modal.find('#modalUsername').text(username);
    modal.find('#modalSiteCount').text(siteCount);

    const tableBody = modal.find('#siteListContainer');
    tableBody.empty();

    let url = `${urlGetStatusSite}/${username}`;

    axios
        .get(url)
        .then((res) => {
            let data = [];
            let temp = [];

            for (const item of res.data.siteDelay) {
                const obj = {};
                const find = res.data.sites.find(
                    (el) => el.SiteId === item.SiteId,
                );
                temp.push(item.SiteId);

                if (find !== undefined) {
                    obj.LastData = find.ListChannel[0].TimeStamp;
                }

                obj.Location = item.Location;
                obj.SiteId = item.SiteId;
                obj.Status = 'Disconnected';
                obj.Alarm = 'No';

                data.push(obj);
            }
            for (const item of res.data.siteAlarm) {
                const f = temp.find((el) => el === item.SiteId);
                if (f === undefined) {
                    const obj = {};
                    const find = res.data.sites.find(
                        (el) => el.SiteId === item.SiteId,
                    );

                    if (find !== undefined) {
                        obj.LastData = find.ListChannel[0].TimeStamp;
                    }

                    obj.Location = item.Location;
                    obj.SiteId = item.SiteId;
                    obj.Status = 'Connected';
                    obj.Alarm = 'Yes';

                    temp.push(item.SiteId);
                    data.push(obj);
                }
            }

            for (const item of res.data.siteHasValue) {
                const f = temp.find((el) => el === item.SiteId);
                if (f === undefined) {
                    const obj = {};
                    const find = res.data.sites.find(
                        (el) => el.SiteId === item.SiteId,
                    );

                    if (find !== undefined) {
                        obj.LastData = find.ListChannel[0].TimeStamp;
                    }

                    obj.Location = item.Location;
                    obj.SiteId = item.SiteId;
                    obj.Status = 'Connected';
                    obj.Alarm = 'No';

                    temp.push(item.SiteId);
                    data.push(obj);
                }
            }

            data.sort((a, b) => a.Location.localeCompare(b.Location));

            if (data.length > 0) {
                for (const item of data) {
                    const statusHtml = renderStatusTag(item.Status);
                    const alarmHtml = renderAlarmTag(item.Alarm);
                    const row = `
                    <tr>
                        <td>${item.SiteId}</td>
                        <td>${item.Location}</td>
                        <td>${statusHtml}</td>
                        <td>${convertDateToString(
                            convertDateFromApi(item.LastData),
                        )}</td>
                        <td>${alarmHtml}</td>
                    </tr>`;
                    tableBody.append(row);
                }

                const isMobile = /Mobi|Android/i.test(navigator.userAgent);

                $('#siteListTable').DataTable({
                    language: {
                        search: 'Search:',
                        lengthMenu: 'Show _MENU_ entries',
                        info: 'Showing _START_ to _END_ of _TOTAL_ entries',
                        paginate: { previous: 'Previous', next: 'Next' },
                    },
                    pageLength: 20,
                    order: [[0, 'desc']],
                    initComplete: function () {
                        this.api()
                            .columns([0])
                            .every(function () {
                                var column = this;
                                var select = $(
                                    '<select><option value=""></option></select>',
                                )
                                    .appendTo($(column.footer()).empty())
                                    .on('change', function () {
                                        var val =
                                            $.fn.dataTable.util.escapeRegex(
                                                $(this).val(),
                                            );
                                        column
                                            .search(
                                                val ? '^' + val + '$' : '',
                                                true,
                                                false,
                                            )
                                            .draw();
                                    });
                                column
                                    .data()
                                    .unique()
                                    .sort()
                                    .each(function (d, j) {
                                        select.append(
                                            '<option value="' +
                                                d +
                                                '">' +
                                                d +
                                                '</option>',
                                        );
                                    });
                            });
                    },
                    dom: isMobile ? 'frtip' : 'lBrtip',
                    buttons: isMobile
                        ? []
                        : [
                              {
                                  extend: 'excel',
                                  text: '<i class="fas fa-file-excel me-1"></i> Excel',
                                  className: 'btn btn-sm buttons-excel',
                                  filename: `user_list`,
                              },
                              {
                                  extend: 'csv',
                                  text: '<i class="fas fa-file-csv me-1"></i> CSV',
                                  className: 'btn btn-sm buttons-csv',
                                  filename: `user_list`,
                              },
                              {
                                  extend: 'pdf',
                                  text: '<i class="fas fa-file-pdf me-1"></i> PDF',
                                  className: 'btn btn-sm buttons-pdf',
                                  filename: `user_list`,
                              },
                          ],
                    responsive: isMobile
                        ? {
                              details: {
                                  type: 'inline',
                                  display:
                                      $.fn.dataTable.Responsive.display
                                          .childRow,
                              },
                          }
                        : false,
                    columnDefs: [
                        { responsivePriority: 1, targets: 0 },
                        { responsivePriority: 2, targets: -1 },
                    ],
                });
            } else {
                tableBody.append(`
                <tr>
                    <td colspan="5" class="text-center text-muted">
                        This user currently manages 0 sites.
                    </td>
                </tr>
            `);
            }
        })
        .catch((err) => {
            console.error(err);
        });
});

function renderStatusTag(status) {
    if (status === 'Connected') {
        return `<span class="status-tag tag-success">Connected</span>`;
    } else if (status === 'Disconnected') {
        return `<span class="status-tag tag-warning">Disconnected</span>`;
    }
    return status;
}

// Function to render alarm tags in modal
function renderAlarmTag(alarm) {
    if (alarm === 'Yes') {
        return `<span class="status-tag tag-danger">ALARM</span>`;
    } else if (alarm === 'No') {
        return `<span class="status-tag tag-success">NORMAL</span>`;
    }
    return alarm;
}
