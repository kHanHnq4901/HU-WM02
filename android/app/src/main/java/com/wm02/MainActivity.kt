package com.wm02

import android.os.Bundle
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate
import com.swmansion.rnscreens.fragment.restoration.RNScreensFragmentFactory

class MainActivity : ReactActivity() {

  override fun getMainComponentName(): String = "WM02"

  override fun onCreate(savedInstanceState: Bundle?) {
    // Fix crash when using react-native-screens + activity recreation
    supportFragmentManager.fragmentFactory = RNScreensFragmentFactory()

    // ⚠️ Quan trọng: luôn truyền null
    super.onCreate(null)
  }

  override fun createReactActivityDelegate(): ReactActivityDelegate =
    DefaultReactActivityDelegate(
      this,
      mainComponentName,
      fabricEnabled
    )
}
