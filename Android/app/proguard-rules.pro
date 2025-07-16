# Add project specific ProGuard rules here.
# You can control the set of applied configuration files using the
# proguardFiles setting in build.gradle.kts.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# If your project uses WebView with JS, uncomment the following
# and specify the fully qualified class name to the JavaScript interface
# class:
#-keepclassmembers class fqcn.of.javascript.interface.for.webview {
#   public *;
#}

# Uncomment this to preserve the line number information for
# debugging stack traces.
#-keepattributes SourceFile,LineNumberTable

# If you keep the line number information, uncomment this to
# hide the original source file name.
#-renamesourcefileattribute SourceFile

# Keep data classes and DTOs
-keep class com.hyunwoopark.futinfo.data.remote.dto.** { *; }
-keep class com.hyunwoopark.futinfo.domain.model.** { *; }

# Keep Retrofit interfaces
-keep interface com.hyunwoopark.futinfo.data.remote.** { *; }

# Keep Hilt generated classes
-keep class dagger.hilt.** { *; }
-keep class * extends dagger.hilt.android.HiltAndroidApp
-keep @dagger.hilt.android.AndroidEntryPoint class * {
    *;
}

# Keep Gson/Kotlinx Serialization
-keepattributes Signature
-keepattributes *Annotation*
-keep class com.google.gson.** { *; }
-keep class kotlinx.serialization.** { *; }

# Keep Coroutines
-keep class kotlinx.coroutines.** { *; }

# Keep Compose
-keep class androidx.compose.** { *; }
-keep class androidx.lifecycle.** { *; }

# Remove debug logs in release
-assumenosideeffects class android.util.Log {
    public static boolean isLoggable(java.lang.String, int);
    public static int v(...);
    public static int i(...);
    public static int w(...);
    public static int d(...);
    public static int e(...);
}

# Remove custom debug logs
-assumenosideeffects class * {
    private static final java.lang.String TAG;
}