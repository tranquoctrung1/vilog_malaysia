/**
 * Script để thêm permission route /configVilog cho staff
 * và cấp quyền site cho staff
 */

const mongoose = require('mongoose');

// Kết nối MongoDB
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/vilog_malaysia';

async function main() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ Đã kết nối MongoDB');

        const db = mongoose.connection.db;

        // =============================================
        // BƯỚC 1: Thêm Route Permission cho Staff
        // =============================================
        console.log('\n📋 BƯỚC 1: Thêm route permission...');

        const routeConfig = db.collection('t_RouteConfig');
        
        // Tìm document của staff
        const staffConfig = await routeConfig.findOne({ Role: 'staff' });
        
        if (staffConfig) {
            // Kiểm tra đã có ConfigVilog chưa
            const hasConfigVilog = staffConfig.Function.some(
                f => f.Parent === 'ConfigVilog'
            );

            if (!hasConfigVilog) {
                await routeConfig.updateOne(
                    { Role: 'staff' },
                    { 
                        $push: { 
                            Function: {
                                Parent: 'ConfigVilog',
                                Children: [
                                    { name: 'Config Vilog', url: '/configVilog' }
                                ]
                            }
                        } 
                    }
                );
                console.log('✅ Đã thêm /configVilog vào route permission của staff');
            } else {
                console.log('ℹ️  Staff đã có quyền route /configVilog');
            }
        } else {
            // Tạo mới nếu chưa có
            await routeConfig.insertOne({
                Role: 'staff',
                Function: [
                    {
                        Parent: 'ConfigVilog',
                        Children: [
                            { name: 'Config Vilog', url: '/configVilog' }
                        ]
                    }
                ]
            });
            console.log('✅ Đã tạo route permission mới cho staff');
        }

        // =============================================
        // BƯỚC 2: Cấp quyền Site cho Staff (Tùy chọn)
        // =============================================
        console.log('\n📋 BƯỚC 2: Cấp quyền site cho staff...');

        // YÊU CẦU NGƯỜI DÙNG NHẬP
        const staffUsername = process.argv[2]; // Argument 1: username của staff
        const siteIds = process.argv.slice(3); // Argument 2+: danh sách site IDs

        if (!staffUsername) {
            console.log('\n⚠️  Cú pháp: node addStaffPermission.js <username> [siteId1] [siteId2] ...');
            console.log('   Ví dụ: node addStaffPermission.js john_smith site1_id site2_id');
            console.log('\n📋 Danh sách Staff Sites hiện tại:');
            const staffSites = await db.collection('t_Staff_Site').find({}).toArray();
            console.log(staffSites);
        } else {
            // Tìm user
            const user = await db.collection('t_Users').findOne({ Username: staffUsername });
            
            if (!user) {
                console.log(`❌ Không tìm thấy user: ${staffUsername}`);
            } else {
                console.log(`✅ Tìm thấy user: ${user.Username} (${user._id})`);

                if (siteIds.length === 0) {
                    console.log('\n⚠️  Không có site ID nào được cung cấp.');
                    console.log('   Để cấp quyền site, chạy:');
                    console.log(`   node addStaffPermission.js ${staffUsername} <siteId1> <siteId2> ...`);
                    
                    // Hiển thị các site hiện có
                    console.log('\n📋 Tất cả sites trong hệ thống:');
                    const allSites = await db.collection('t_Sites').find({}).toArray();
                    allSites.forEach(site => {
                        console.log(`   - ${site.SiteId}: ${site.Location} (${site._id})`);
                    });
                } else {
                    // Thêm quyền site
                    const staffSiteCollection = db.collection('t_Staff_Site');
                    
                    for (const siteId of siteIds) {
                        // Kiểm tra đã tồn tại chưa
                        const existing = await staffSiteCollection.findOne({
                            IdUser: user._id.toString(),
                            IdSite: siteId
                        });

                        if (!existing) {
                            await staffSiteCollection.insertOne({
                                IdUser: user._id.toString(),
                                IdSite: siteId
                            });
                            console.log(`✅ Đã cấp quyền site: ${siteId}`);
                        } else {
                            console.log(`ℹ️  Staff đã có quyền site: ${siteId}`);
                        }
                    }

                    console.log('\n✅ Hoàn tất cấp quyền site!');
                }
            }
        }

        // =============================================
        // HIỂN THỊ THÔNG TIN HIỆN TẠI
        // =============================================
        console.log('\n📊 THÔNG TIN HIỆN TẠI:');
        
        console.log('\n👥 Users (Staff):');
        const users = await db.collection('t_Users').find({ Role: 'staff' }).toArray();
        users.forEach(u => console.log(`   - ${u.Username} (${u._id})`));

        console.log('\n📍 Sites:');
        const sites = await db.collection('t_Sites').find({}).toArray();
        sites.forEach(s => console.log(`   - ${s.SiteId}: ${s.Location} (${s._id})`));

        console.log('\n🔐 Staff-Site Permissions:');
        const staffSites = await db.collection('t_Staff_Site').find({}).toArray();
        staffSites.forEach(ss => console.log(`   User: ${ss.IdUser} → Site: ${ss.IdSite}`));

        await mongoose.disconnect();
        console.log('\n✅ Hoàn tất!');
        
    } catch (error) {
        console.error('❌ Lỗi:', error);
        process.exit(1);
    }
}

main();
