let urlGetUserByRoleConsumer = `${hostname}/GetUserByRoleConsumer`;
let urlGetUserByUserName = `${hostname}/GetUserByUserName`;
let urlGetSiteNotPermissionConsumer = `${hostname}/GetSiteNotPremissionConsumer`;
let urlGetSitePermissionConsumer = `${hostname}/GetSitePremissionConsumer`;
let urlUpdateConsumerSite = `${hostname}/UpdateConsumerSite`;
let urlGetSiteByUid = `${hostname}/GetSiteByUId/bavitech`;

function GetUser() {
    axios
        .get(urlGetUserByRoleConsumer)
        .then((res) => {
            createOptionsInUserNameSelectConsumerBoxPermission(
                res.data,
                'consumerSelect',
            );
        })
        .catch((err) => console.log(err));
}

GetUser();

async function getSite() {
    const res = await axios.get(urlGetSiteByUid);

    return res.data;
}

async function getSitePermission(id) {
    const res = await axios.get(`${urlGetSitePermissionConsumer}/${id}`);

    return res.data;
}

$(document).ready(async function () {
    const dataSite = await getSite();

    const ALL_SITES_MAPPED = {};

    for (const item of dataSite) {
        ALL_SITES_MAPPED[item._id] = item.SiteId + '|' + item.Location;
    }

    const ALL_SITE_IDS = Object.keys(ALL_SITES_MAPPED).sort();

    console.log(ALL_SITE_IDS);
    let currentAssignedSites = [];

    function createListItem(siteId) {
        const location = ALL_SITES_MAPPED[siteId] || 'N/A Location';
        let splitLocation = location.split('|');

        return `<li class="site-list-item" data-site-id="${siteId}">
              <strong class="text-dark">${splitLocation[0]}</strong>
              <span class="text-muted small">${splitLocation[1]}</span>
            </li>`;
    }

    function renderLists(available, assigned) {
        const $available = $('#availableSitesList');
        const $assigned = $('#assignedSitesList');
        $available.empty();
        $assigned.empty();
        available.sort().forEach((s) => $available.append(createListItem(s)));
        assigned.sort().forEach((s) => $assigned.append(createListItem(s)));
        updateControlButtons();
    }

    function updateControlButtons() {
        const availSel = $('#availableSitesList .selected').length > 0;
        const assignedSel = $('#assignedSitesList .selected').length > 0;
        const staffSel = $('#staffSelect').val() !== null;
        $('#assignBtn').prop('disabled', !availSel || !staffSel);
        $('#unassignBtn').prop('disabled', !assignedSel || !staffSel);
        $('#updateAccessBtn').prop('disabled', !staffSel);
    }

    $('#consumerSelect').on('change', async function () {
        const selected = $(this).find(':selected');
        const id = selected.val();
        const siteAssigned = await getSitePermission(id);
        const assignedData = siteAssigned.map((s) => s._id);
        $('.site-list-item').removeClass('selected');
        currentAssignedSites = assignedData || [];
        const available = ALL_SITE_IDS.filter(
            (s) => !currentAssignedSites.includes(s),
        );
        renderLists(available, currentAssignedSites);
    });

    $(document).on('click', '.site-list-item', function () {
        const $item = $(this);
        const parentId = $item.parent().attr('id');
        if (parentId === 'availableSitesList') {
            $('#assignedSitesList .selected').removeClass('selected');
        } else {
            $('#availableSitesList .selected').removeClass('selected');
        }
        $item.toggleClass('selected');
        updateControlButtons();
    });

    $('#assignBtn').on('click', function () {
        $('#availableSitesList .selected').each(function () {
            currentAssignedSites.push($(this).data('site-id'));
        });
        const available = ALL_SITE_IDS.filter(
            (s) => !currentAssignedSites.includes(s),
        );
        renderLists(available, currentAssignedSites);
    });

    $('#unassignBtn').on('click', function () {
        const removeSites = [];
        $('#assignedSitesList .selected').each(function () {
            removeSites.push($(this).data('site-id'));
        });
        currentAssignedSites = currentAssignedSites.filter(
            (s) => !removeSites.includes(s),
        );
        const available = ALL_SITE_IDS.filter(
            (s) => !currentAssignedSites.includes(s),
        );
        renderLists(available, currentAssignedSites);
    });

    function filterList(searchId, listId) {
        const filter = $(searchId).val().toUpperCase();
        $(listId)
            .find('.site-list-item')
            .each(function () {
                const text = $(this).text().toUpperCase();
                $(this).toggle(text.indexOf(filter) > -1);
            });
    }

    $('#searchAvailable').on('keyup', () =>
        filterList('#searchAvailable', '#availableSitesList'),
    );
    $('#searchAssigned').on('keyup', () =>
        filterList('#searchAssigned', '#assignedSitesList'),
    );

    $('#updateAccessBtn').on('click', function () {
        const consumerId = $('#consumerSelect').val();

        if (consumerId) {
            let dataPost = [];

            let array = currentAssignedSites;

            for (let idSite of array) {
                let obj = {};

                obj.IdSite = idSite;
                obj.IdUser = consumerId;

                dataPost.push(obj);
            }

            let url = `${urlUpdateConsumerSite}`;

            axios
                .post(url, dataPost)
                .then((res) => {
                    if (res.data != 0) {
                        swal('Success', 'Update success', 'success');
                    } else {
                        swal('Errir', 'Update failed', 'error');
                    }
                })
                .catch((err) => console.log(err));
        }
    });

    renderLists(ALL_SITE_IDS, []);
});
