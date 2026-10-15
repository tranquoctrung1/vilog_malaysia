const uuid = require('uuid');

const LicenseStateModel = require('../../model/LicenseState');

// Hardware ID là GUID ngẫu nhiên, KHÔNG lấy từ machine/VM UUID.
// Lý do: máy ảo được clone sẽ dùng chung machine UUID -> trùng hardware_id trên BLP.
// GUID được sinh 1 lần ở lần chạy đầu tiên rồi lưu vào LicenseState và dùng lại mãi.
module.exports.getOrCreateHardwareId = async function () {
    let state = await LicenseStateModel.findOne({});

    if (state && state.hardwareId) {
        return state.hardwareId;
    }

    const hardwareId = uuid.v4();

    if (state) {
        await LicenseStateModel.updateOne(
            { _id: state._id },
            { hardwareId: hardwareId },
        );
    } else {
        await LicenseStateModel.create({
            hardwareId: hardwareId,
            offlineGraceDays: 0,
        });
    }

    return hardwareId;
};

// Trả về document singleton (tạo mới kèm hardwareId nếu chưa có).
module.exports.getState = async function () {
    await module.exports.getOrCreateHardwareId();

    return await LicenseStateModel.findOne({});
};
