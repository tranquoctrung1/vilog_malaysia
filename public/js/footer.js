class ModernNavigation {
    constructor() {
        this.nav = document.getElementById('mobileNav');
        this.init();
    }

    init() {
        this.checkAppParameter();
        this.setupEventListeners();
        this.setupIntersectionObserver();
        this.setActiveNavItem();
        //this.modifyNavLinks(); // Thêm hàm xử lý links
    }

    // Hàm mới: tự động thêm ?app=true vào tất cả links trong nav
    modifyNavLinks() {
        const navLinks = this.nav.querySelectorAll('.nav-item[href]');

        navLinks.forEach((link) => {
            const originalHref = link.getAttribute('href');

            // Chỉ xử lý nếu href không phải là javascript: void(0), #, etc.
            if (
                originalHref &&
                !originalHref.startsWith('javascript:') &&
                !originalHref.startsWith('#')
            ) {
                const newHref = this.addAppParameterToUrl(originalHref);
                link.setAttribute('href', newHref);
            }
        });
    }

    // Hàm thêm app=true vào URL
    addAppParameterToUrl(url) {
        // Xử lý URL tương đối và tuyệt đối
        try {
            const baseUrl = window.location.origin;
            const fullUrl = url.startsWith('http')
                ? url
                : `${baseUrl}${url.startsWith('/') ? url : '/' + url}`;
            const urlObj = new URL(fullUrl);

            // Đảm bảo app=true luôn được thêm
            urlObj.searchParams.set('app', 'true');

            // Trả về URL tương đối nếu URL gốc là tương đối
            if (!url.startsWith('http')) {
                return urlObj.pathname + urlObj.search + urlObj.hash;
            }

            return urlObj.toString();
        } catch (error) {
            console.error('Error processing URL:', error);
            return url;
        }
    }

    checkAppParameter() {
        const urlParams = new URLSearchParams(window.location.search);
        const isAppMode = urlParams.get('app') === 'true';

        if (this.nav) {
            if (isAppMode) {
                this.showNavigation();
            } else {
                this.hideNavigation();
            }
        }
    }

    setActiveNavItem() {
        const currentPath = window.location.pathname;
        const navItems = this.nav.querySelectorAll('.nav-item');

        console.log('Current path:', currentPath); // Debug

        navItems.forEach((item) => {
            // Xóa class active cũ
            item.classList.remove('active');

            // Lấy href từ item (đã được modify bởi modifyNavLinks)
            const href = item.getAttribute('href');

            // Lấy pathname từ href (loại bỏ query parameters)
            let itemPath = '';
            try {
                // Tạo URL object từ href
                const url = new URL(href, window.location.origin);
                itemPath = url.pathname;
            } catch (e) {
                // Nếu href là relative path
                itemPath = href.split('?')[0].split('#')[0];
            }

            console.log('Item path:', itemPath, 'Href:', href); // Debug

            // Kiểm tra xem currentPath có khớp với itemPath không
            // Loại bỏ trailing slash để so sánh chính xác
            const cleanCurrentPath = currentPath.replace(/\/$/, '');
            const cleanItemPath = itemPath.replace(/\/$/, '');

            if (
                cleanCurrentPath === cleanItemPath ||
                (cleanItemPath !== '' &&
                    cleanCurrentPath.startsWith(cleanItemPath)) ||
                (cleanCurrentPath === '/' && cleanItemPath === '/')
            ) {
                item.classList.add('active');
                console.log('Active item set:', itemPath); // Debug
            }
        });
    }

    showNavigation() {
        this.nav.classList.add('show');
        document.body.style.paddingBottom = '100px';

        // Add entrance animation delay for each item
        const navItems = this.nav.querySelectorAll('.nav-item');
        navItems.forEach((item, index) => {
            item.style.animationDelay = `${index * 0.1}s`;
        });

        document.getElementsByClassName('header').forEach((header) => {
            header.style.display = 'none';
        });

        document.getElementById('contentWrap').style.height = 'inherit';
    }

    hideNavigation() {
        this.nav.classList.remove('show');
        document.body.style.paddingBottom = '';

        document.getElementsByClassName('header').forEach((header) => {
            header.style.display = 'block';
        });
    }

    setupEventListeners() {
        // Handle URL changes
        window.addEventListener('popstate', () => {
            this.checkAppParameter();
            this.setActiveNavItem();
        });

        // Xử lý click trên nav items
        this.nav.addEventListener('click', (e) => {
            const navItem = e.target.closest('.nav-item');

            if (navItem) {
                // Nếu là item đang active, scroll to top
                if (navItem.classList.contains('active')) {
                    e.preventDefault();
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }

                // Đảm bảo app=true được thêm ngay cả khi click vào các phần tử con
                const href = navItem.getAttribute('href');
                if (href && !href.includes('app=true')) {
                    e.preventDefault();
                    const newHref = this.addAppParameterToUrl(href);
                    window.location.href = newHref;
                }
            }
        });

        // Intercept all navigation clicks on the page to maintain app mode
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a[href]');
            if (link && !link.closest('#mobileNav')) {
                this.handleExternalLinkClick(link, e);
            }
        });
    }

    // Hàm xử lý click trên các link bên ngoài navigation
    handleExternalLinkClick(link, event) {
        const href = link.getAttribute('href');

        // Chỉ xử lý internal links
        if (href && this.isInternalLink(href)) {
            const urlParams = new URLSearchParams(window.location.search);
            const isAppMode = urlParams.get('app') === 'true';

            // Nếu đang ở chế độ app, giữ lại tham số
            if (isAppMode && !href.includes('app=true')) {
                event.preventDefault();
                const newUrl = this.addAppParameterToUrl(href);
                window.location.href = newUrl;
            }
        }
    }

    // Kiểm tra link có phải internal không
    isInternalLink(href) {
        return (
            href.startsWith('/') ||
            href.startsWith(window.location.origin) ||
            !href.startsWith('http')
        );
    }

    setupIntersectionObserver() {
        // Hide nav when scrolling down, show when scrolling up
        let lastScrollTop = 0;
        const scrollHandler = () => {
            if (!this.nav.classList.contains('show')) return;

            const scrollTop =
                window.pageYOffset || document.documentElement.scrollTop;

            if (scrollTop > lastScrollTop && scrollTop > 100) {
                // Scrolling down
                this.nav.style.transform = 'translateX(-50%) translateY(100px)';
                this.nav.style.opacity = '0';
            } else {
                // Scrolling up
                this.nav.style.transform = 'translateX(-50%) translateY(0)';
                this.nav.style.opacity = '1';
            }

            lastScrollTop = scrollTop;
        };

        window.addEventListener('scroll', scrollHandler, { passive: true });
    }

    setActiveNavItem() {
        const currentPath = window.location.pathname;
        const navItems = this.nav.querySelectorAll('.nav-item');

        navItems.forEach((item) => {
            item.classList.remove('active');
            const href = item.getAttribute('href');
            const itemPath = href.split('?')[0]; // Chỉ lấy path, bỏ query parameters

            if (
                itemPath === currentPath ||
                (itemPath !== '/' && currentPath.startsWith(itemPath)) ||
                (currentPath === '/' && itemPath === '/')
            ) {
                item.classList.add('active');
            }
        });
    }

    // Programmatic control
    toggleAppMode(enable) {
        const url = new URL(window.location);

        if (enable) {
            url.searchParams.set('app', 'true');
        } else {
            url.searchParams.delete('app');
        }

        window.history.pushState({}, '', url);
        this.checkAppParameter();
        this.modifyNavLinks(); // Cập nhật lại links khi toggle mode
    }

    // Hàm tiện ích để thêm app=true vào bất kỳ URL nào
    static addAppParam(url) {
        try {
            const urlObj = new URL(url, window.location.origin);
            urlObj.searchParams.set('app', 'true');
            return urlObj.toString();
        } catch (error) {
            return url;
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.modernNav = new ModernNavigation();
});

// Global function để thêm app=true vào URL bất kỳ
function ensureAppMode(url) {
    return ModernNavigation.addAppParam(url);
}

// Export for global use
window.NavigationManager = {
    toggleAppMode: (enable) => window.modernNav?.toggleAppMode(enable),
    ensureAppMode,
    addAppParam: ModernNavigation.addAppParam,
};

// // Intercept browser navigation
// window.addEventListener('beforeunload', () => {
//     // Đảm bảo duy trì app mode khi reload
//     const urlParams = new URLSearchParams(window.location.search);
//     if (urlParams.get('app') === 'true') {
//         sessionStorage.setItem('maintainAppMode', 'true');
//     }
// });

// // Khôi phục app mode khi load page
// window.addEventListener('load', () => {
//     if (sessionStorage.getItem('maintainAppMode') === 'true') {
//         sessionStorage.removeItem('maintainAppMode');
//         const urlParams = new URLSearchParams(window.location.search);
//         if (urlParams.get('app') !== 'true') {
//             urlParams.set('app', 'true');
//             const newUrl = `${window.location.pathname}?${urlParams.toString()}${window.location.hash}`;
//             window.history.replaceState({}, '', newUrl);
//         }
//     }
// });
