// pages/profile/profile.js
Page({
  data: {
    name: '',
    currentWeight: '',
    idealWeight: '',
    rer: 0,
    dailyCalories: 0
  },

  onLoad(options) {
    // Load existing data if available
    const catProfile = wx.getStorageSync('catProfile');
    if (catProfile) {
      this.setData(catProfile);
      this.calculateCalories(catProfile.idealWeight);
    }
  },

  onNameInput(e) {
    this.setData({ name: e.detail.value });
  },

  onCurrentWeightInput(e) {
    this.setData({ currentWeight: e.detail.value });
  },

  onIdealWeightInput(e) {
    const idealWeight = parseFloat(e.detail.value);
    this.setData({ idealWeight: e.detail.value });
    this.calculateCalories(idealWeight);
  },

  calculateCalories(idealWeight) {
    if (!idealWeight || isNaN(idealWeight)) {
      this.setData({ rer: 0, dailyCalories: 0 });
      return;
    }
    // RER = 30 * idealWeight + 70
    const rer = 30 * idealWeight + 70;
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
