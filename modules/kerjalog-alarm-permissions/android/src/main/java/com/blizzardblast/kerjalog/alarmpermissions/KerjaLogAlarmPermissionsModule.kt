package com.blizzardblast.kerjalog.alarmpermissions

import android.app.AlarmManager
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.provider.Settings
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

    Function("openExactAlarmSettings") {
      if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) {
        return@Function
      }

      val context = appContext.reactContext ?: return@Function
      val intent = Intent(
        Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM,
        Uri.parse("package:${context.packageName}"),
      ).apply {
        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      }

      context.startActivity(intent)
    }
  }
}
