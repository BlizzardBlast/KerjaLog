package com.blizzardblast.kerjalog.alarmpermissions

import android.app.AlarmManager
import android.content.Context
import android.os.Build
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class KerjaLogAlarmPermissionsModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("KerjaLogAlarmPermissions")

    Function("canScheduleExactAlarms") {
      if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) {
        return@Function true
      }

      val context = appContext.reactContext ?: return@Function false
      val alarmManager =
        context.getSystemService(Context.ALARM_SERVICE) as AlarmManager

      alarmManager.canScheduleExactAlarms()
    }
  }
}
