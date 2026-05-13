import org.jetbrains.kotlin.gradle.dsl.JvmTarget

plugins {
  id("com.android.application")
  id("org.jetbrains.kotlin.android")
  id("org.jetbrains.kotlin.plugin.compose")
  id("org.jetbrains.kotlin.plugin.serialization")
}

android {
  namespace = "com.carnivalshowcase.tv"
  compileSdk = 35

  defaultConfig {
    applicationId = "com.carnivalshowcase.tv"
    minSdk = 25
    targetSdk = 35
    versionCode = 3
    versionName = "1.0.2"

    val baseUrl = (project.findProperty("carnivalShowcaseBaseUrl") as? String)
      ?.trim()
      ?.trimEnd('/')
      ?: "https://carnivalshowcase.kaustubhmokashi.com"
    val pairingUrl = (project.findProperty("carnivalShowcasePairingUrl") as? String)
      ?.trim()
      ?.trimEnd('/')
      ?: ""
    val googleWebClientId = (project.findProperty("carnivalGoogleWebClientId") as? String)
      ?.trim()
      ?: ""
    buildConfigField("String", "CARNIVAL_SHOWCASE_BASE_URL", "\"$baseUrl\"")
    buildConfigField("String", "CARNIVAL_SHOWCASE_PAIRING_URL", "\"$pairingUrl\"")
    buildConfigField("String", "CARNIVAL_GOOGLE_WEB_CLIENT_ID", "\"$googleWebClientId\"")
  }

  buildFeatures {
    compose = true
    buildConfig = true
  }

  compileOptions {
    sourceCompatibility = JavaVersion.VERSION_17
    targetCompatibility = JavaVersion.VERSION_17
  }

  kotlin {
    compilerOptions {
      jvmTarget.set(JvmTarget.JVM_17)
    }
  }

  packaging {
    resources {
      excludes += "/META-INF/{AL2.0,LGPL2.1}"
    }
  }
}

dependencies {
  val composeBom = platform("androidx.compose:compose-bom:2024.12.01")

  implementation(composeBom)
  androidTestImplementation(composeBom)

  implementation("androidx.core:core-ktx:1.15.0")
  implementation("androidx.activity:activity-compose:1.10.1")
  implementation("androidx.lifecycle:lifecycle-runtime-compose:2.8.7")
  implementation("androidx.lifecycle:lifecycle-viewmodel-compose:2.8.7")
  implementation("androidx.compose.ui:ui")
  implementation("androidx.compose.ui:ui-tooling-preview")
  implementation("androidx.compose.ui:ui-viewbinding")
  implementation("androidx.compose.animation:animation")
  implementation("androidx.compose.foundation:foundation")
  implementation("androidx.compose.material3:material3")
  implementation("androidx.compose.material:material-icons-extended")
  implementation("com.google.android.material:material:1.12.0")
  implementation("com.google.zxing:core:3.5.3")
  implementation("androidx.media3:media3-exoplayer:1.5.1")
  implementation("androidx.media3:media3-ui:1.5.1")
  implementation("io.coil-kt:coil-compose:2.7.0")
  implementation("io.coil-kt:coil-svg:2.7.0")
  implementation("com.airbnb.android:lottie-compose:6.4.0")
  implementation("com.google.android.gms:play-services-auth:21.3.0")
  implementation("com.squareup.okhttp3:okhttp:4.12.0")
  implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.9.0")
  implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.7.3")

  debugImplementation("androidx.compose.ui:ui-tooling")
}
