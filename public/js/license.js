// Trang kích hoạt bản quyền: sao chép Mã máy (Hardware ID) vào clipboard.
// Không phụ thuộc thư viện ngoài (vanilla JS).
(function () {
    var input = document.getElementById('hardwareId');
    var button = document.getElementById('btnCopyHardwareId');
    var message = document.getElementById('copyHardwareIdMsg');

    if (!input || !button) return;

    function notify(text) {
        if (message) message.textContent = text;
    }

    button.addEventListener('click', function () {
        var value = input.value || '';
        if (!value) {
            notify('No hardware ID to copy.');
            return;
        }

        // Option 1: Clipboard API (HTTPS / localhost)
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(value).then(function () {
                notify('Hardware ID copied.');
            }, function () {
                fallbackCopy();
            });
            return;
        }

        fallbackCopy();

        function fallbackCopy() {
            try {
                input.removeAttribute('readonly');
                input.focus();
                input.select();
                input.setSelectionRange(0, value.length);
                var ok = document.execCommand('copy');
                input.setAttribute('readonly', 'readonly');
                notify(ok ? 'Hardware ID copied.' : 'Could not copy automatically, please select and copy manually.');
            } catch (e) {
                input.setAttribute('readonly', 'readonly');
                notify('Could not copy automatically, please select and copy manually.');
            }
        }
    });
})();
