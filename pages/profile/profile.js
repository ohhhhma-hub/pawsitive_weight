// pages/profile/profile.js
Page({
  data: {
    name: '',
    currentWeight: '',
    idealWeight: '',
    rer: 0,
    dailyCalories: 0,
    safeAreaTop: 0
  },

  onLoad(options) {
    // Get safe area info to avoid Dynamic Island
    const systemInfo = wx.getWindowInfo();
    const safeAreaTop = systemInfo.safeArea?.top || 0;
    this.setData({
      safeAreaTop: safeAreaTop + 10 // Add extra padding
    });

    // Load existing data if available
    const catProfile = wx.getStorageSync('catProfile');
    if (catProfile) {
      this.setData(catProfile);
      this.calculateCalories(catProfile.currentWeight);
    }
  },

  onNameInput(e) {
    this.setData({ name: e.detail.value });
  },

  onCurrentWeightInput(e) {
    const currentWeight = e.detail.value;
    this.setData({ currentWeight });
    this.calculateCalories(currentWeight);
  },

  onIdealWeightInput(e) {
    const idealWeight = parseFloat(e.detail.value);
    this.setData({ idealWeight: e.detail.value });
    // Recalculate based on current weight when ideal weight changes
    this.calculateCalories(this.data.currentWeight);
  },

  calculateCalories(currentWeight) {
    const weight = parseFloat(currentWeight);
    if (!weight || isNaN(weight)) {
      this.setData({ rer: 0, dailyCalories: 0 });
      return;
    }
    // RER = 30 * currentWeight + 70 (based on CURRENT weight, not ideal)
    const rer = 30 * weight + 70;
    // Daily Recomended for Weight Loss = RER * 0.8
    const dailyCalories = Math.round(rer * 0.8);

    this.setData({
      rer,
      dailyCalories
    });
  },

  saveProfile() {
    const { name, currentWeight, idealWeight, dailyCalories } = this.data;

    if (!name || !currentWeight || !idealWeight) {
      wx.showToast({
        title: '请填写完整信息哦～',
        icon: 'none'
      });
      return;
    }

    const profile = {
      name,
      currentWeight,
      idealWeight,
      dailyCalories
    };

    wx.setStorageSync('catProfile', profile);

    wx.showToast({
      title: '保存成功！',
      icon: 'success',
      duration: 1500,
      success: () => {
        setTimeout(() => {
          wx.reLaunch({
            url: '/pages/index/index'
          });
        }, 1500)
      }
    });
  }
});
