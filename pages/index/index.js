// pages/index/index.js
const app = getApp()

Page({
    data: {
        catProfile: null,
        todayGoal: 0,
        consumed: 0,
        remaining: 0,
        percent: 0,
        logs: [],
        showInputModal: false,
        currentFoodType: '', // 'dry', 'wet', 'treats'
        inputValue: '',
        safeAreaTop: 0,
        // Touch tracking for swipe
        touchStartX: 0,
        touchStartY: 0,
        currentSwipeId: null,
        showEditModal: false,
        editingLog: null,
        editValue: ''
    },

    onLoad() {
        // Get safe area info to avoid Dynamic Island
        const systemInfo = wx.getWindowInfo();
        const safeAreaTop = systemInfo.safeArea?.top || 0;
        this.setData({
            safeAreaTop: safeAreaTop + 10 // Add extra padding
        });
    },

    onShow() {
        this.checkProfile();
        this.loadTodayData();
    },

    checkProfile() {
        const catProfile = wx.getStorageSync('catProfile');
        if (!catProfile) {
            wx.redirectTo({
                url: '/pages/profile/profile',
            });
            return;
        }
        this.setData({
            catProfile,
            todayGoal: catProfile.dailyCalories
        });
    },

    loadTodayData() {
        const todayStr = new Date().toDateString(); // Simple date key (e.g., "Fri Jan 30 2026")
        const dailyRecord = wx.getStorageSync('pawsitive_daily_' + todayStr) || {
            consumed: 0,
            logs: []
        };

        this.updateStats(dailyRecord.consumed, dailyRecord.logs);
    },

    updateStats(consumed, logs) {
        const todayGoal = this.data.todayGoal;
        let remaining = todayGoal - consumed;
        if (remaining < 0) remaining = 0;

        const percent = Math.min((consumed / todayGoal) * 100, 100);

        this.setData({
            consumed,
            remaining,
            percent,
            logs
        });
    },

    // Navigation
    goToProfile() {
        wx.navigateTo({
            url: '/pages/profile/profile',
        });
    },

    showPlaceholder(e) {
        const name = e.currentTarget.dataset.name;
        wx.showToast({
            title: `猫猫努力开发中 🔨`,
            icon: 'none',
            duration: 2000
        });
    },

    // Feeding Actions
    onAddFood(e) {
        const type = e.currentTarget.dataset.type;
        this.setData({
            showInputModal: true,
            currentFoodType: type,
            inputValue: ''
        });
    },

    onInputVal(e) {
        this.setData({ inputValue: e.detail.value });
    },

    closeModal() {
        this.setData({ showInputModal: false });
    },

    // Swipe Gesture Handlers
    onTouchStart(e) {
        const touch = e.touches[0];
        this.setData({
            touchStartX: touch.clientX,
            touchStartY: touch.clientY
        });
    },

    onTouchMove(e) {
        const touch = e.touches[0];
        const deltaX = touch.clientX - this.data.touchStartX;
        const deltaY = touch.clientY - this.data.touchStartY;

        // Only swipe if horizontal movement is dominant
        if (Math.abs(deltaX) > Math.abs(deltaY) && deltaX < 0) {
            const logId = e.currentTarget.dataset.id;
            const maxSwipe = -160; // Maximum swipe distance
            const translateX = Math.max(deltaX, maxSwipe);

            // Update the specific log item's position
            const logs = this.data.logs.map(log => {
                if (log.id === logId) {
                    return { ...log, translateX, transition: false };
                }
                return { ...log, translateX: 0, transition: true };
            });

            this.setData({ logs, currentSwipeId: logId });
        }
    },

    onTouchEnd(e) {
        const logId = e.currentTarget.dataset.id;
        const currentLog = this.data.logs.find(log => log.id === logId);

        if (currentLog && currentLog.translateX) {
            // If swiped more than halfway, keep it open
            const shouldStayOpen = currentLog.translateX < -80;
            const finalX = shouldStayOpen ? -160 : 0;

            const logs = this.data.logs.map(log => {
                if (log.id === logId) {
                    return { ...log, translateX: finalX, transition: true };
                }
                return log;
            });

            this.setData({ logs });
        }
    },

    // Delete Log
    onDeleteLog(e) {
        const logId = e.currentTarget.dataset.id;

        wx.showModal({
            title: '确认删除',
            content: '确定要删除这条记录吗？',
            confirmText: '删除',
            confirmColor: '#FF6B6B',
            success: (res) => {
                if (res.confirm) {
                    const logToDelete = this.data.logs.find(log => log.id === logId);
                    const newLogs = this.data.logs.filter(log => log.id !== logId);
                    const newConsumed = this.data.consumed - logToDelete.cal;

                    // Save to storage
                    const todayStr = new Date().toDateString();
                    const record = {
                        consumed: newConsumed,
                        logs: newLogs
                    };
                    wx.setStorageSync('pawsitive_daily_' + todayStr, record);

                    // Update UI
                    this.updateStats(newConsumed, newLogs);

                    wx.showToast({
                        title: '已删除',
                        icon: 'success'
                    });
                }
            }
        });
    },

    // Edit Log
    onEditLog(e) {
        const logId = e.currentTarget.dataset.id;
        const logToEdit = this.data.logs.find(log => log.id === logId);

        // Reset swipe position
        const logs = this.data.logs.map(log => ({
            ...log,
            translateX: 0,
            transition: true
        }));

        this.setData({
            logs,
            showEditModal: true,
            editingLog: logToEdit,
            editValue: logToEdit.cal.toString()
        });
    },

    onEditInputVal(e) {
        this.setData({ editValue: e.detail.value });
    },

    closeEditModal() {
        this.setData({ showEditModal: false, editingLog: null });
    },

    confirmEdit() {
        const newCal = parseInt(this.data.editValue);
        if (!newCal || newCal <= 0) {
            wx.showToast({
                title: '请输入有效的卡路里哦',
                icon: 'none'
            });
            return;
        }

        const oldCal = this.data.editingLog.cal;
        const calDiff = newCal - oldCal;

        // Update log
        const newLogs = this.data.logs.map(log => {
            if (log.id === this.data.editingLog.id) {
                return { ...log, cal: newCal };
            }
            return log;
        });

        const newConsumed = this.data.consumed + calDiff;

        // Save to storage
        const todayStr = new Date().toDateString();
        const record = {
            consumed: newConsumed,
            logs: newLogs
        };
        wx.setStorageSync('pawsitive_daily_' + todayStr, record);

        // Update UI
        this.updateStats(newConsumed, newLogs);
        this.closeEditModal();

        wx.showToast({
            title: '修改成功！',
            icon: 'success'
        });
    },

    confirmAdd() {
        const cal = parseInt(this.data.inputValue);
        if (!cal || cal <= 0) {
            wx.showToast({
                title: '请输入有效的卡路里哦',
                icon: 'none'
            });
            return;
        }

        // Update Data
        const newConsumed = this.data.consumed + cal;
        const todayStr = new Date().toDateString();

        // Create new log entry
        const now = new Date();
        const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

        let foodIcon = '';
        let foodName = '';
        switch (this.data.currentFoodType) {
            case 'dry': foodIcon = '🥣'; foodName = '干粮'; break;
            case 'wet': foodIcon = '🐟'; foodName = '湿粮'; break;
            case 'treats': foodIcon = '🍬'; foodName = '零食'; break;
        }

        const newLog = {
            id: Date.now(),
            time: timeStr,
            type: this.data.currentFoodType,
            name: foodName,
            icon: foodIcon,
            cal: cal
        };

        const newLogs = [newLog, ...this.data.logs];

        // Save to local storage
        const record = {
            consumed: newConsumed,
            logs: newLogs
        };
        wx.setStorageSync('pawsitive_daily_' + todayStr, record);

        // Update UI
        this.updateStats(newConsumed, newLogs);
        this.closeModal();

        wx.showToast({
            title: '记下来啦！',
            icon: 'success'
        });
    }
})
