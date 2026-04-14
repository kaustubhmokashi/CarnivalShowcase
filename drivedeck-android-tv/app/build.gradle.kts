plugins {
  id("com.android.application")
  id("org.jetbrains.kotlin.android")
  id("org.jetbrains.kotlin.plugin.compose")
  id("org.jetbrains.kotlin.plugin.serialization")
}

android {
  namespace = "com.drivedeck.tv"
  compileSdk = 35

  defaultConfig {
    applicationId = "com.drivedeck.tv"
    minSdk = 25
    targetSdk = 35
    versionCode = 2
    versionName = "1.0.1"

    val baseUrl = (project.findProperty("drivedeckBaseUrl") as? String)
      ?.trim()
      ?.trimEnd('/')
      ?: "http://10.0.2.2:3000"
    val pairingUrl = (project.findProperty("drivedeckPairingUrl") as? String)
      ?.trim()
      ?.trimEnd('/')
      ?: ""
    buildConfigField("String", "DRIVEDECK_BASE_URL", "\"$baseUrl\"")
    buildConfigField("String", "DRIVEDECK_PAIRING_URL", "\"$pairingUrl\"")
  }

  buildFeatures {
    compose = true
    buildConfig = true
  }

  compileOptions {
    sourceCompatibility = JavaVersion.VERSION_17
    targetCompatibility = JavaVersion.VERSION_17
  }

  kotlinOptions {
    jvmTarget = "17"
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
  implementation("com.squareup.okhttp3:okhttp:4.12.0")
  implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.9.0")
  implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.7.3")

  debugImplementation("androidx.compose.ui:ui-tooling")
}
