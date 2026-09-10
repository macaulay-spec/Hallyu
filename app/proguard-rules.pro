# Kotlinx serialization
-keepattributes *Annotation*, InnerClasses
-dontnote kotlinx.serialization.AnnotationsKt
-keepclassmembers class kotlinx.serialization.json.** { *** Companion; }
-keepclasseswithmembers class kotlinx.serialization.json.** { kotlinx.serialization.KSerializer serializer(...); }
-keep,includedescriptorclasses class com.hallyu.**$$serializer { *; }
-keepclassmembers class com.hallyu.** { *** Companion; }
-keepclasseswithmembers class com.hallyu.** { kotlinx.serialization.KSerializer serializer(...); }
