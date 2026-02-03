class TelegramConfig {
    constructor(hostname) {
        this.availableChats = [];
        this.assignedRanges = [];
        this.selectedChat = null; // Chỉ chọn 1 chat
        this.selectedRanges = new Set(); // Có thể chọn nhiều ranges
        this.chatAssignments = {}; // Lưu assignments của từng chat
        this.hostname = hostname;
        this.init();
    }

    init() {
        this.cacheElements();
        this.bindEvents();
        this.loadData();
        this.initModals();
        this.createSelectionSummary();
        this.addClearAllButton();
    }

    cacheElements() {
        this.elements = {
            availableChatList: document.getElementById('availableChatList'),
            assignedRangeList: document.getElementById('assignedRangeList'),
            searchAvailableChats: document.getElementById(
                'searchAvailablechats',
            ),
            searchAssignedRangeSites: document.getElementById(
                'searchAssignedRangeSites',
            ),
            updateAccessBtn: document.getElementById('updateAccessBtn'),
            manageTelegramBtn: document.getElementById('manageTelegramBtn'),
            manageRangeBtn: document.getElementById('manageRangeBtn'),

            // Telegram Modal
            telegramModal: new bootstrap.Modal(
                document.getElementById('telegramModal'),
            ),
            telegramForm: document.getElementById('telegramForm'),
            telegramChatId: document.getElementById('telegramChatId'),
            telegramChatName: document.getElementById('telegramChatName'),
            telegramEditId: document.getElementById('telegramEditId'),
            addTelegramBtn: document.getElementById('addTelegramBtn'),
            editTelegramBtn: document.getElementById('editTelegramBtn'),
            deleteTelegramBtn: document.getElementById('deleteTelegramBtn'),

            // Range Modal
            rangeModal: new bootstrap.Modal(
                document.getElementById('rangeModal'),
            ),
            rangeForm: document.getElementById('rangeForm'),
            rangeName: document.getElementById('rangeName'),
            rangeStart: document.getElementById('rangeStart'),
            rangeEnd: document.getElementById('rangeEnd'),
            rangeEditId: document.getElementById('rangeEditId'),
            addRangeBtn: document.getElementById('addRangeBtn'),
            editRangeBtn: document.getElementById('editRangeBtn'),
            deleteRangeBtn: document.getElementById('deleteRangeBtn'),
        };
    }

    createSelectionSummary() {
        // Tạo container cho selection summary
        const selectionContainer = document.createElement('div');
        selectionContainer.className = 'selection-summary';
        selectionContainer.id = 'selectionSummary';
        selectionContainer.style.display = 'none';

        selectionContainer.innerHTML = `
            <div class="row">
                <div class="col-md-6">
                    <h6><i class="fas fa-comment-dots me-2"></i>Selected Chat</h6>
                    <div id="selectedChatInfo"></div>
                </div>
                <div class="col-md-6">
                    <h6><i class="fas fa-layer-group me-2"></i>Selected Ranges (<span id="rangeCount">0</span>)</h6>
                    <div id="selectedRangesInfo"></div>
                </div>
            </div>
        `;

        // Chèn sau các list
        const listsContainer = document.querySelector('.transfer-container');
        if (listsContainer) {
            listsContainer.parentNode.insertBefore(
                selectionContainer,
                listsContainer.nextSibling,
            );
        }
    }

    async loadData() {
        try {
            // Load tất cả dữ liệu cùng lúc
            const [chatsResponse, rangesResponse, assignmentsResponse] =
                await Promise.all([
                    fetch(`${this.hostname}/telegram/chats`),
                    fetch(`${this.hostname}/telegram/ranges`),
                    fetch(`${this.hostname}/telegram/all-assignments`),
                ]);

            this.availableChats = await chatsResponse.json();
            this.assignedRanges = await rangesResponse.json();
            const assignmentsData = await assignmentsResponse.json();

            // Chuyển đổi assignments data thành dạng dễ sử dụng
            this.processAssignments(assignmentsData);

            this.renderChats();
            this.renderRanges();
            this.updateSelectionSummary();
        } catch (error) {
            console.error('Error loading data:', error);
            this.showError('Failed to load data. Please refresh the page.');
        }
    }

    processAssignments(assignmentsData) {
        // Reset assignments
        this.chatAssignments = {};

        // Xử lý dữ liệu assignments
        assignmentsData.forEach((assignmentGroup) => {
            if (assignmentGroup.telegram && assignmentGroup.ranges) {
                const telegramId = assignmentGroup.telegram._id;
                const rangeIds = assignmentGroup.ranges.map(
                    (range) => range._id,
                );

                this.chatAssignments[telegramId] = {
                    telegram: assignmentGroup.telegram,
                    ranges: assignmentGroup.ranges,
                    rangeIds: rangeIds,
                };
            }
        });
    }

    async loadAssignmentsForChat(chatId) {
        try {
            const response = await fetch(
                `${this.hostname}/telegram/telegram-with-ranges/${chatId}`,
            );
            const data = await response.json();

            if (data.assignedRanges) {
                this.chatAssignments[chatId] = {
                    telegram: data,
                    ranges: data.assignedRanges,
                    rangeIds: data.assignedRanges.map((range) => range._id),
                };
                return data.assignedRanges;
            }
        } catch (error) {
            console.error('Error loading assignments:', error);
        }
        return [];
    }

    initModals() {
        // Telegram Form
        this.elements.telegramForm.addEventListener('submit', (e) => {
            e.preventDefault();
        });

        this.elements.addTelegramBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.addTelegram();
        });

        this.elements.editTelegramBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.updateTelegram();
        });

        this.elements.deleteTelegramBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.deleteTelegram();
        });

        // Range Form
        this.elements.rangeForm.addEventListener('submit', (e) => {
            e.preventDefault();
        });

        this.elements.addRangeBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.addRange();
        });

        this.elements.editRangeBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.updateRange();
        });

        this.elements.deleteRangeBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.deleteRange();
        });

        // Reset modal khi đóng
        if (
            this.elements.telegramModal &&
            this.elements.telegramModal._element
        ) {
            this.elements.telegramModal._element.addEventListener(
                'hidden.bs.modal',
                () => {
                    this.resetTelegramModal();
                },
            );
        }

        if (this.elements.rangeModal && this.elements.rangeModal._element) {
            this.elements.rangeModal._element.addEventListener(
                'hidden.bs.modal',
                () => {
                    this.resetRangeModal();
                },
            );
        }
    }

    bindEvents() {
        // Search functionality
        this.elements.searchAvailableChats.addEventListener('input', (e) => {
            this.filterChats(e.target.value);
        });

        this.elements.searchAssignedRangeSites.addEventListener(
            'input',
            (e) => {
                this.filterRanges(e.target.value);
            },
        );

        // Chat selection - Chỉ chọn 1
        this.elements.availableChatList.addEventListener('click', async (e) => {
            const listItem = e.target.closest('li[data-chat-id]');
            if (listItem && !e.target.closest('.edit-chat-btn')) {
                const chatId = listItem.dataset.chatId;

                if (this.selectedChat === chatId) {
                    // Bỏ chọn chat hiện tại
                    this.selectedChat = null;
                    this.selectedRanges.clear();
                    this.removePulseAnimation(listItem);
                } else {
                    // Chọn chat mới
                    const previousSelected =
                        document.querySelector('li.selected-chat');
                    if (previousSelected) {
                        this.removePulseAnimation(previousSelected);
                    }

                    this.selectedChat = chatId;
                    this.addPulseAnimation(listItem);

                    // Kiểm tra xem chat này có assignments chưa
                    await this.loadAssignmentsForSelectedChat(chatId);
                }

                this.renderChats();
                this.renderRanges();
                this.updateSelectionSummary();
                this.checkSaveButton();
            }
        });

        // Range selection - Có thể chọn nhiều
        this.elements.assignedRangeList.addEventListener('click', (e) => {
            const listItem = e.target.closest('li[data-range-id]');
            if (listItem && !e.target.closest('.edit-range-btn')) {
                const rangeId = listItem.dataset.rangeId;

                if (this.selectedRanges.has(rangeId)) {
                    this.selectedRanges.delete(rangeId); // Bỏ chọn
                    this.removePulseAnimation(listItem);
                } else {
                    this.selectedRanges.add(rangeId); // Thêm chọn
                    this.addPulseAnimation(listItem);
                }

                this.renderRanges();
                this.updateSelectionSummary();
                this.checkSaveButton();
            }
        });

        // Save button
        this.elements.updateAccessBtn.addEventListener('click', () => {
            this.saveConfiguration();
        });

        // Manage buttons
        this.elements.manageTelegramBtn.addEventListener('click', () => {
            this.openTelegramModal();
        });

        this.elements.manageRangeBtn.addEventListener('click', () => {
            this.openRangeModal();
        });

        // Double click để select/deselect
        this.elements.availableChatList.addEventListener('dblclick', (e) => {
            const listItem = e.target.closest('li[data-chat-id]');
            if (listItem) {
                listItem.click();
            }
        });

        this.elements.assignedRangeList.addEventListener('dblclick', (e) => {
            const listItem = e.target.closest('li[data-range-id]');
            if (listItem) {
                listItem.click();
            }
        });
    }

    async loadAssignmentsForSelectedChat(chatId) {
        // Kiểm tra xem đã có assignments trong cache chưa
        if (!this.chatAssignments[chatId]) {
            // Load assignments từ server
            const assignedRanges = await this.loadAssignmentsForChat(chatId);
            if (assignedRanges && assignedRanges.length > 0) {
                // Tự động chọn các ranges đã được gán
                this.selectedRanges.clear();
                assignedRanges.forEach((range) => {
                    this.selectedRanges.add(range._id);
                });
                this.showInfo(
                    `Loaded ${assignedRanges.length} previously assigned ranges`,
                );
            }
        } else {
            // Sử dụng assignments từ cache
            const assignment = this.chatAssignments[chatId];
            if (assignment.rangeIds && assignment.rangeIds.length > 0) {
                // Tự động chọn các ranges đã được gán
                this.selectedRanges.clear();
                assignment.rangeIds.forEach((rangeId) => {
                    this.selectedRanges.add(rangeId);
                });
                this.showInfo(
                    `Loaded ${assignment.rangeIds.length} previously assigned ranges`,
                );
            }
        }
    }

    addPulseAnimation(element) {
        element.classList.add('selected-pulse');
        setTimeout(() => {
            element.classList.remove('selected-pulse');
        }, 500);
    }

    removePulseAnimation(element) {
        element.classList.remove('selected-pulse');
    }

    openTelegramModal(chat = null) {
        if (chat) {
            // Edit mode
            this.elements.telegramChatId.value = chat.chatId;
            this.elements.telegramChatName.value = chat.name;
            this.elements.telegramEditId.value = chat._id;

            this.elements.addTelegramBtn.style.display = 'none';
            this.elements.editTelegramBtn.style.display = 'inline-block';
            this.elements.deleteTelegramBtn.style.display = 'inline-block';

            const modalTitle = document.querySelector(
                '#telegramModal .modal-title',
            );
            if (modalTitle) {
                modalTitle.innerHTML =
                    '<i class="fas fa-edit me-2"></i>Edit Telegram Chat';
            }
        } else {
            // Add mode
            this.resetTelegramModal();
        }

        if (this.elements.telegramModal) {
            this.elements.telegramModal.show();
        }
    }

    openRangeModal(range = null) {
        if (range) {
            // Edit mode
            this.elements.rangeName.value = range.name;
            this.elements.rangeStart.value = range.start;
            this.elements.rangeEnd.value = range.end;
            this.elements.rangeEditId.value = range._id;

            this.elements.addRangeBtn.style.display = 'none';
            this.elements.editRangeBtn.style.display = 'inline-block';
            this.elements.deleteRangeBtn.style.display = 'inline-block';

            const modalTitle = document.querySelector(
                '#rangeModal .modal-title',
            );
            if (modalTitle) {
                modalTitle.innerHTML =
                    '<i class="fas fa-edit me-2"></i>Edit Range Site';
            }
        } else {
            // Add mode
            this.resetRangeModal();
        }

        if (this.elements.rangeModal) {
            this.elements.rangeModal.show();
        }
    }

    resetTelegramModal() {
        if (this.elements.telegramForm) {
            this.elements.telegramForm.reset();
        }
        if (this.elements.telegramEditId) {
            this.elements.telegramEditId.value = '';
        }

        // Reset về mode Add
        if (this.elements.addTelegramBtn) {
            this.elements.addTelegramBtn.style.display = 'inline-block';
        }
        if (this.elements.editTelegramBtn) {
            this.elements.editTelegramBtn.style.display = 'none';
        }
        if (this.elements.deleteTelegramBtn) {
            this.elements.deleteTelegramBtn.style.display = 'none';
        }

        // Reset tiêu đề
        const modalTitle = document.querySelector(
            '#telegramModal .modal-title',
        );
        if (modalTitle) {
            modalTitle.innerHTML =
                '<i class="fas fa-telegram me-2"></i>Manage Telegram Chats';
        }
    }

    resetRangeModal() {
        if (this.elements.rangeForm) {
            this.elements.rangeForm.reset();
        }
        if (this.elements.rangeEditId) {
            this.elements.rangeEditId.value = '';
        }

        // Reset về mode Add
        if (this.elements.addRangeBtn) {
            this.elements.addRangeBtn.style.display = 'inline-block';
        }
        if (this.elements.editRangeBtn) {
            this.elements.editRangeBtn.style.display = 'none';
        }
        if (this.elements.deleteRangeBtn) {
            this.elements.deleteRangeBtn.style.display = 'none';
        }

        // Reset tiêu đề
        const modalTitle = document.querySelector('#rangeModal .modal-title');
        if (modalTitle) {
            modalTitle.innerHTML =
                '<i class="fas fa-code-branch me-2"></i>Manage Range Sites';
        }
    }

    renderChats(filterText = '') {
        const container = this.elements.availableChatList;
        if (!container) return;

        container.innerHTML = '';

        let filteredChats = this.availableChats;
        if (filterText) {
            const searchTerm = filterText.toLowerCase();
            filteredChats = this.availableChats.filter(
                (chat) =>
                    chat.name.toLowerCase().includes(searchTerm) ||
                    chat.chatId.toString().includes(searchTerm),
            );
        }

        if (filteredChats.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-comment-slash"></i>
                    <p>${filterText ? 'No chats found matching your search' : 'No Telegram chats found'}</p>
                    <button class="btn btn-sm btn-primary mt-2" id="addFirstChatBtn">
                        <i class="fas fa-plus me-1"></i>Add First Chat
                    </button>
                </div>
            `;

            document
                .getElementById('addFirstChatBtn')
                ?.addEventListener('click', () => {
                    this.openTelegramModal();
                });
            return;
        }

        filteredChats.forEach((chat, index) => {
            const isSelected = this.selectedChat === chat._id;
            const hasAssignments =
                this.chatAssignments[chat._id] &&
                this.chatAssignments[chat._id].rangeIds.length > 0;

            const listItem = document.createElement('li');
            listItem.dataset.chatId = chat._id;
            listItem.className = isSelected ? 'selected-chat' : '';
            listItem.title = `Click to ${isSelected ? 'deselect' : 'select'} this chat${hasAssignments ? ' (has assigned ranges)' : ''}`;

            listItem.innerHTML = `
                <div style="display: flex; align-items: center; width: 100%;">
                    <div class="badge bg-secondary me-2" style="min-width: 30px;">${index + 1}</div>
                    <div class="chat-info">
                        <div class="chat-name">${this.escapeHtml(chat.name)}</div>
                        <div class="chat-id">ID: ${chat.chatId}</div>
                    </div>
                    <div class="d-flex align-items-center gap-2 ms-auto">
                        ${
                            hasAssignments
                                ? '<span class="badge bg-warning text-dark me-2" title="Has assigned ranges"><i class="fas fa-link"></i></span>'
                                : ''
                        }
                        <button class="btn btn-sm btn-outline-primary edit-chat-btn" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        ${
                            isSelected
                                ? '<div class="selection-badge bg-primary text-white">SELECTED</div>'
                                : ''
                        }
                    </div>
                </div>
                ${isSelected ? '<div class="selection-counter">✓</div>' : ''}
            `;

            // Add edit button event
            const editBtn = listItem.querySelector('.edit-chat-btn');
            editBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.openTelegramModal(chat);
            });

            container.appendChild(listItem);
        });
    }

    renderRanges(filterText = '') {
        const container = this.elements.assignedRangeList;
        if (!container) return;

        container.innerHTML = '';

        let filteredRanges = this.assignedRanges;
        if (filterText) {
            const searchTerm = filterText.toLowerCase();
            filteredRanges = this.assignedRanges.filter(
                (range) =>
                    range.name.toLowerCase().includes(searchTerm) ||
                    range.start.toString().includes(searchTerm) ||
                    range.end.toString().includes(searchTerm),
            );
        }

        if (filteredRanges.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-layer-group"></i>
                    <p>${filterText ? 'No ranges found matching your search' : 'No range sites found'}</p>
                    <button class="btn btn-sm btn-primary mt-2" id="addFirstRangeBtn">
                        <i class="fas fa-plus me-1"></i>Add First Range
                    </button>
                </div>
            `;

            document
                .getElementById('addFirstRangeBtn')
                ?.addEventListener('click', () => {
                    this.openRangeModal();
                });
            return;
        }

        filteredRanges.forEach((range, index) => {
            const isSelected = this.selectedRanges.has(range._id);
            const listItem = document.createElement('li');
            listItem.dataset.rangeId = range._id;
            listItem.className = isSelected ? 'selected-range' : '';
            listItem.title = `Click to ${isSelected ? 'deselect' : 'select'} this range (${range.start}-${range.end})`;

            listItem.innerHTML = `
                <div style="display: flex; align-items: center; width: 100%;">
                    <div class="badge bg-secondary me-2" style="min-width: 30px;">${index + 1}</div>
                    <div class="chat-info">
                        <div class="chat-name">${this.escapeHtml(range.name)}</div>
                        <div class="chat-id">Range: ${range.start} - ${range.end}</div>
                    </div>
                    <div class="d-flex align-items-center gap-2 ms-auto">
                        <button class="btn btn-sm btn-outline-success edit-range-btn" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        ${
                            isSelected
                                ? '<div class="selection-badge bg-success text-white">SELECTED</div>'
                                : ''
                        }
                    </div>
                </div>
                ${
                    isSelected
                        ? '<div class="selected-checkmark"><i class="fas fa-check"></i></div>'
                        : ''
                }
            `;

            // Add edit button event
            const editBtn = listItem.querySelector('.edit-range-btn');
            editBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.openRangeModal(range);
            });

            container.appendChild(listItem);
        });
    }

    updateSelectionSummary() {
        const selectionSummary = document.getElementById('selectionSummary');
        if (!selectionSummary) return;

        const selectedChatInfo = document.getElementById('selectedChatInfo');
        const selectedRangesInfo =
            document.getElementById('selectedRangesInfo');
        const rangeCount = document.getElementById('rangeCount');

        // Hiển thị/ẩn selection summary
        if (this.selectedChat || this.selectedRanges.size > 0) {
            selectionSummary.style.display = 'block';

            // Hiển thị selected chat
            if (this.selectedChat) {
                const selectedChat = this.availableChats.find(
                    (chat) => chat._id === this.selectedChat,
                );
                if (selectedChat && selectedChatInfo) {
                    // Kiểm tra xem chat này có assignments không
                    const hasAssignments =
                        this.chatAssignments[this.selectedChat] &&
                        this.chatAssignments[this.selectedChat].rangeIds
                            .length > 0;

                    let assignmentInfo = '';
                    if (hasAssignments) {
                        const assignedCount =
                            this.chatAssignments[this.selectedChat].rangeIds
                                .length;
                        assignmentInfo = `<br><small class="text-warning"><i class="fas fa-link"></i> Has ${assignedCount} assigned range(s)</small>`;
                    }

                    selectedChatInfo.innerHTML = `
                        <div class="selection-item chat-item">
                            <strong>${this.escapeHtml(selectedChat.name)}</strong>
                            <br>
                            <small>ID: ${selectedChat.chatId}</small>
                            ${assignmentInfo}
                        </div>
                    `;
                }
            } else if (selectedChatInfo) {
                selectedChatInfo.innerHTML =
                    '<span class="text-muted">No chat selected</span>';
            }

            // Hiển thị selected ranges
            if (this.selectedRanges.size > 0) {
                const selectedRanges = this.assignedRanges.filter((range) =>
                    this.selectedRanges.has(range._id),
                );

                if (rangeCount) {
                    rangeCount.textContent = selectedRanges.length;
                }

                if (selectedRangesInfo) {
                    let rangesHtml = '';
                    selectedRanges.forEach((range) => {
                        rangesHtml += `
                            <div class="selection-item range-item">
                                <strong>${this.escapeHtml(range.name)}</strong>
                                <br>
                                <small>${range.start} - ${range.end}</small>
                            </div>
                        `;
                    });

                    selectedRangesInfo.innerHTML = rangesHtml;
                }
            } else {
                if (selectedRangesInfo) {
                    selectedRangesInfo.innerHTML =
                        '<span class="text-muted">No ranges selected</span>';
                }
                if (rangeCount) {
                    rangeCount.textContent = '0';
                }
            }
        } else {
            selectionSummary.style.display = 'none';
        }
    }

    filterChats(searchText) {
        this.renderChats(searchText);
    }

    filterRanges(searchText) {
        this.renderRanges(searchText);
    }

    checkSaveButton() {
        const hasSelection = this.selectedChat && this.selectedRanges.size > 0;
        this.elements.updateAccessBtn.disabled = !hasSelection;

        // Thêm hiệu ứng cho button
        if (hasSelection) {
            // Kiểm tra xem có thay đổi so với assignments cũ không
            const hasAssignments =
                this.chatAssignments[this.selectedChat] &&
                this.chatAssignments[this.selectedChat].rangeIds.length > 0;

            let buttonText = 'Save Changes';
            if (hasAssignments) {
                const oldRangeIds =
                    this.chatAssignments[this.selectedChat].rangeIds;
                const newRangeIds = Array.from(this.selectedRanges);

                // Kiểm tra xem có thay đổi không
                const hasChanges =
                    oldRangeIds.length !== newRangeIds.length ||
                    !oldRangeIds.every((id) => newRangeIds.includes(id)) ||
                    !newRangeIds.every((id) => oldRangeIds.includes(id));

                if (hasChanges) {
                    buttonText = 'Update Changes';
                    this.elements.updateAccessBtn.innerHTML = `
                        <i class="fas fa-sync-alt me-2"></i>
                        ${buttonText} (${this.selectedRanges.size} range${this.selectedRanges.size > 1 ? 's' : ''})
                    `;
                    this.elements.updateAccessBtn.classList.remove(
                        'btn-secondary',
                        'btn-success',
                    );
                    this.elements.updateAccessBtn.classList.add('btn-warning');
                } else {
                    buttonText = 'No Changes';
                    this.elements.updateAccessBtn.innerHTML = `
                        <i class="fas fa-check me-2"></i>
                        ${buttonText} (${this.selectedRanges.size} range${this.selectedRanges.size > 1 ? 's' : ''})
                    `;
                    this.elements.updateAccessBtn.classList.remove(
                        'btn-secondary',
                        'btn-warning',
                    );
                    this.elements.updateAccessBtn.classList.add('btn-success');
                }
            } else {
                this.elements.updateAccessBtn.innerHTML = `
                    <i class="fas fa-save me-2"></i>
                    ${buttonText} (${this.selectedRanges.size} range${this.selectedRanges.size > 1 ? 's' : ''})
                `;
                this.elements.updateAccessBtn.classList.remove(
                    'btn-secondary',
                    'btn-warning',
                );
                this.elements.updateAccessBtn.classList.add('btn-success');
            }
        } else {
            this.elements.updateAccessBtn.innerHTML = `
                <i class="fas fa-save me-2"></i>
                Save Changes
            `;
            this.elements.updateAccessBtn.classList.remove(
                'btn-success',
                'btn-warning',
            );
            this.elements.updateAccessBtn.classList.add('btn-secondary');
        }
    }

    // API Calls với validation
    async addTelegram() {
        // Validate form
        if (!this.validateTelegramForm()) {
            return;
        }

        try {
            const response = await fetch(`${this.hostname}/telegram/chats`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chatId: this.elements.telegramChatId.value.trim(),
                    name: this.elements.telegramChatName.value.trim(),
                }),
            });

            if (response.ok) {
                const newChat = await response.json();
                this.elements.telegramModal.hide();
                this.showSuccess('Telegram chat added successfully!');
                this.loadData();

                // Tự động chọn chat vừa thêm
                this.selectedChat = newChat._id;
                this.selectedRanges.clear();
                this.renderChats();
                this.renderRanges();
                this.checkSaveButton();
            } else {
                const errorData = await response.json();
                throw new Error(
                    errorData.error || 'Failed to add telegram chat',
                );
            }
        } catch (error) {
            console.error('Error adding telegram:', error);
            this.showError(error.message || 'Failed to add telegram chat');
        }
    }

    async updateTelegram() {
        // Validate form
        if (!this.validateTelegramForm()) {
            return;
        }

        try {
            const response = await fetch(
                `${this.hostname}/telegram/chats/${this.elements.telegramEditId.value}`,
                {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        chatId: this.elements.telegramChatId.value.trim(),
                        name: this.elements.telegramChatName.value.trim(),
                    }),
                },
            );

            if (response.ok) {
                const updatedChat = await response.json();
                this.elements.telegramModal.hide();
                this.showSuccess('Telegram chat updated successfully!');

                // Nếu đang chọn chat này, cập nhật thông tin
                if (this.selectedChat === updatedChat._id) {
                    this.loadData();
                } else {
                    // Chỉ reload chats
                    const chatsResponse = await fetch(
                        `${this.hostname}/telegram/chats`,
                    );
                    this.availableChats = await chatsResponse.json();
                    this.renderChats();
                }
            } else {
                const errorData = await response.json();
                throw new Error(
                    errorData.error || 'Failed to update telegram chat',
                );
            }
        } catch (error) {
            console.error('Error updating telegram:', error);
            this.showError(error.message || 'Failed to update telegram chat');
        }
    }

    async deleteTelegram() {
        if (!confirm('Are you sure you want to delete this Telegram chat?')) {
            return;
        }

        try {
            const response = await fetch(
                `${this.hostname}/telegram/chats/${this.elements.telegramEditId.value}`,
                {
                    method: 'DELETE',
                },
            );

            if (response.ok) {
                this.elements.telegramModal.hide();
                this.showSuccess('Telegram chat deleted successfully!');

                // Nếu chat đang được chọn thì bỏ chọn
                if (this.selectedChat === this.elements.telegramEditId.value) {
                    this.selectedChat = null;
                    this.selectedRanges.clear();
                }

                // Xóa assignments của chat này khỏi cache
                delete this.chatAssignments[this.elements.telegramEditId.value];

                this.loadData();
                this.checkSaveButton();
            } else {
                const errorData = await response.json();
                throw new Error(
                    errorData.error || 'Failed to delete telegram chat',
                );
            }
        } catch (error) {
            console.error('Error deleting telegram:', error);
            this.showError(error.message || 'Failed to delete telegram chat');
        }
    }

    async addRange() {
        // Validate form
        if (!this.validateRangeForm()) {
            return;
        }

        try {
            const start = parseInt(this.elements.rangeStart.value);
            const end = parseInt(this.elements.rangeEnd.value);

            if (start > end) {
                this.showError(
                    'Start range must be less than or equal to end range',
                );
                return;
            }

            const response = await fetch(`${this.hostname}/telegram/ranges`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: this.elements.rangeName.value.trim(),
                    start: start,
                    end: end,
                }),
            });

            if (response.ok) {
                const newRange = await response.json();
                this.elements.rangeModal.hide();
                this.showSuccess('Range added successfully!');
                this.loadData();

                // Tự động chọn range vừa thêm
                this.selectedRanges.add(newRange._id);
                this.renderRanges();
                this.checkSaveButton();
            } else {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to add range');
            }
        } catch (error) {
            console.error('Error adding range:', error);
            this.showError(error.message || 'Failed to add range');
        }
    }

    async updateRange() {
        // Validate form
        if (!this.validateRangeForm()) {
            return;
        }

        try {
            const start = parseInt(this.elements.rangeStart.value);
            const end = parseInt(this.elements.rangeEnd.value);

            if (start > end) {
                this.showError(
                    'Start range must be less than or equal to end range',
                );
                return;
            }

            const response = await fetch(
                `${this.hostname}/telegram/ranges/${this.elements.rangeEditId.value}`,
                {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: this.elements.rangeName.value.trim(),
                        start: start,
                        end: end,
                    }),
                },
            );

            if (response.ok) {
                this.elements.rangeModal.hide();
                this.showSuccess('Range updated successfully!');
                this.loadData();
            } else {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to update range');
            }
        } catch (error) {
            console.error('Error updating range:', error);
            this.showError(error.message || 'Failed to update range');
        }
    }

    async deleteRange() {
        if (!confirm('Are you sure you want to delete this range?')) {
            return;
        }

        try {
            const response = await fetch(
                `${this.hostname}/telegram/ranges/${this.elements.rangeEditId.value}`,
                {
                    method: 'DELETE',
                },
            );

            if (response.ok) {
                this.elements.rangeModal.hide();
                this.showSuccess('Range deleted successfully!');

                // Nếu range đang được chọn thì bỏ chọn
                if (this.selectedRanges.has(this.elements.rangeEditId.value)) {
                    this.selectedRanges.delete(this.elements.rangeEditId.value);
                }

                // Xóa range này khỏi tất cả assignments trong cache
                Object.keys(this.chatAssignments).forEach((chatId) => {
                    const assignment = this.chatAssignments[chatId];
                    if (assignment && assignment.rangeIds) {
                        const index = assignment.rangeIds.indexOf(
                            this.elements.rangeEditId.value,
                        );
                        if (index > -1) {
                            assignment.rangeIds.splice(index, 1);
                            assignment.ranges.splice(index, 1);
                        }
                    }
                });

                this.loadData();
                this.checkSaveButton();
            } else {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to delete range');
            }
        } catch (error) {
            console.error('Error deleting range:', error);
            this.showError(error.message || 'Failed to delete range');
        }
    }

    async saveConfiguration() {
        if (!this.selectedChat || this.selectedRanges.size === 0) {
            this.showError('Please select at least one chat and one range');
            return;
        }

        try {
            const payload = {
                telegramId: this.selectedChat,
                rangeIds: Array.from(this.selectedRanges),
            };

            const response = await fetch(`${this.hostname}/telegram/assign`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                const result = await response.json();

                // Cập nhật cache assignments
                this.chatAssignments[this.selectedChat] = {
                    telegram: this.availableChats.find(
                        (chat) => chat._id === this.selectedChat,
                    ),
                    ranges: this.assignedRanges.filter((range) =>
                        this.selectedRanges.has(range._id),
                    ),
                    rangeIds: Array.from(this.selectedRanges),
                };

                this.showSuccess(
                    `Configuration saved successfully! ${result.count} range(s) assigned.`,
                );

                // Không reset selection sau khi save, giữ nguyên để người dùng có thể tiếp tục chỉnh sửa
                this.renderChats();
                this.renderRanges();
                this.updateSelectionSummary();
                this.checkSaveButton();
            } else {
                const errorData = await response.json();
                throw new Error(
                    errorData.error || 'Failed to save configuration',
                );
            }
        } catch (error) {
            console.error('Error saving configuration:', error);
            this.showError(error.message || 'Failed to save configuration');
        }
    }

    // Validation methods
    validateTelegramForm() {
        const chatId = this.elements.telegramChatId.value.trim();
        const name = this.elements.telegramChatName.value.trim();

        // Reset validation states
        this.elements.telegramChatId.classList.remove('is-invalid');
        this.elements.telegramChatName.classList.remove('is-invalid');

        let isValid = true;

        if (!chatId) {
            this.elements.telegramChatId.classList.add('is-invalid');
            this.showError('Chat ID is required');
            isValid = false;
        } else if (!/^\d+$/.test(chatId)) {
            this.elements.telegramChatId.classList.add('is-invalid');
            this.showError('Chat ID must be numeric');
            isValid = false;
        }

        if (!name) {
            this.elements.telegramChatName.classList.add('is-invalid');
            this.showError('Chat Name is required');
            isValid = false;
        }

        return isValid;
    }

    validateRangeForm() {
        const name = this.elements.rangeName.value.trim();
        const start = this.elements.rangeStart.value;
        const end = this.elements.rangeEnd.value;

        // Reset validation states
        this.elements.rangeName.classList.remove('is-invalid');
        this.elements.rangeStart.classList.remove('is-invalid');
        this.elements.rangeEnd.classList.remove('is-invalid');

        let isValid = true;

        if (!name) {
            this.elements.rangeName.classList.add('is-invalid');
            this.showError('Range Name is required');
            isValid = false;
        }

        if (!start || isNaN(start) || parseInt(start) < 0) {
            this.elements.rangeStart.classList.add('is-invalid');
            this.showError('Start range must be a positive number');
            isValid = false;
        }

        if (!end || isNaN(end) || parseInt(end) < 0) {
            this.elements.rangeEnd.classList.add('is-invalid');
            this.showError('End range must be a positive number');
            isValid = false;
        }

        if (start && end && parseInt(start) > parseInt(end)) {
            this.elements.rangeStart.classList.add('is-invalid');
            this.elements.rangeEnd.classList.add('is-invalid');
            this.showError(
                'Start range must be less than or equal to end range',
            );
            isValid = false;
        }

        return isValid;
    }

    // Utility methods
    showSuccess(message) {
        this.createToast('success', message);
    }

    showError(message) {
        this.createToast('error', message);
    }

    showInfo(message) {
        this.createToast('info', message);
    }

    createToast(type, message) {
        const toast = document.createElement('div');
        toast.className = `toast align-items-center text-bg-${type} border-0`;
        toast.setAttribute('role', 'alert');
        toast.setAttribute('aria-live', 'assertive');
        toast.setAttribute('aria-atomic', 'true');

        let icon = 'info-circle';
        if (type === 'success') icon = 'check-circle';
        if (type === 'error') icon = 'exclamation-circle';

        toast.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">
                    <i class="fas fa-${icon} me-2"></i>${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        `;

        const toastContainer =
            document.querySelector('.toast-container') ||
            this.createToastContainer();
        toastContainer.appendChild(toast);

        const bsToast = new bootstrap.Toast(toast, { delay: 3000 });
        bsToast.show();

        toast.addEventListener('hidden.bs.toast', () => {
            toast.remove();
        });
    }

    createToastContainer() {
        const container = document.createElement('div');
        container.className = 'toast-container position-fixed top-0 end-0 p-3';
        container.style.zIndex = '1090';
        document.body.appendChild(container);
        return container;
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    addClearAllButton() {
        const buttonContainer = document.querySelector(
            '.d-grid.gap-2.d-md-flex',
        );
        if (!buttonContainer) return;

        const clearBtn = document.createElement('button');
        clearBtn.className = 'btn btn-outline-danger btn-lg';
        clearBtn.innerHTML =
            '<i class="fas fa-times-circle me-2"></i>Clear All';
        clearBtn.addEventListener('click', () => {
            this.clearAllSelections();
        });

        buttonContainer.prepend(clearBtn);
    }

    clearAllSelections() {
        this.selectedChat = null;
        this.selectedRanges.clear();
        this.renderChats();
        this.renderRanges();
        this.updateSelectionSummary();
        this.checkSaveButton();
        this.showInfo('All selections cleared');
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new TelegramConfig(hostname);
});
