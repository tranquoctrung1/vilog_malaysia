const SiteModel = require('../model/site');
const ConsumerSiteModel = require('../model/consumerSite');
const StaffSiteModel = require('../model/staffSite');
const ConsumerSiteRangeModel = require('../model/consumerSiteRange');
const StaffSiteRangeModel = require('../model/staffSiteRange');

/**
 * Resolve the list of Site._id (as strings) a user is allowed to see.
 *
 * Returns:
 *   - null  => no filter (admin / unknown roles see every site)
 *   - []    => user has no permitted sites
 *   - [ids] => array of Site._id strings the user may view
 *
 * Permitted sites = union of:
 *   (a) individually assigned sites (t_Consumer_Site / t_Staff_Site, IdSite = Site._id)
 *   (b) sites whose numeric SiteId/LoggerId falls inside any of the user's
 *       ranges (t_Consumer_Site_Range / t_Staff_Site_Range), inclusive.
 */
async function getPermittedSiteIds(user) {
    if (!user) {
        return [];
    }

    // admin (and any non consumer/staff role) => no filter, same as the
    // original controllers' final `else` branch.
    if (user.Role !== 'consumer' && user.Role !== 'staff') {
        return null;
    }

    const isConsumer = user.Role === 'consumer';
    const SiteLinkModel = isConsumer ? ConsumerSiteModel : StaffSiteModel;
    const RangeModel = isConsumer
        ? ConsumerSiteRangeModel
        : StaffSiteRangeModel;

    // (a) individually assigned sites
    const listIdSite = await SiteLinkModel.find(
        { IdUser: user._id },
        { IdSite: 1, _id: 0 },
    );

    const idSet = new Set();
    for (const item of listIdSite) {
        idSet.add(item.IdSite);
    }

    // (b) range-based sites
    const ranges = await RangeModel.find({ IdUser: user._id });

    if (ranges.length > 0) {
        const orConds = [];
        for (const r of ranges) {
            if (r.Field !== 'SiteId' && r.Field !== 'LoggerId') {
                continue;
            }
            const numericField = {
                $convert: {
                    input: `$${r.Field}`,
                    to: 'int',
                    onError: null,
                    onNull: null,
                },
            };
            orConds.push({
                $expr: {
                    $and: [
                        { $ne: [numericField, null] },
                        { $gte: [numericField, r.From] },
                        { $lte: [numericField, r.To] },
                    ],
                },
            });
        }

        if (orConds.length > 0) {
            const rangeSites = await SiteModel.find(
                { $or: orConds },
                { _id: 1 },
            );
            for (const s of rangeSites) {
                idSet.add(String(s._id));
            }
        }
    }

    return Array.from(idSet);
}

module.exports = { getPermittedSiteIds };
