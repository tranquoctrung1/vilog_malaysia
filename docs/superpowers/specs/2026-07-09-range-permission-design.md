# Range-based Permission cho Consumer/Staff

**Date:** 2026-07-09
**Status:** Approved

## Bối cảnh

Hiện tại phân quyền site cho consumer/staff chỉ hỗ trợ gán site lẻ (danh sách site cụ thể) qua join table `t_Consumer_Site` / `t_Staff_Site` (`{IdSite, IdUser}`, `IdSite` = `Site._id`). Khách hàng muốn thêm cách phân quyền theo **range**: chọn field (`SiteId` hoặc `LoggerId`) + khoảng `From`–`To`, user sẽ xem được mọi site có giá trị field đó nằm trong khoảng.

`Site.SiteId` và `Site.LoggerId` lưu dạng `String` trong DB nhưng giá trị thực tế luôn là numeric string (đã xác nhận với user).

Logic filter site theo quyền hiện bị lặp lại (không dùng middleware chung) ở 8 controller: `site.js`, `statusSite.js`, `channel.js`, `dataLogger.js`, `tableDataCurrent.js`, `historyAlarm.js`, `dashboardVilog.js`, `dataLoggerDashboardVilog.js` — mỗi file tự query `ConsumerSiteModel`/`StaffSiteModel` rồi filter `SiteModel`.

## Quyết định thiết kế

1. **Field range**: mỗi range gắn với đúng 1 field — `SiteId` hoặc `LoggerId` (không phải cả 2 cùng lúc).
2. **Kết hợp mode**: 1 user có thể vừa có site lẻ (list cũ) vừa có 1+ range. Quyền xem = **union** của cả hai.
3. **Multi-range**: 1 user có thể có nhiều range cùng lúc (vd SiteId 1-100 và SiteId 500-600).
4. **Giá trị numeric**: parse `SiteId`/`LoggerId` thành số để so sánh range (dùng `$expr` + `$toInt` trong Mongo query).
5. **Refactor**: gộp logic filter permission (list + range) thành 1 helper dùng chung `getPermittedSiteIds(user)`, thay cho code lặp ở 8 controller.

## Data Model

Model mới, song song với `consumerSite.js`/`staffSite.js`:

```js
// model/consumerSiteRange.js — collection t_Consumer_Site_Range
var consumerSiteRangeSchema = new mongoose.Schema({
  IdUser: String,
  Field: String,   // 'SiteId' | 'LoggerId'
  From: Number,
  To: Number,
});
```

`model/staffSiteRange.js` — cấu trúc giống hệt, collection `t_Staff_Site_Range`.

## Enforcement — Helper dùng chung

`helper/sitePermission.js`:

```js
async function getPermittedSiteIds(user) {
  if (user.Role === 'admin') return null; // null = không filter, admin xem tất cả

  const isConsumer = user.Role === 'consumer';
  const SiteLinkModel = isConsumer ? ConsumerSiteModel : StaffSiteModel;
  const RangeModel = isConsumer ? ConsumerSiteRangeModel : StaffSiteRangeModel;

  const listIdSite = await SiteLinkModel.find({ IdUser: user._id }, { IdSite: 1, _id: 0 });
  const idSet = new Set(listIdSite.map((i) => i.IdSite));

  const ranges = await RangeModel.find({ IdUser: user._id });
  if (ranges.length > 0) {
    const orConds = ranges.map((r) => ({
      $expr: {
        $and: [
          { $gte: [{ $toInt: `$${r.Field}` }, r.From] },
          { $lte: [{ $toInt: `$${r.Field}` }, r.To] },
        ],
      },
    }));
    const rangeSites = await SiteModel.find({ $or: orConds }, { _id: 1 });
    rangeSites.forEach((s) => idSet.add(String(s._id)));
  }

  return Array.from(idSet); // list các Site._id user được xem
}
```

8 controller hiện tại thay đoạn role-branch-filter lặp lại bằng:

```js
const permittedIds = await getPermittedSiteIds(user);
const listSite = permittedIds === null
  ? await SiteModel.find({}).sort({ SiteId: 1 })
  : permittedIds.length > 0
    ? await SiteModel.find({ _id: { $in: permittedIds } }).sort({ SiteId: 1 })
    : [];
```

(Với các controller không lấy site trực tiếp mà lấy data logger/channel/status theo site, dùng `permittedIds` để filter query tương ứng — theo đúng field liên kết site hiện có ở từng controller.)

## API

Router + controller mới theo pattern sẵn có (`router/permissionConsumer.js` style):

- `controller/api/consumerSiteRange.js`:
  - `GetRanges(IdUser)` — list range của user
  - `AddRange({IdUser, Field, From, To})` — thêm range mới
  - `DeleteRange(rangeId)` — xoá 1 range
- `controller/api/staffSiteRange.js` — tương tự cho staff.

## UI

`views/permissionConsumer.pug` / `permissionStaff.pug` thêm section "Range permission" bên dưới transfer-list site lẻ hiện có:

- Form: dropdown Field (`SiteId`/`LoggerId`), input From, input To, nút "Thêm range"
- Bảng list range hiện có của user đang chọn, mỗi dòng có nút Delete

Giữ nguyên UI transfer-list site lẻ phía trên, không đổi.

## Testing

- Unit: `getPermittedSiteIds` — case admin (null), case consumer chỉ list, chỉ range, cả hai (union đúng), không có gì (empty array).
- Integration: thêm range SiteId 1-100 cho 1 consumer, verify API site-scoped (vd `GetSiteForSWOC`) trả đúng site trong range + site gán lẻ trước đó, không trả site ngoài phạm vi.
- UI: thêm/xoá range qua `permissionConsumer.pug`, verify bảng cập nhật, verify consumer đăng nhập chỉ thấy site đúng phạm vi.
