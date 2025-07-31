Page({
    goToPrediction() {
      wx.navigateTo({
        url: '/pages/prediction/prediction',
      })
    },
    goToProfile() {
      wx.navigateTo({
        url: '/pages/profile/profile',
      })
    }
  })