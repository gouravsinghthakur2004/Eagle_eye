# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# Add any project specific keep options here:

# React Native & Hermes Keep Rules
-keep class com.facebook.react.** { *; }
-keep class com.facebook.hermes.** { *; }
-keep class com.facebook.soloader.** { *; }

# OkHttp & Retrofit / Axios
-keep class okhttp3.** { *; }
-keep interface okhttp3.** { *; }
-dontwarn okhttp3.**
-dontwarn okio.**

# Image picker & permissions
-keep class com.imagepicker.** { *; }
-keep class com.reactnativecommunity.** { *; }
-keep class com.reactnative.** { *; }

# AsyncStorage Keep Rules
-keep class com.reactnativecommunity.asyncstorage.** { *; }
-dontwarn com.reactnativecommunity.asyncstorage.**

# Safe Area Context
-keep class com.th3rdwave.safeareacontext.** { *; }
