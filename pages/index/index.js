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
        safeAreaTop: 0
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
