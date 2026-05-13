package com.carnivalshowcase.tv

import android.app.DownloadManager
import android.app.Activity
import android.content.Context
import android.content.Intent
import android.content.res.Configuration
import android.os.Message
import android.os.Bundle
import android.os.Environment
import android.os.Handler
import android.os.Looper
import android.graphics.Bitmap
import android.media.MediaMetadataRetriever
import android.net.Uri
import android.content.ActivityNotFoundException
import android.webkit.JavascriptInterface
import android.webkit.CookieManager
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.webkit.URLUtil
import android.view.MotionEvent
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.BackHandler
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.activity.compose.setContent
import androidx.compose.animation.Crossfade
import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.ExperimentalAnimationApi
import androidx.compose.animation.SizeTransform
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.slideInHorizontally
import androidx.compose.animation.slideInVertically
import androidx.compose.animation.slideOutHorizontally
import androidx.compose.animation.slideOutVertically
import androidx.compose.animation.togetherWith
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.focusable
import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.rememberLazyGridState
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.itemsIndexed
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.ChevronLeft
import androidx.compose.material.icons.filled.ChevronRight
import androidx.compose.material.icons.filled.Forward10
import androidx.compose.material.icons.filled.Pause
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.Replay10
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Slider
import androidx.compose.material3.Surface
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.material3.Typography
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.runtime.setValue
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.focus.onFocusChanged
import androidx.compose.ui.focus.focusProperties
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.viewinterop.AndroidView
import androidx.compose.ui.input.key.Key
import androidx.compose.ui.input.key.KeyEventType
import androidx.compose.ui.input.key.key
import androidx.compose.ui.input.key.onPreviewKeyEvent
import androidx.compose.ui.input.key.type
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.Font
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.unit.IntOffset
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.lifecycle.viewModelScope
import com.airbnb.lottie.compose.LottieAnimation
import com.airbnb.lottie.compose.LottieCompositionSpec
import com.airbnb.lottie.compose.LottieConstants
import com.airbnb.lottie.compose.animateLottieCompositionAsState
import com.airbnb.lottie.compose.rememberLottieComposition
import coil.compose.AsyncImage
import coil.compose.AsyncImagePainter
import coil.compose.SubcomposeAsyncImage
import coil.compose.SubcomposeAsyncImageContent
import coil.decode.SvgDecoder
import coil.imageLoader
import coil.request.ImageRequest
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import okhttp3.OkHttpClient
import okhttp3.Request
import java.net.UnknownHostException
import java.util.Locale
import com.google.zxing.BarcodeFormat
import com.google.zxing.EncodeHintType
import com.google.zxing.qrcode.QRCodeWriter
import com.google.android.gms.auth.api.signin.GoogleSignIn
import com.google.android.gms.auth.api.signin.GoogleSignInOptions
import com.google.android.gms.common.api.ApiException
import androidx.media3.common.MediaItem
import androidx.media3.common.Player
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.ui.AspectRatioFrameLayout
import androidx.media3.ui.PlayerView
import java.net.URLEncoder
import org.json.JSONObject
import kotlin.math.absoluteValue

private val AppBackground = Color(0xFFFFFFFF)
private val AppBackgroundMuted = Color(0xFFF7F7F7)
private val SurfaceBackground = Color(0xFFFFFFFF)
private val SurfaceMuted = Color(0xFFF3F3F3)
private val SurfaceStrong = Color(0xFFF6F6F6)
private val AccentColor = Color(0xFF000000)
private val TextPrimary = Color(0xFF000000)
private val TextSecondary = Color(0xFF5F5F5F)
private val BorderSoft = Color(0x14000000)
private val BorderStrong = Color(0x22000000)
private val OverlaySoft = Color(0xCCFFFFFF)
private val WorkSansFontFamily = FontFamily(
  Font(R.font.work_sans_variable, FontWeight.Normal),
  Font(R.font.work_sans_variable, FontWeight.Medium),
  Font(R.font.work_sans_variable, FontWeight.SemiBold),
  Font(R.font.work_sans_variable, FontWeight.Bold),
  Font(R.font.work_sans_variable, FontWeight.ExtraBold),
)
private val GreatVibesFontFamily = FontFamily(
  Font(R.font.great_vibes_regular, FontWeight.Normal),
)
private val AppTypography = Typography().run {
  copy(
    displayLarge = displayLarge.copy(fontFamily = WorkSansFontFamily),
    displayMedium = displayMedium.copy(fontFamily = WorkSansFontFamily),
    displaySmall = displaySmall.copy(fontFamily = WorkSansFontFamily),
    headlineLarge = headlineLarge.copy(fontFamily = WorkSansFontFamily),
    headlineMedium = headlineMedium.copy(fontFamily = WorkSansFontFamily),
    headlineSmall = headlineSmall.copy(fontFamily = WorkSansFontFamily),
    titleLarge = titleLarge.copy(fontFamily = WorkSansFontFamily),
    titleMedium = titleMedium.copy(fontFamily = WorkSansFontFamily),
    titleSmall = titleSmall.copy(fontFamily = WorkSansFontFamily),
    bodyLarge = bodyLarge.copy(fontFamily = WorkSansFontFamily),
    bodyMedium = bodyMedium.copy(fontFamily = WorkSansFontFamily),
    bodySmall = bodySmall.copy(fontFamily = WorkSansFontFamily),
    labelLarge = labelLarge.copy(fontFamily = WorkSansFontFamily),
    labelMedium = labelMedium.copy(fontFamily = WorkSansFontFamily),
    labelSmall = labelSmall.copy(fontFamily = WorkSansFontFamily),
  )
}

class MainActivity : ComponentActivity() {
  private var mobileDeepLinkTarget by mutableStateOf<String?>(null)

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    mobileDeepLinkTarget = getMobileDeepLinkTarget(intent)

    val repository = DriveDeckRepository(
      baseUrl = BuildConfig.CARNIVAL_SHOWCASE_BASE_URL,
      pairingUrlOverride = BuildConfig.CARNIVAL_SHOWCASE_PAIRING_URL,
    )
    val lastUsedCodeStore = LastUsedCodeStore(applicationContext)
    val factory = DriveDeckViewModel.Factory(
      repository = repository,
      initialPairingUrl = BuildConfig.CARNIVAL_SHOWCASE_PAIRING_URL,
      lastUsedCodeStore = lastUsedCodeStore,
    )

    setContent {
      MaterialTheme {
        Surface(
          modifier = Modifier.fillMaxSize(),
          color = AppBackground
        ) {
          val viewModel: DriveDeckViewModel = viewModel(factory = factory)
          DriveDeckApp(
            viewModel = viewModel,
            mobileDeepLinkTarget = mobileDeepLinkTarget,
            onMobileDeepLinkConsumed = { mobileDeepLinkTarget = null },
          )
        }
      }
    }
  }

  override fun onNewIntent(intent: Intent) {
    super.onNewIntent(intent)
    setIntent(intent)
    mobileDeepLinkTarget = getMobileDeepLinkTarget(intent)
  }
}

@Composable
private fun DriveDeckApp(
  viewModel: DriveDeckViewModel,
  mobileDeepLinkTarget: String? = null,
  onMobileDeepLinkConsumed: () -> Unit = {},
) {
  var showSplash by remember { mutableStateOf(true) }
  val state = viewModel.uiState
  val isTelevision = isTelevisionDevice()

  LaunchedEffect(Unit) {
    delay(6000)
    showSplash = false
  }

  if (showSplash) {
    SplashScreen(
      widthFraction = if (isTelevision) 0.34f else 0.90f
    )
    return
  }

  if (!isTelevision) {
    MobileWebApp(
      startUrl = BuildConfig.CARNIVAL_SHOWCASE_BASE_URL,
      deepLinkTarget = mobileDeepLinkTarget,
      onDeepLinkConsumed = onMobileDeepLinkConsumed,
    )
    return
  }

  BackHandler {
    viewModel.onBack()
  }

  when (state.screen) {
    is TvScreen.Home -> HomeScreen(
      state = state,
      onCodeChanged = viewModel::updatePairingCode,
      onSubmitCode = viewModel::submitPairingCode,
      onOpenDirect = { viewModel.navigateTo(TvScreen.DirectLink) },
    )

    is TvScreen.DirectLink -> DirectLinkScreen(
      state = state,
      onLinkChanged = viewModel::updateDirectLink,
      onSubmit = viewModel::submitDirectLink,
      onBack = { viewModel.navigateTo(TvScreen.Home) },
    )

    is TvScreen.Folders -> FolderGridScreen(
      state = state,
      onBack = viewModel::onBack,
      onOpenFolder = viewModel::openFolder,
      onOpenPresentation = viewModel::openAlbumPresentation,
    )

    is TvScreen.Gallery -> GalleryScreen(
      state = state,
      onBack = viewModel::onBack,
      onOpenSlideshow = viewModel::openSlideshow,
      onToggleSettings = viewModel::toggleGallerySettings,
      onDecreaseDuration = { viewModel.changeDuration(-1) },
      onIncreaseDuration = { viewModel.changeDuration(1) },
      onToggleLoop = viewModel::toggleLoop,
      onToggleAutoplay = viewModel::toggleAutoplay,
      onTogglePlayVideos = viewModel::togglePlayVideosInSlideshow,
      onStartSlideshow = { viewModel.openSlideshow(0) },
      onOpenPresentation = viewModel::openAlbumPresentation,
    )

    is TvScreen.Slideshow -> SlideshowScreen(
      state = state,
      onBack = viewModel::onBack,
      onPrevious = viewModel::showPreviousSlide,
      onNext = viewModel::showNextSlide,
      onTogglePlay = viewModel::toggleSlideshowPlayback,
      onShowChrome = viewModel::showSlideshowChrome,
      onHideChrome = viewModel::hideSlideshowChrome,
      onPlayVideoInline = viewModel::dismissCurrentVideoPlayerPrompt,
      onOpenVideoPlayer = viewModel::openCurrentVideoInPlayer,
    )

    is TvScreen.VideoPlayer -> VideoPlayerScreen(
      state = state,
      onBack = viewModel::closeVideoPlayer,
    )

    is TvScreen.YouTubePlayer -> YouTubePlayerScreen(
      state = state,
      onBack = viewModel::closeYouTubePlayer,
    )
  }
}

@Composable
private fun isTelevisionDevice(): Boolean {
  val configuration = LocalContext.current.resources.configuration
  return configuration.uiMode and Configuration.UI_MODE_TYPE_MASK == Configuration.UI_MODE_TYPE_TELEVISION
}

@Composable
private fun MobileWebApp(
  startUrl: String,
  deepLinkTarget: String? = null,
  onDeepLinkConsumed: () -> Unit = {},
) {
  val initialUrl = remember(startUrl) {
    startUrl.trim().ifBlank { "https://carnivalshowcase.kaustubhmokashi.com" }
  }
  val initialUrlWithCacheBust = remember(initialUrl) {
    val suffix = String.format(Locale.US, "%d-%d", BuildConfig.VERSION_CODE, System.currentTimeMillis())
    appendQueryParam(initialUrl, "v", suffix)
  }
  val context = LocalContext.current
  val googleWebClientId = remember {
    BuildConfig.CARNIVAL_GOOGLE_WEB_CLIENT_ID.trim()
  }
  var webView by remember { mutableStateOf<WebView?>(null) }
  var pendingFileCallback by remember { mutableStateOf<ValueCallback<Array<Uri>>?>(null) }
  var googleSignInInFlight by remember { mutableStateOf(false) }
  val googleSignInClient = remember(context, googleWebClientId) {
    if (googleWebClientId.isBlank()) {
      null
    } else {
      val options = GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
        .requestEmail()
        .requestProfile()
        .requestIdToken(googleWebClientId)
        .build()
      GoogleSignIn.getClient(context, options)
    }
  }
  val filePickerLauncher = rememberLauncherForActivityResult(
    contract = ActivityResultContracts.StartActivityForResult()
  ) { result ->
    val callback = pendingFileCallback
    pendingFileCallback = null
    callback?.onReceiveValue(
      WebChromeClient.FileChooserParams.parseResult(result.resultCode, result.data)
    )
  }
  val googleSignInLauncher = rememberLauncherForActivityResult(
    contract = ActivityResultContracts.StartActivityForResult()
  ) { result ->
    val activeWebView = webView
    googleSignInInFlight = false
    val hasData = result.data != null
    activeWebView?.let {
      injectAndroidAuthStatus(
        it,
        "Google sign-in callback resultCode=${result.resultCode} data=$hasData",
        false
      )
    }
    if (result.resultCode != Activity.RESULT_OK) {
      val message =
        when (result.resultCode) {
          Activity.RESULT_CANCELED -> "Google sign-in was cancelled or dismissed."
          else -> "Google sign-in failed before completion (resultCode=${result.resultCode})."
        }
      activeWebView?.let { injectAndroidAuthStatus(it, message, true) }
      return@rememberLauncherForActivityResult
    }
    try {
      val account = GoogleSignIn.getSignedInAccountFromIntent(result.data)
        .getResult(ApiException::class.java)
      val idToken = account?.idToken.orEmpty()
      if (idToken.isBlank()) {
        val message = "Google sign-in did not return an ID token."
        activeWebView?.let { injectAndroidAuthStatus(it, message, true) }
        Toast.makeText(context, message, Toast.LENGTH_LONG).show()
        return@rememberLauncherForActivityResult
      }
      activeWebView?.let { completeAndroidGoogleSignIn(it, idToken) }
    } catch (error: Exception) {
      val message = googleSignInErrorMessage(error)
      activeWebView?.let { injectAndroidAuthStatus(it, message, true) }
      Toast.makeText(context, message, Toast.LENGTH_LONG).show()
    }
  }

  BackHandler(enabled = webView != null) {
    val activeWebView = webView ?: return@BackHandler
    activeWebView.evaluateJavascript(
      """
        (function() {
          try {
            var slideshow = document.getElementById('slideshow');
            var slideshowOpen = slideshow &&
              !slideshow.classList.contains('hidden') &&
              getComputedStyle(slideshow).display !== 'none';
            if (slideshowOpen) {
              if (typeof window.closeSlideshow === 'function') {
                window.closeSlideshow();
              } else {
                var closeButton = document.getElementById('close-slideshow') ||
                  document.querySelector('.slideshow-close, [data-action="close-slideshow"]');
                if (closeButton && typeof closeButton.click === 'function') {
                  closeButton.click();
                } else {
                  slideshow.classList.add('hidden');
                  slideshow.setAttribute('aria-hidden', 'true');
                }
              }
              var gallery = document.getElementById('screen-gallery');
              if (gallery) {
                gallery.classList.remove('panel-open');
              }
              if (typeof window.__mobilePromoteSettingsPanel === 'function') {
                window.__mobilePromoteSettingsPanel('android-back');
              }
              var state = window.__mobileUiDebugState || (window.__mobileUiDebugState = { logs: [] });
              var now = new Date().toISOString().slice(11, 23);
              state.logs.unshift(now + ' [back] closed slideshow');
              state.logs = state.logs.slice(0, 80);
              return 'closed-slideshow';
            }
          } catch (_) {}
          return (window.history && window.history.length > 1) ? 'history' : 'none';
        })();
      """.trimIndent()
    ) { result ->
      val handledSlideshow = result == "\"closed-slideshow\"" || result == "closed-slideshow"
      if (handledSlideshow) {
        injectMobileWebDebugPanel(activeWebView, "back", "closed slideshow")
        return@evaluateJavascript
      }
      if (activeWebView.canGoBack()) {
        activeWebView.goBack()
        return@evaluateJavascript
      }
      val hasJsHistory = result == "\"history\"" || result == "history"
      when {
        hasJsHistory -> activeWebView.evaluateJavascript("history.back();", null)
        !isSameWebRoute(activeWebView.url, initialUrlWithCacheBust) ->
          activeWebView.loadUrl(initialUrlWithCacheBust)
        else -> {
          // Keep the user on home instead of finishing the Activity.
        }
      }
    }
  }

  LaunchedEffect(deepLinkTarget, webView) {
    val target = deepLinkTarget?.trim().orEmpty()
    val targetView = webView
    if (target.isNotBlank() && targetView != null) {
      targetView.loadUrl(resolveMobileWebUrl(initialUrl, target))
      onDeepLinkConsumed()
    }
  }

  AndroidView(
    factory = { viewContext ->
      WebView(viewContext).apply {
        webView = this
        webViewClient = object : WebViewClient() {
          override fun onPageStarted(view: WebView?, url: String?, favicon: Bitmap?) {
            super.onPageStarted(view, url, favicon)
            injectMobileWebDebugPanel(view, "onPageStarted", "url=${url.orEmpty()}")
          }

          override fun onPageCommitVisible(view: WebView?, url: String?) {
            super.onPageCommitVisible(view, url)
            injectHomeScreenHeightGuard(view)
            injectCollapsedParentRecovery(view)
            injectMobileWebDebugPanel(view, "onPageCommitVisible", "url=${url.orEmpty()}")
          }

          override fun shouldOverrideUrlLoading(
            view: WebView?,
            request: WebResourceRequest?
          ): Boolean {
            val url = request?.url?.toString().orEmpty()
            return handleMobileWebNavigation(viewContext, view, initialUrlWithCacheBust, url)
          }

          @Deprecated("Deprecated in Android API 24")
          override fun shouldOverrideUrlLoading(view: WebView?, url: String?): Boolean {
            return handleMobileWebNavigation(viewContext, view, initialUrlWithCacheBust, url.orEmpty())
          }

          override fun onReceivedError(
            view: WebView?,
            request: WebResourceRequest?,
            error: WebResourceError?
          ) {
            super.onReceivedError(view, request, error)
            if (request?.isForMainFrame == true) {
              injectMobileWebDebugPanel(
                view,
                "onReceivedError",
                "code=${error?.errorCode ?: -1} desc=${error?.description?.toString().orEmpty()}"
              )
            }
          }

          override fun onReceivedHttpError(
            view: WebView?,
            request: WebResourceRequest?,
            errorResponse: WebResourceResponse?
          ) {
            super.onReceivedHttpError(view, request, errorResponse)
            if (request?.isForMainFrame == true) {
              injectMobileWebDebugPanel(
                view,
                "onReceivedHttpError",
                "status=${errorResponse?.statusCode ?: -1} reason=${errorResponse?.reasonPhrase.orEmpty()}"
              )
            }
          }

          override fun onPageFinished(view: WebView?, url: String?) {
            super.onPageFinished(view, url)
            injectHomeScreenHeightGuard(view)
            injectCollapsedParentRecovery(view)
            injectGalleryCoverRecovery(view)
            injectGalleryTapTracer(view)
            injectSlideshowPaintRecovery(view)
            injectMobileDownloadBridge(view)
            injectAndroidStudioAuthBridge(view)
            injectStudioSidebarDrawerRecovery(view)
            injectFacePickerPopupRecovery(view)
            injectMobileWebDebugPanel(view, "onPageFinished", "url=${url.orEmpty()}")
            scheduleDelayedMobileWebRecovery(view, url.orEmpty())
          }
        }
        webChromeClient = object : WebChromeClient() {
          override fun onProgressChanged(view: WebView?, newProgress: Int) {
            super.onProgressChanged(view, newProgress)
            if (newProgress >= 50) {
              injectHomeScreenHeightGuard(view)
              injectCollapsedParentRecovery(view)
              injectGalleryCoverRecovery(view)
              injectSlideshowPaintRecovery(view)
              injectMobileDownloadBridge(view)
              injectAndroidStudioAuthBridge(view)
              injectStudioSidebarDrawerRecovery(view)
              injectFacePickerPopupRecovery(view)
            }
            injectMobileWebDebugPanel(view, "onProgress", "progress=$newProgress")
          }

          override fun onCreateWindow(
            view: WebView?,
            isDialog: Boolean,
            isUserGesture: Boolean,
            resultMsg: Message?
          ): Boolean {
            val transport = resultMsg?.obj as? WebView.WebViewTransport ?: return false
            val popupWebView = WebView(viewContext).apply {
              settings.javaScriptEnabled = true
              settings.domStorageEnabled = true
              settings.javaScriptCanOpenWindowsAutomatically = true
              webViewClient = object : WebViewClient() {
                private fun forwardToMain(url: String?): Boolean {
                  val resolvedUrl = url.orEmpty()
                  if (resolvedUrl.isBlank()) {
                    return false
                  }
                  val hostWebView = webView
                  if (hostWebView != null) {
                    if (!handleMobileWebNavigation(viewContext, hostWebView, initialUrlWithCacheBust, resolvedUrl)) {
                      hostWebView.loadUrl(resolvedUrl)
                    }
                  }
                  runCatching { destroy() }
                  return true
                }

                override fun shouldOverrideUrlLoading(
                  view: WebView?,
                  request: WebResourceRequest?
                ): Boolean = forwardToMain(request?.url?.toString())

                @Deprecated("Deprecated in Android API 24")
                override fun shouldOverrideUrlLoading(view: WebView?, url: String?): Boolean =
                  forwardToMain(url)

                override fun onPageStarted(view: WebView?, url: String?, favicon: Bitmap?) {
                  super.onPageStarted(view, url, favicon)
                  forwardToMain(url)
                }
              }
            }
            transport.webView = popupWebView
            resultMsg.sendToTarget()
            return true
          }

          override fun onShowFileChooser(
            view: WebView?,
            filePathCallback: ValueCallback<Array<Uri>>?,
            fileChooserParams: WebChromeClient.FileChooserParams?
          ): Boolean {
            pendingFileCallback?.onReceiveValue(null)
            pendingFileCallback = filePathCallback
            val chooserIntent = runCatching {
              fileChooserParams?.createIntent()
            }.getOrNull() ?: Intent(Intent.ACTION_GET_CONTENT).apply {
              addCategory(Intent.CATEGORY_OPENABLE)
              type = "image/*"
              putExtra(Intent.EXTRA_ALLOW_MULTIPLE, true)
            }

            return runCatching {
              filePickerLauncher.launch(chooserIntent)
              true
            }.getOrElse {
              pendingFileCallback = null
              filePathCallback?.onReceiveValue(null)
              false
            }
          }
        }
        settings.javaScriptEnabled = true
        settings.javaScriptCanOpenWindowsAutomatically = true
        settings.loadsImagesAutomatically = true
        settings.domStorageEnabled = true
        settings.databaseEnabled = true
        settings.mediaPlaybackRequiresUserGesture = false
        settings.useWideViewPort = true
        settings.loadWithOverviewMode = true
        settings.setSupportMultipleWindows(true)
        settings.layoutAlgorithm = WebSettings.LayoutAlgorithm.NORMAL
        settings.textZoom = 100
        settings.setSupportZoom(false)
        settings.builtInZoomControls = false
        settings.displayZoomControls = false
        settings.allowFileAccess = true
        settings.allowContentAccess = true
        settings.mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
        settings.cacheMode = WebSettings.LOAD_NO_CACHE
        settings.userAgentString = buildBrowserParityUserAgent(settings.userAgentString)
        CookieManager.getInstance().setAcceptCookie(true)
        CookieManager.getInstance().setAcceptThirdPartyCookies(this, true)
        addJavascriptInterface(MobileWebDownloadBridge(viewContext.applicationContext), "AndroidDownloader")
        addJavascriptInterface(
          MobileWebStudioAuthBridge(viewContext.applicationContext) {
            val client = googleSignInClient
            if (client == null) {
              val message = "Google web client ID is missing in the Android build."
              injectAndroidAuthStatus(this, message, true)
              Toast.makeText(viewContext, message, Toast.LENGTH_LONG).show()
            } else if (googleSignInInFlight) {
              injectAndroidAuthStatus(this, "Google sign-in is already in progress...", false)
            } else {
              runCatching {
                googleSignInInFlight = true
                injectAndroidAuthStatus(this, "Opening Google sign in...", false)
                googleSignInLauncher.launch(client.signInIntent)
              }.onFailure { error ->
                googleSignInInFlight = false
                val message = error.message ?: "Could not open Google sign-in."
                injectAndroidAuthStatus(this, message, true)
                Toast.makeText(viewContext, message, Toast.LENGTH_LONG).show()
              }
            }
          },
          "AndroidStudioAuth"
        )
        setDownloadListener { url, userAgent, contentDisposition, mimeType, _ ->
          val started = enqueueMobileWebDownload(
            context = viewContext,
            url = url.orEmpty(),
            userAgent = userAgent.orEmpty(),
            contentDisposition = contentDisposition.orEmpty(),
            mimeType = mimeType.orEmpty(),
            suggestedFilename = null
          )
          val escapedUrl = url.orEmpty().replace("\\", "\\\\").replace("'", "\\'")
          val status = if (started) "started" else "failed"
          evaluateJavascript(
            """
              (function() {
                var state = window.__mobileUiDebugState || (window.__mobileUiDebugState = { logs: [] });
                var now = new Date().toISOString().slice(11, 23);
                state.logs.unshift(now + ' [download] listener $status url=$escapedUrl');
                state.logs = state.logs.slice(0, 80);
              })();
            """.trimIndent(),
            null
          )
        }
        clearCache(true)
        clearHistory()
        setInitialScale(1)
        setOnTouchListener { _, motionEvent ->
          if (motionEvent?.actionMasked == MotionEvent.ACTION_UP) {
            val density = resources.displayMetrics.density.takeIf { it > 0f } ?: 1f
            val cssX = motionEvent.x / density
            val cssY = motionEvent.y / density
            val bridgeScript = """
              (function() {
                try {
                  if (typeof window.__androidBridgeTap === 'function') {
                    window.__androidBridgeTap(${String.format(Locale.US, "%.2f", cssX)}, ${String.format(Locale.US, "%.2f", cssY)});
                  }
                } catch (_) {}
              })();
            """.trimIndent()
            evaluateJavascript(bridgeScript, null)
          }
          false
        }
        loadUrl(initialUrlWithCacheBust)
      }
    },
    update = { view ->
      webView = view
      if (view.url.isNullOrBlank()) {
        view.loadUrl(initialUrlWithCacheBust)
      }
    },
    modifier = Modifier
      .fillMaxSize()
      .background(AppBackground)
  )

  DisposableEffect(Unit) {
    onDispose {
      pendingFileCallback?.onReceiveValue(null)
      pendingFileCallback = null
      webView = null
    }
  }
}

private fun scheduleDelayedMobileWebRecovery(view: WebView?, url: String) {
  val target = view ?: return
  val delaysMs = longArrayOf(450L, 1200L, 2600L, 4200L)
  delaysMs.forEach { delayMs ->
    target.postDelayed({
      injectHomeScreenHeightGuard(target)
      injectCollapsedParentRecovery(target)
      injectGalleryCoverRecovery(target)
      injectGalleryTapTracer(target)
      injectSlideshowPaintRecovery(target)
      injectMobileDownloadBridge(target)
      injectAndroidStudioAuthBridge(target)
      injectStudioSidebarDrawerRecovery(target)
      injectFacePickerPopupRecovery(target)
      injectMobileWebDebugPanel(target, "tick", "url=$url delay=${delayMs}ms")
    }, delayMs)
  }
}

private fun injectFacePickerPopupRecovery(view: WebView?) {
  val target = view ?: return
  val script = """
    (function() {
      function push(msg) {
        var state = window.__mobileUiDebugState || (window.__mobileUiDebugState = { logs: [] });
        var now = new Date().toISOString().slice(11, 23);
        state.logs.unshift(now + ' [face-popup] ' + msg);
        state.logs = state.logs.slice(0, 80);
      }
      window.__mobilePromoteFacePickerPopup = function(reason) {
        try {
          var backdrop = document.getElementById('face-picker-popup');
          if (!backdrop) return false;
          var dialog = backdrop.querySelector('.face-picker-popup');
          var vh = Math.max(
            window.innerHeight || 0,
            window.visualViewport ? Math.round(window.visualViewport.height) : 0,
            document.documentElement ? document.documentElement.clientHeight : 0
          ) || 1;
          var vw = Math.max(
            window.innerWidth || 0,
            window.visualViewport ? Math.round(window.visualViewport.width) : 0,
            document.documentElement ? document.documentElement.clientWidth : 0
          ) || 1;
          if (backdrop.parentNode !== document.body) {
            document.body.appendChild(backdrop);
          }
          backdrop.style.setProperty('position', 'fixed', 'important');
          backdrop.style.setProperty('inset', '0px', 'important');
          backdrop.style.setProperty('width', vw + 'px', 'important');
          backdrop.style.setProperty('height', vh + 'px', 'important');
          backdrop.style.setProperty('min-height', vh + 'px', 'important');
          backdrop.style.setProperty('z-index', '2147483647', 'important');
          backdrop.style.setProperty('display', 'grid', 'important');
          backdrop.style.setProperty('place-items', 'center', 'important');
          backdrop.style.setProperty('padding', '18px', 'important');
          backdrop.style.setProperty('overflow', 'hidden', 'important');
          backdrop.style.setProperty('box-sizing', 'border-box', 'important');
          backdrop.style.setProperty('transform', 'none', 'important');
          backdrop.style.setProperty('pointer-events', 'auto', 'important');
          if (dialog) {
            dialog.style.setProperty('width', Math.min(720, Math.max(1, vw - 36)) + 'px', 'important');
            dialog.style.setProperty('max-width', 'calc(100vw - 36px)', 'important');
            dialog.style.setProperty('max-height', Math.max(1, vh - 36) + 'px', 'important');
            dialog.style.setProperty('overflow', 'auto', 'important');
            dialog.style.setProperty('box-sizing', 'border-box', 'important');
            dialog.style.setProperty('position', 'relative', 'important');
            dialog.style.setProperty('z-index', '1', 'important');
            dialog.style.setProperty('transform', 'none', 'important');
          }
          push('promoted reason=' + (reason || 'manual') + ' size=' + vw + 'x' + vh + ' dialog=' + (dialog ? 'yes' : 'no'));
          return true;
        } catch (error) {
          push('error=' + (error && error.message ? error.message : 'unknown'));
          return false;
        }
      };

      if (!window.__mobileFacePickerObserverStarted) {
        window.__mobileFacePickerObserverStarted = true;
        try {
          new MutationObserver(function(records) {
            records.forEach(function(record) {
              Array.prototype.slice.call(record.addedNodes || []).forEach(function(node) {
                if (!node || node.nodeType !== 1) return;
                if (node.id === 'face-picker-popup' || (node.querySelector && node.querySelector('#face-picker-popup'))) {
                  window.setTimeout(function() {
                    window.__mobilePromoteFacePickerPopup && window.__mobilePromoteFacePickerPopup('added');
                  }, 0);
                  window.setTimeout(function() {
                    window.__mobilePromoteFacePickerPopup && window.__mobilePromoteFacePickerPopup('added-late');
                  }, 120);
                }
              });
            });
          }).observe(document.body, { childList: true, subtree: true });
          push('observer attached');
        } catch (error) {
          push('observer error=' + (error && error.message ? error.message : 'unknown'));
        }
      }
      window.__mobilePromoteFacePickerPopup('tick');
    })();
  """.trimIndent()
  target.evaluateJavascript(script, null)
}

private class MobileWebDownloadBridge(private val context: Context) {
  @JavascriptInterface
  fun download(url: String?, filename: String?): Boolean {
    return enqueueMobileWebDownload(
      context = context,
      url = url.orEmpty(),
      userAgent = "",
      contentDisposition = "",
      mimeType = "",
      suggestedFilename = filename.orEmpty()
    )
  }
}

private class MobileWebStudioAuthBridge(
  private val context: Context,
  private val onStartGoogleSignIn: () -> Unit
) {
  @JavascriptInterface
  fun startGoogleSignIn() {
    Handler(Looper.getMainLooper()).post {
      runCatching {
        onStartGoogleSignIn()
      }.onFailure { error ->
        Toast.makeText(
          context,
          error.message ?: "Could not open Google sign-in.",
          Toast.LENGTH_LONG
        ).show()
      }
    }
  }
}

private fun completeAndroidGoogleSignIn(view: WebView, idToken: String) {
  val quotedToken = JSONObject.quote(idToken)
  view.evaluateJavascript(
    """
      (async function() {
        try {
          var state = window.__mobileUiDebugState || (window.__mobileUiDebugState = { logs: [] });
          var now = new Date().toISOString().slice(11, 23);
          state.logs.unshift(now + ' [auth] native google token received');
          state.logs = state.logs.slice(0, 80);
          var token = $quotedToken;
          window.__pendingAndroidGoogleIdToken = token;
          try { window.dispatchEvent(new CustomEvent('carnival-android-google-token')); } catch (_) {}
          var maxAttempts = 48;
          var delayMs = 125;
          var attempt = 0;
          while (attempt < maxAttempts) {
            if (window.CarnivalAndroidAuth && typeof window.CarnivalAndroidAuth.signInWithGoogleIdToken === 'function') {
              await window.CarnivalAndroidAuth.signInWithGoogleIdToken(token);
              window.__pendingAndroidGoogleIdToken = '';
              break;
            }
            if (attempt === 0) {
              state.logs.unshift(now + ' [auth] waiting for web auth bridge...');
              state.logs = state.logs.slice(0, 80);
            }
            await new Promise(function(resolve) { window.setTimeout(resolve, delayMs); });
            attempt += 1;
          }
          if (attempt >= maxAttempts) {
            now = new Date().toISOString().slice(11, 23);
            state.logs.unshift(now + ' [auth] web auth bridge still initializing; token queued');
            state.logs = state.logs.slice(0, 80);
            return 'queued';
          }
          now = new Date().toISOString().slice(11, 23);
          state.logs.unshift(now + ' [auth] Firebase credential sign-in complete');
          state.logs = state.logs.slice(0, 80);
          if (location.pathname === '/login') {
            history.replaceState({ studio: true }, '', '/studio');
          }
          return 'ok';
        } catch (error) {
          var message = error && error.message ? error.message : 'Google sign-in failed.';
          var status = document.getElementById('studio-auth-status');
          if (status) {
            status.textContent = message;
            status.classList.add('is-error');
          }
          var debugState = window.__mobileUiDebugState || (window.__mobileUiDebugState = { logs: [] });
          var debugNow = new Date().toISOString().slice(11, 23);
          debugState.logs.unshift(debugNow + ' [auth] error=' + message);
          debugState.logs = debugState.logs.slice(0, 80);
          return 'error:' + message;
        }
      })();
    """.trimIndent(),
    null
  )
}

private fun injectAndroidAuthStatus(view: WebView, message: String, isError: Boolean) {
  val quotedMessage = JSONObject.quote(message)
  val errorFlag = if (isError) "true" else "false"
  view.evaluateJavascript(
    """
      (function() {
        var message = $quotedMessage;
        var status = document.getElementById('studio-auth-status');
        if (status) {
          status.textContent = message;
          status.classList.toggle('is-error', $errorFlag);
        }
        var state = window.__mobileUiDebugState || (window.__mobileUiDebugState = { logs: [] });
        var now = new Date().toISOString().slice(11, 23);
        state.logs.unshift(now + ' [auth] ' + message);
        state.logs = state.logs.slice(0, 80);
      })();
    """.trimIndent(),
    null
  )
}

private fun googleSignInErrorMessage(error: Exception): String {
  if (error is ApiException) {
    return when (error.statusCode) {
      10 -> "Google sign-in config mismatch (DEVELOPER_ERROR 10). Check Firebase Android app package + SHA and Web client ID."
      12500 -> "Google sign-in failed on this device. Check Google Play services and OAuth configuration."
      12501 -> "Google sign-in was cancelled."
      12502 -> "Google sign-in is already in progress."
      7 -> "Network error during Google sign-in."
      else -> "Google sign-in failed (code ${error.statusCode})."
    }
  }
  return error.message ?: "Google sign-in failed."
}

private fun enqueueMobileWebDownload(
  context: Context,
  url: String,
  userAgent: String,
  contentDisposition: String,
  mimeType: String,
  suggestedFilename: String?
): Boolean {
  val trimmedUrl = url.trim()
  val uri = runCatching { Uri.parse(trimmedUrl) }.getOrNull() ?: return false
  val scheme = uri.scheme?.lowercase(Locale.US)
  if (scheme != "http" && scheme != "https") {
    return false
  }

  val filename = (suggestedFilename
    ?.trim()
    ?.takeIf { it.isNotBlank() }
    ?: URLUtil.guessFileName(trimmedUrl, contentDisposition.takeIf { it.isNotBlank() }, mimeType.takeIf { it.isNotBlank() }))
    .replace(Regex("""[\\/:*?"<>|]"""), "_")
    .ifBlank { "photo.jpg" }

  return runCatching {
    val request = DownloadManager.Request(uri)
      .setTitle(filename)
      .setDescription("Downloading photo")
      .setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED)
      .setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, filename)
      .setAllowedOverMetered(true)
      .setAllowedOverRoaming(true)

    if (mimeType.isNotBlank()) {
      request.setMimeType(mimeType)
    }
    if (userAgent.isNotBlank()) {
      request.addRequestHeader("User-Agent", userAgent)
    }
    CookieManager.getInstance().getCookie(trimmedUrl)?.takeIf { it.isNotBlank() }?.let { cookie ->
      request.addRequestHeader("Cookie", cookie)
    }

    val manager = context.getSystemService(Context.DOWNLOAD_SERVICE) as DownloadManager
    manager.enqueue(request)
    showMobileToast(context, "Download started")
    true
  }.getOrElse {
    showMobileToast(context, "Could not start download")
    false
  }
}

private fun showMobileToast(context: Context, message: String) {
  Handler(Looper.getMainLooper()).post {
    Toast.makeText(context.applicationContext, message, Toast.LENGTH_SHORT).show()
  }
}

private fun injectMobileDownloadBridge(view: WebView?) {
  val target = view ?: return
  val script = """
    (function() {
      var bridgeVersion = 2;
      function push(msg) {
        var state = window.__mobileUiDebugState || (window.__mobileUiDebugState = { logs: [] });
        var now = new Date().toISOString().slice(11, 23);
        state.logs.unshift(now + ' [download] ' + msg);
        state.logs = state.logs.slice(0, 80);
        window.__mobileDownloadLast = now + ' ' + msg;
      }
      if (!window.AndroidDownloader) {
        return;
      }
      if (window.__mobileDownloadBridgeVersion === bridgeVersion) {
        return;
      }
      window.__mobileDownloadBridgeVersion = bridgeVersion;
      window.__mobileDownloadBridgeBound = true;
      function currentPhoto() {
        try {
          if (typeof window.getCurrentSlidePhoto === 'function') {
            var direct = window.getCurrentSlidePhoto();
            if (direct && direct.url) return direct;
          }
        } catch (_) {}
        var img = document.getElementById('slide-image') || document.getElementById('slide-image-full');
        if (img && (img.currentSrc || img.src)) {
          return {
            url: img.currentSrc || img.src,
            name: (img.alt || 'photo') + '.jpg'
          };
        }
        var first = document.querySelector('#gallery .photo-card:not(.photo-card-cover) img');
        if (first && (first.currentSrc || first.src)) {
          return {
            url: first.currentSrc || first.src,
            name: (first.alt || 'photo') + '.jpg'
          };
        }
        return null;
      }
      function startNativeDownload(photo, source) {
        if (!photo || !photo.url) {
          push(source + ' no current photo');
          return false;
        }
        var resolvedUrl = '';
        try {
          resolvedUrl = new URL(photo.url, window.location.href).href;
        } catch (_) {
          resolvedUrl = photo.url;
        }
        var name = (photo.name || photo.alt || 'photo.jpg').replace(/[\\/:*?"<>|]/g, '_');
        var ok = false;
        try {
          ok = !!window.AndroidDownloader.download(resolvedUrl, name);
        } catch (error) {
          push(source + ' bridge error=' + (error && error.message ? error.message : 'unknown'));
          return false;
        }
        push(source + ' ' + (ok ? 'started' : 'failed') + ' url=' + resolvedUrl + ' name=' + name);
        return ok;
      }
      if (typeof window.downloadCurrentSlide === 'function' && !window.__mobileDownloadOriginal) {
        window.__mobileDownloadOriginal = window.downloadCurrentSlide;
        window.downloadCurrentSlide = function() {
          if (window.AndroidDownloader && startNativeDownload(currentPhoto(), 'function')) {
            return;
          }
          return window.__mobileDownloadOriginal.apply(this, arguments);
        };
        push('wrapped downloadCurrentSlide');
      }
      window.__mobileDownloadNow = function(source) {
        return startNativeDownload(currentPhoto(), source || 'manual');
      };
      var directButton = document.getElementById('download-slide');
      if (directButton && directButton.dataset.mobileDownloadBound !== String(bridgeVersion)) {
        directButton.dataset.mobileDownloadBound = String(bridgeVersion);
        directButton.addEventListener('click', function(event) {
          push('direct-button click');
          event.preventDefault();
          event.stopPropagation();
          if (event.stopImmediatePropagation) {
            event.stopImmediatePropagation();
          }
          startNativeDownload(currentPhoto(), 'direct-button');
        }, true);
        push('direct button bound');
      }
      document.addEventListener('click', function(event) {
        var target = event.target;
        if (!target || !target.closest) return;
        var button = target.closest('#download-slide, .slideshow-action-download, [data-action="download"]');
        if (!button || !window.AndroidDownloader) return;
        push('click target=' + (button.id ? '#' + button.id : button.tagName.toLowerCase()));
        var photo = currentPhoto();
        event.preventDefault();
        event.stopPropagation();
        startNativeDownload(photo, 'click');
      }, true);
      push('bridge attached v=' + bridgeVersion);
    })();
  """.trimIndent()
  target.evaluateJavascript(script, null)
}

private fun injectSlideshowPaintRecovery(view: WebView?) {
  val target = view ?: return
  val script = """
    (function() {
      function push(msg) {
        var state = window.__mobileUiDebugState || (window.__mobileUiDebugState = { logs: [] });
        var now = new Date().toISOString().slice(11, 23);
        state.logs.unshift(now + ' [slide-recovery] ' + msg);
        state.logs = state.logs.slice(0, 80);
      }

      window.__mobileForceSlideshowPaint = function(reason) {
        try {
          var slideshow = document.getElementById('slideshow');
          var frame = document.querySelector('#slideshow .slideshow-frame');
          var card = document.getElementById('slide-card-a');
          var img = document.getElementById('slide-image');
          var gallery = document.getElementById('screen-gallery');
          var settingsPanel = document.querySelector('#screen-gallery .workspace-side');
          if (!slideshow || !card || !img) {
            push('missing nodes reason=' + (reason || 'manual'));
            return false;
          }
          var isAlbumPresentation = slideshow.classList.contains('slideshow-album-presentation');

          var open = !slideshow.classList.contains('hidden') || getComputedStyle(slideshow).display !== 'none';
          if (!open) {
            return false;
          }

          var vh = Math.max(
            window.innerHeight || 0,
            window.visualViewport ? Math.round(window.visualViewport.height) : 0,
            document.documentElement ? document.documentElement.clientHeight : 0
          );
          var vw = Math.max(
            window.innerWidth || 0,
            window.visualViewport ? Math.round(window.visualViewport.width) : 0,
            document.documentElement ? document.documentElement.clientWidth : 0
          );
          if (!vh) vh = 1;
          if (!vw) vw = 1;
          var pxHeight = vh + 'px';
          var pxWidth = vw + 'px';

          var source = img.currentSrc || img.src || '';
          if (!source) {
            var firstGridImage = document.querySelector('#gallery .photo-card:not(.photo-card-cover) img');
            source = firstGridImage ? (firstGridImage.currentSrc || firstGridImage.src || '') : '';
            if (source) {
              img.src = source;
            }
          }

          slideshow.classList.remove('hidden');
          slideshow.classList.remove('slideshow-ui-hidden');
          slideshow.style.display = 'block';
          slideshow.style.position = 'fixed';
          slideshow.style.inset = '0';
          slideshow.style.width = pxWidth;
          slideshow.style.height = pxHeight;
          slideshow.style.minHeight = pxHeight;
          slideshow.style.zIndex = '2147483600';
          if (isAlbumPresentation) {
            slideshow.style.removeProperty('background');
          } else {
            slideshow.style.background = slideshow.style.background || '#ffffff';
          }
          slideshow.style.overflow = 'hidden';
          slideshow.setAttribute('aria-hidden', 'false');

          if (frame) {
            frame.style.position = 'relative';
            frame.style.display = 'block';
            frame.style.width = pxWidth;
            frame.style.height = pxHeight;
            frame.style.minHeight = pxHeight;
            frame.style.overflow = 'hidden';
          }

          if (isAlbumPresentation) {
            var entries = [
              { card: document.getElementById('slide-card-a'), image: document.getElementById('slide-image') },
              { card: document.getElementById('slide-card-b'), image: document.getElementById('slide-image-full') }
            ];
            var presentationMaxWidth = Math.max(1, Math.round(vw * 0.82)) + 'px';
            var presentationMaxHeight = Math.max(1, Math.round(vh * 0.80)) + 'px';
            var presentationMat = 14;
            var presentationImageMaxWidth = Math.max(1, Math.round(vw * 0.82) - (presentationMat * 2)) + 'px';
            var presentationImageMaxHeight = Math.max(1, Math.round(vh * 0.80) - (presentationMat * 2)) + 'px';
            entries.forEach(function(entry) {
              if (entry.card) {
                [
                  'min-height', 'place-items', 'opacity', 'visibility', 'transform'
                ].forEach(function(prop) { entry.card.style.removeProperty(prop); });
                entry.card.style.position = 'absolute';
                entry.card.style.top = '50%';
                entry.card.style.left = '50%';
                entry.card.style.display = 'grid';
                entry.card.style.placeItems = 'center';
                entry.card.style.width = 'auto';
                entry.card.style.height = 'auto';
                entry.card.style.maxWidth = presentationMaxWidth;
                entry.card.style.maxHeight = presentationMaxHeight;
                entry.card.style.padding = presentationMat + 'px';
                entry.card.style.boxSizing = 'border-box';
                entry.card.style.overflow = 'hidden';
                entry.card.style.background = '#ffffff';
              }
              if (entry.image) {
                [
                  'visibility', 'opacity', 'margin', 'background'
                ].forEach(function(prop) { entry.image.style.removeProperty(prop); });
                entry.image.style.display = 'block';
                entry.image.style.width = 'auto';
                entry.image.style.height = 'auto';
                entry.image.style.maxWidth = presentationImageMaxWidth;
                entry.image.style.maxHeight = presentationImageMaxHeight;
                entry.image.style.objectFit = 'contain';
                entry.image.style.boxSizing = 'border-box';
                entry.image.style.borderRadius = '10px';
                entry.image.style.clipPath = 'inset(0 round 10px)';
                if (entry.image === img) {
                  entry.image.classList.remove('hidden');
                  if (source && !entry.image.src) {
                    entry.image.src = source;
                  }
                }
              }
            });
          } else {
            card.classList.remove('hidden', 'is-leaving');
            card.classList.add('is-active');
            card.style.position = 'absolute';
            card.style.top = Math.round(vh / 2) + 'px';
            card.style.left = Math.round(vw / 2) + 'px';
            card.style.zIndex = '20';
            card.style.display = 'grid';
            card.style.placeItems = 'center';
            card.style.width = pxWidth;
            card.style.height = pxHeight;
            card.style.maxWidth = pxWidth;
            card.style.maxHeight = pxHeight;
            card.style.minHeight = '0';
            card.style.opacity = '1';
            card.style.visibility = 'visible';
            card.style.transform = 'translate(-50%, -50%)';
            card.setAttribute('aria-hidden', 'false');

            img.classList.remove('hidden');
            img.style.display = 'block';
            img.style.visibility = 'visible';
            img.style.opacity = '1';
            img.style.width = 'auto';
            img.style.height = 'auto';
            img.style.maxWidth = pxWidth;
            img.style.maxHeight = pxHeight;
            img.style.objectFit = 'contain';
            img.style.margin = '0 auto';
            img.style.background = 'transparent';
            if (source && !img.src) {
              img.src = source;
            }
          }

          var loader = document.getElementById('slideshow-loader');
          if (loader) {
            loader.classList.add('hidden');
          }

          window.__mobilePromoteSettingsPanel && window.__mobilePromoteSettingsPanel('paint');

          push('applied reason=' + (reason || 'manual') + ' mode=' + (isAlbumPresentation ? 'presentation' : 'standard') + ' size=' + pxWidth + 'x' + pxHeight + ' src=' + (source || 'na'));
          return true;
        } catch (error) {
          push('error=' + (error && error.message ? error.message : 'unknown'));
          return false;
        }
      };

      window.__mobilePromoteSettingsPanel = function(reason) {
        try {
          var gallery = document.getElementById('screen-gallery');
          var slideshow = document.getElementById('slideshow');
          var side = document.querySelector('#screen-gallery .workspace-side') ||
            document.querySelector('body > .workspace-side[data-mobile-settings-promoted="true"]');
          if (!gallery || !side) return false;

          var slideshowOpen = slideshow &&
            !slideshow.classList.contains('hidden') &&
            getComputedStyle(slideshow).display !== 'none';
          if (slideshowOpen) {
            window.__mobileSlideshowHadOpenSettingsContext = true;
          } else if (window.__mobileSlideshowHadOpenSettingsContext && gallery.classList.contains('panel-open')) {
            gallery.classList.remove('panel-open');
            window.__mobileSlideshowHadOpenSettingsContext = false;
            push('settings closed after slideshow close reason=' + (reason || 'manual'));
          }

          var panelOpen = gallery.classList.contains('panel-open');
          if (!panelOpen) {
            if (side.dataset && side.dataset.mobileSettingsPromoted === 'true' && window.__mobileSettingsPanelHome) {
              var home = window.__mobileSettingsPanelHome;
              if (home.parent && document.contains(home.parent)) {
                if (home.nextSibling && document.contains(home.nextSibling) && home.nextSibling.parentNode === home.parent) {
                  home.parent.insertBefore(side, home.nextSibling);
                } else {
                  home.parent.appendChild(side);
                }
              }
              delete side.dataset.mobileSettingsPromoted;
            }
            side.style.removeProperty('display');
            side.style.removeProperty('z-index');
            side.style.removeProperty('pointer-events');
            side.style.removeProperty('transform');
            side.style.removeProperty('isolation');
            side.style.removeProperty('position');
            side.style.removeProperty('top');
            side.style.removeProperty('right');
            side.style.removeProperty('bottom');
            side.style.removeProperty('left');
            side.style.removeProperty('width');
            side.style.removeProperty('height');
            side.style.removeProperty('max-height');
            side.style.removeProperty('overflow');
            side.style.removeProperty('background');
            side.style.removeProperty('box-shadow');
            return false;
          }

          if (!window.__mobileSettingsPanelHome) {
            window.__mobileSettingsPanelHome = {
              parent: side.parentNode,
              nextSibling: side.nextSibling
            };
          }
          if (side.parentNode !== document.body) {
            document.body.appendChild(side);
            if (side.dataset) {
              side.dataset.mobileSettingsPromoted = 'true';
            }
          }

          var vh = Math.max(
            window.innerHeight || 0,
            window.visualViewport ? Math.round(window.visualViewport.height) : 0,
            document.documentElement ? document.documentElement.clientHeight : 0
          ) || 1;
          var vw = Math.max(
            window.innerWidth || 0,
            window.visualViewport ? Math.round(window.visualViewport.width) : 0,
            document.documentElement ? document.documentElement.clientWidth : 0
          ) || 1;
          var width = Math.min(360, Math.max(1, vw - 24));

          side.style.setProperty('display', 'block', 'important');
          side.style.setProperty('position', 'fixed', 'important');
          side.style.setProperty('top', '0px', 'important');
          side.style.setProperty('right', '0px', 'important');
          side.style.setProperty('bottom', 'auto', 'important');
          side.style.setProperty('left', 'auto', 'important');
          side.style.setProperty('width', width + 'px', 'important');
          side.style.setProperty('height', vh + 'px', 'important');
          side.style.setProperty('max-height', vh + 'px', 'important');
          side.style.setProperty('overflow', 'auto', 'important');
          side.style.setProperty('z-index', '2147483647', 'important');
          side.style.setProperty('pointer-events', 'auto', 'important');
          side.style.setProperty('background', 'var(--template-bg)', 'important');
          side.style.setProperty('box-shadow', '-24px 0 56px rgba(var(--template-accent-rgb), 0.22)', 'important');
          side.style.setProperty('transform', 'none', 'important');
          side.style.setProperty('isolation', 'isolate', 'important');

          if (slideshow && !slideshow.classList.contains('hidden')) {
            slideshow.style.setProperty('z-index', '2147483600', 'important');
          }

          push('settings promoted reason=' + (reason || 'manual') + ' size=' + width + 'x' + vh + ' parent=' + (side.parentNode === document.body ? 'body' : 'gallery'));
          return true;
        } catch (error) {
          push('settings promote error=' + (error && error.message ? error.message : 'unknown'));
          return false;
        }
      };

      if (!window.__mobileSettingsPanelObserverStarted) {
        window.__mobileSettingsPanelObserverStarted = true;
        try {
          var galleryForSettings = document.getElementById('screen-gallery');
          if (galleryForSettings && window.MutationObserver) {
            new MutationObserver(function(records) {
              records.forEach(function(record) {
                if (record.attributeName === 'class') {
                  window.__mobilePromoteSettingsPanel && window.__mobilePromoteSettingsPanel('class-change');
                }
              });
            }).observe(galleryForSettings, { attributes: true, attributeFilter: ['class'] });
          }

          document.addEventListener('click', function(event) {
            var target = event.target;
            if (!target || !target.closest) return;
            if (target.closest('#toggle-slideshow-settings') || target.closest('#toggle-gallery-settings')) {
              window.setTimeout(function() {
                window.__mobilePromoteSettingsPanel && window.__mobilePromoteSettingsPanel('settings-click');
              }, 0);
              window.setTimeout(function() {
                window.__mobilePromoteSettingsPanel && window.__mobilePromoteSettingsPanel('settings-click-late');
              }, 120);
            }
          }, true);

          push('settings observer attached');
        } catch (error) {
          push('settings observer error=' + (error && error.message ? error.message : 'unknown'));
        }
      }

      if (!window.__mobileSlideshowLifecycleObserverStarted) {
        window.__mobileSlideshowLifecycleObserverStarted = true;
        try {
          var watched = [
            document.getElementById('slideshow'),
            document.getElementById('slide-card-a'),
            document.getElementById('slide-image'),
            document.getElementById('slideshow-loader')
          ].filter(Boolean);
          var observer = new MutationObserver(function(records) {
            records.forEach(function(record) {
              var target = record.target;
              var name = target.id ? '#' + target.id : target.tagName.toLowerCase();
              var value = '';
              if (record.attributeName === 'class') {
                value = target.className || '';
              } else if (record.attributeName === 'src') {
                value = target.currentSrc || target.src || '';
              } else if (record.attributeName === 'style') {
                value = target.getAttribute('style') || '';
              } else if (record.attributeName === 'aria-hidden') {
                value = target.getAttribute('aria-hidden') || '';
              }
              push('mutate ' + name + ' ' + record.attributeName + '=' + value);
              if (target.id === 'slideshow' && record.attributeName === 'class') {
                window.__mobilePromoteSettingsPanel && window.__mobilePromoteSettingsPanel('slideshow-class');
              }
            });
          });
          watched.forEach(function(node) {
            observer.observe(node, {
              attributes: true,
              attributeFilter: ['class', 'src', 'style', 'aria-hidden']
            });
          });
          push('observer attached nodes=' + watched.length);
        } catch (error) {
          push('observer error=' + (error && error.message ? error.message : 'unknown'));
        }
      }

      window.__mobileForceSlideshowPaint('tick');
      window.__mobilePromoteSettingsPanel && window.__mobilePromoteSettingsPanel('tick');
    })();
  """.trimIndent()
  target.evaluateJavascript(script, null)
}

private fun injectAndroidStudioAuthBridge(view: WebView?) {
  val target = view ?: return
  val script = """
    (function() {
      function push(msg) {
        var state = window.__mobileUiDebugState || (window.__mobileUiDebugState = { logs: [] });
        var now = new Date().toISOString().slice(11, 23);
        state.logs.unshift(now + ' [auth] ' + msg);
        state.logs = state.logs.slice(0, 80);
      }
      if (!window.AndroidStudioAuth || typeof window.AndroidStudioAuth.startGoogleSignIn !== 'function') {
        push('android bridge unavailable');
        return;
      }
      function bind() {
        var button = document.getElementById('google-login-button');
        if (!button) {
          return false;
        }
        if (button.dataset.androidNativeAuthBound === 'true') {
          return true;
        }
        button.dataset.androidNativeAuthBound = 'true';
        button.addEventListener('click', function(event) {
          event.preventDefault();
          event.stopPropagation();
          if (event.stopImmediatePropagation) {
            event.stopImmediatePropagation();
          }
          var status = document.getElementById('studio-auth-status');
          if (status) {
            status.textContent = 'Opening Google sign in...';
            status.classList.remove('is-error');
          }
          push('native google sign-in requested');
          window.AndroidStudioAuth.startGoogleSignIn();
        }, true);
        push('native google button bound');
        return true;
      }
      if (!bind() && !window.__androidStudioAuthObserverStarted) {
        window.__androidStudioAuthObserverStarted = true;
        try {
          new MutationObserver(function() {
            bind();
          }).observe(document.documentElement || document.body, { childList: true, subtree: true });
          push('button observer attached');
        } catch (error) {
          push('observer error=' + (error && error.message ? error.message : 'unknown'));
        }
      }
    })();
  """.trimIndent()
  target.evaluateJavascript(script, null)
}

private fun injectStudioSidebarDrawerRecovery(view: WebView?) {
  val target = view ?: return
  val script = """
    (function() {
      function push(msg) {
        var state = window.__mobileUiDebugState || (window.__mobileUiDebugState = { logs: [] });
        var now = new Date().toISOString().slice(11, 23);
        state.logs.unshift(now + ' [studio-drawer] ' + msg);
        state.logs = state.logs.slice(0, 80);
      }

      function getNodes() {
        return {
          dashboard: document.getElementById('studio-dashboard-panel'),
          sidebar: document.getElementById('studio-sidebar'),
          scrim: document.getElementById('studio-sidebar-scrim'),
          toggle: document.getElementById('studio-sidebar-toggle'),
          close: document.getElementById('studio-sidebar-close')
        };
      }

      function isStudioRoute() {
        return location.pathname === '/studio' || location.pathname.indexOf('/studio/') === 0;
      }

      function isMobile() {
        return Math.max(window.innerWidth || 0, document.documentElement.clientWidth || 0) <= 900;
      }

      function rememberHome(node, key) {
        if (!node || window[key]) return;
        var marker = document.createComment(key);
        node.parentNode && node.parentNode.insertBefore(marker, node);
        window[key] = {
          parent: node.parentNode,
          marker: marker
        };
      }

      function promoteForNativeDrawer(n) {
        rememberHome(n.scrim, '__mobileStudioDrawerScrimHome');
        rememberHome(n.sidebar, '__mobileStudioDrawerSidebarHome');
        if (n.scrim && n.scrim.parentNode !== document.body) {
          document.body.appendChild(n.scrim);
        }
        if (n.sidebar && n.sidebar.parentNode !== document.body) {
          document.body.appendChild(n.sidebar);
        }
      }

      function restoreFromNativeDrawer(n) {
        var sidebarHome = window.__mobileStudioDrawerSidebarHome;
        var scrimHome = window.__mobileStudioDrawerScrimHome;
        if (n.sidebar && sidebarHome && sidebarHome.parent && sidebarHome.marker) {
          sidebarHome.parent.insertBefore(n.sidebar, sidebarHome.marker);
          sidebarHome.marker.remove();
          window.__mobileStudioDrawerSidebarHome = null;
        }
        if (n.scrim && scrimHome && scrimHome.parent && scrimHome.marker) {
          scrimHome.parent.insertBefore(n.scrim, scrimHome.marker);
          scrimHome.marker.remove();
          window.__mobileStudioDrawerScrimHome = null;
        }
      }

      function paint(open, reason) {
        var n = getNodes();
        if (!isStudioRoute() || !isMobile() || !n.dashboard || !n.sidebar || n.dashboard.classList.contains('hidden')) {
          return false;
        }

        if (open) {
          promoteForNativeDrawer(n);
          n = getNodes();
        }

        n.dashboard.classList.toggle('sidebar-open', !!open);
        document.body.classList.toggle('studio-sidebar-open-native', !!open);

        if (n.toggle) {
          n.toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
        }

        if (n.scrim) {
          n.scrim.classList.toggle('hidden', !open);
          n.scrim.style.position = 'fixed';
          n.scrim.style.inset = '0';
          n.scrim.style.display = open ? 'block' : 'none';
          n.scrim.style.zIndex = '2147483400';
          n.scrim.style.background = 'rgba(0,0,0,0.28)';
          n.scrim.style.border = '0';
          n.scrim.style.padding = '0';
          n.scrim.style.pointerEvents = open ? 'auto' : 'none';
        }

        n.sidebar.style.position = 'fixed';
        n.sidebar.style.top = '0';
        n.sidebar.style.left = '0';
        n.sidebar.style.bottom = '0';
        n.sidebar.style.width = 'min(320px, calc(100vw - 32px))';
        n.sidebar.style.height = '100vh';
        n.sidebar.style.minHeight = '100vh';
        n.sidebar.style.display = 'grid';
        n.sidebar.style.visibility = 'visible';
        n.sidebar.style.opacity = '1';
        n.sidebar.style.zIndex = '2147483401';
        n.sidebar.style.background = '#fff';
        n.sidebar.style.overflowX = 'hidden';
        n.sidebar.style.overflowY = 'auto';
        n.sidebar.style.transform = open ? 'translate3d(0,0,0)' : 'translate3d(-110%,0,0)';
        n.sidebar.style.webkitTransform = n.sidebar.style.transform;
        n.sidebar.style.willChange = 'transform';
        n.sidebar.style.pointerEvents = open ? 'auto' : 'none';
        n.sidebar.style.boxShadow = open ? '18px 0 48px rgba(0,0,0,0.18)' : '';
        n.sidebar.style.contain = 'none';
        n.sidebar.style.clipPath = 'none';
        n.sidebar.style.webkitClipPath = 'none';

        if (!open) {
          restoreFromNativeDrawer(n);
        }

        push((open ? 'open' : 'close') + ' reason=' + reason);
        return true;
      }

      window.__mobileStudioDrawerPaint = paint;

      if (!window.__mobileStudioDrawerBound) {
        window.__mobileStudioDrawerBound = true;
        document.addEventListener('click', function(event) {
          var n = getNodes();
          var target = event.target;
          if (!target || !target.closest) return;

          if (n.toggle && target.closest('#studio-sidebar-toggle')) {
            var shouldOpen = !(n.dashboard && n.dashboard.classList.contains('sidebar-open'));
            window.setTimeout(function() { paint(shouldOpen, 'toggle-click'); }, 0);
            window.setTimeout(function() { paint(shouldOpen, 'toggle-click-late'); }, 80);
            return;
          }

          if ((n.close && target.closest('#studio-sidebar-close')) || (n.scrim && target.closest('#studio-sidebar-scrim'))) {
            window.setTimeout(function() { paint(false, 'close-click'); }, 0);
          }
        }, true);

        document.addEventListener('keydown', function(event) {
          if (event.key === 'Escape') {
            paint(false, 'escape');
          }
        }, true);

        push('bound');
      }

      var nodes = getNodes();
      var isOpen = !!(nodes.dashboard && nodes.dashboard.classList.contains('sidebar-open'));
      if (isOpen || document.body.classList.contains('studio-sidebar-open-native')) {
        paint(isOpen, 'tick');
      }
    })();
  """.trimIndent()
  target.evaluateJavascript(script, null)
}

private fun injectGalleryTapTracer(view: WebView?) {
  val target = view ?: return
  val script = """
    (function() {
      var state = window.__mobileUiDebugState || (window.__mobileUiDebugState = { logs: [] });
      if (window.__mobileTapTracerBound) return;
      window.__mobileTapTracerBound = true;
      function push(msg) {
        var now = new Date().toISOString().slice(11, 23);
        state.logs.unshift(now + ' [tap] ' + msg);
        state.logs = state.logs.slice(0, 80);
      }
      function onHit(e, type) {
        var t = e && e.target;
        if (!t || !t.closest) return;
        var card = t.closest('#gallery .photo-card');
        if (!card) return;
        push(type + ' idx=' + ((card.dataset && card.dataset.index) ? card.dataset.index : 'na') + ' prevented=' + !!e.defaultPrevented);
        if (type === 'touchend' || type === 'pointerup') {
          window.setTimeout(function() {
            try {
              if (!card.isConnected) return;
              var idx = Number((card.dataset && card.dataset.index) ? card.dataset.index : 0) || 0;
              if (typeof window.openSlideshow === 'function') {
                window.openSlideshow(idx);
                push('bridge-openSlideshow idx=' + idx);
              } else {
                card.click();
                push('bridge-click idx=' + idx);
              }
              window.setTimeout(function() {
                try {
                  if (typeof window.__mobileForceSlideshowPaint === 'function') {
                    window.__mobileForceSlideshowPaint('tap-bridge');
                  }
                } catch (_) {}
              }, 120);
            } catch (_) {}
          }, 0);
        }
      }
      document.addEventListener('touchend', function(e) { onHit(e, 'touchend'); }, true);
      document.addEventListener('pointerup', function(e) { onHit(e, 'pointerup'); }, true);
      document.addEventListener('click', function(e) { onHit(e, 'click'); }, true);
      window.__androidBridgeTap = function(x, y) {
        try {
          var px = Number(x) || 0;
          var py = Number(y) || 0;
          var el = document.elementFromPoint(px, py);
          var downloadButton = el && el.closest ? el.closest('#download-slide, .slideshow-action-download, [data-action="download"]') : null;
          if (!downloadButton) {
            var downloadCandidates = Array.prototype.slice.call(document.querySelectorAll('#download-slide, .slideshow-action-download, [data-action="download"]'));
            downloadButton = downloadCandidates.find(function(candidate) {
              var style = getComputedStyle(candidate);
              if (style.display === 'none' || style.visibility === 'hidden' || style.pointerEvents === 'none') return false;
              var rect = candidate.getBoundingClientRect();
              var pad = 24;
              return px >= rect.left - pad && px <= rect.right + pad && py >= rect.top - pad && py <= rect.bottom + pad;
            }) || null;
          }
          if (downloadButton && typeof window.__mobileDownloadNow === 'function') {
            push('android-download x=' + px + ' y=' + py + ' via=' + (downloadButton.id ? '#' + downloadButton.id : downloadButton.tagName.toLowerCase()));
            window.__mobileDownloadNow('android-bridge');
            return;
          }
          if (!el || !el.closest) return;
          var card = el.closest('#gallery .photo-card');
          if (!card) return;
          var idx = Number((card.dataset && card.dataset.index) ? card.dataset.index : 0) || 0;
          push('android-bridge idx=' + idx + ' x=' + x + ' y=' + y);
          if (typeof window.openSlideshow === 'function') {
            window.openSlideshow(idx);
            push('android-openSlideshow idx=' + idx);
          } else {
            card.click();
            push('android-click idx=' + idx);
          }
          window.setTimeout(function() {
            try {
              if (typeof window.__mobileForceSlideshowPaint === 'function') {
                window.__mobileForceSlideshowPaint('android-bridge');
              }
            } catch (_) {}
          }, 120);
        } catch (_) {}
      };
    })();
  """.trimIndent()
  target.evaluateJavascript(script, null)
}

private fun appendQueryParam(rawUrl: String, key: String, value: String): String {
  val uri = runCatching { Uri.parse(rawUrl) }.getOrNull() ?: return rawUrl
  if (uri.getQueryParameter(key) == value) return rawUrl
  return uri.buildUpon()
    .appendQueryParameter(key, value)
    .build()
    .toString()
}

private fun isSameWebRoute(currentUrl: String?, targetUrl: String): Boolean {
  val current = runCatching { Uri.parse(currentUrl.orEmpty()) }.getOrNull() ?: return false
  val target = runCatching { Uri.parse(targetUrl) }.getOrNull() ?: return false
  val currentHost = current.host.orEmpty().lowercase()
  val targetHost = target.host.orEmpty().lowercase()
  if (currentHost != targetHost) return false
  val currentPath = current.path.orEmpty().ifBlank { "/" }.trimEnd('/').ifBlank { "/" }
  val targetPath = target.path.orEmpty().ifBlank { "/" }.trimEnd('/').ifBlank { "/" }
  return currentPath == targetPath
}

private fun jsQuoted(value: String): String =
  "\"" + value
    .replace("\\", "\\\\")
    .replace("\"", "\\\"")
    .replace("\n", "\\n")
    .replace("\r", "\\r") + "\""

private fun injectHomeScreenHeightGuard(view: WebView?) {
  val target = view ?: return
  val script = """
    (function() {
      var direct = document.getElementById('screen-direct-link');
      var appShell = document.querySelector('.app-shell');
      if (!direct || !appShell) return;

      var vh = Math.max(
        window.innerHeight || 0,
        window.visualViewport ? Math.round(window.visualViewport.height) : 0,
        document.documentElement ? document.documentElement.clientHeight : 0
      );
      if (!vh) return;

      var active = direct.classList.contains('active');
      if (active) {
        appShell.style.minHeight = vh + 'px';
        direct.style.minHeight = vh + 'px';
        direct.style.display = 'grid';
        direct.style.gridTemplateRows = 'auto 1fr auto';
      } else {
        appShell.style.removeProperty('min-height');
        direct.style.removeProperty('min-height');
        direct.style.removeProperty('display');
        direct.style.removeProperty('grid-template-rows');
      }
    })();
  """.trimIndent()
  target.evaluateJavascript(script, null)
}

private fun injectCollapsedParentRecovery(view: WebView?) {
  val target = view ?: return
  val script = """
    (function() {
      var html = document.documentElement;
      var body = document.body;
      var appShell = document.querySelector('.app-shell');
      if (!html || !body || !appShell) return;

      var vh = Math.max(
        window.innerHeight || 0,
        window.visualViewport ? Math.round(window.visualViewport.height) : 0,
        html.clientHeight || 0
      );
      if (!vh) return;

      var collapsed =
        (body.clientHeight || 0) < 80 ||
        (appShell.getBoundingClientRect().height || 0) < 80;
      if (!collapsed) return;

      html.style.minHeight = vh + 'px';
      body.style.minHeight = vh + 'px';
      body.style.height = 'auto';
      appShell.style.minHeight = vh + 'px';
      appShell.style.height = 'auto';

      var direct = document.getElementById('screen-direct-link');
      var gallery = document.getElementById('screen-gallery');
      if (direct && direct.classList.contains('active')) {
        direct.style.minHeight = vh + 'px';
      }
      if (gallery && gallery.classList.contains('active')) {
        gallery.style.minHeight = vh + 'px';
      }
    })();
  """.trimIndent()
  target.evaluateJavascript(script, null)
}

private fun injectGalleryCoverRecovery(view: WebView?) {
  val target = view ?: return
  val script = """
    (function() {
      var gallery = document.getElementById('screen-gallery');
      var cover = document.getElementById('cover-photo');
      if (!gallery || !cover) return;
      if (!gallery.classList.contains('active')) return;

      function ensureCoverFromGrid() {
        var existingCoverCard = cover.querySelector('.photo-card-cover img');
        if (existingCoverCard) return true;
        var firstGridImage = document.querySelector('#gallery .photo-card:not(.photo-card-cover) img');
        var source = firstGridImage ? (firstGridImage.currentSrc || firstGridImage.src || '') : '';
        if (!source) {
          var workspaceMain = document.querySelector('#screen-gallery .workspace-main');
          if (workspaceMain) {
            var cs = getComputedStyle(workspaceMain);
            var bg = cs.getPropertyValue('--loading-cover-image') || '';
            bg = String(bg || '').trim();
            if (bg && bg !== 'none') {
              cover.classList.add('has-loading-background');
              try {
                cover.style.setProperty('--loading-cover-image', bg);
              } catch (_) {}
              return true;
            }
          }
        }
        if (!source) return false;
        cover.classList.add('has-cover-image');
        cover.style.setProperty('--cover-image', 'url("' + source.replace(/"/g, '\\"') + '")');
        var card = document.createElement('div');
        card.className = 'photo-card photo-card-cover';
        var img = document.createElement('img');
        img.src = source;
        img.alt = 'Cover photo';
        card.appendChild(img);
        cover.insertBefore(card, cover.firstChild);
        return true;
      }

      function releaseLoadingUi() {
        var loadingIndicator = document.querySelector('.loading-indicator');
        gallery.classList.remove('loading');
        gallery.classList.remove('loading-fading');
        gallery.classList.add('revealed');
        if (loadingIndicator) {
          loadingIndicator.classList.add('hidden');
        }
      }

      var recoveryState = window.__mobileUiRecoveryState || (window.__mobileUiRecoveryState = {});
      if (!recoveryState.galleryObserverStarted) {
        recoveryState.galleryObserverStarted = true;
        try {
          var galleryGrid = document.getElementById('gallery');
          if (galleryGrid && window.MutationObserver) {
            var observer = new MutationObserver(function() {
              try {
                if (ensureCoverFromGrid()) {
                  releaseLoadingUi();
                }
              } catch (_) {}
            });
            observer.observe(galleryGrid, { childList: true, subtree: true });
            recoveryState.galleryObserver = observer;
          }
        } catch (_) {}
      }

      if (!recoveryState.loadingWatchdogStarted) {
        recoveryState.loadingWatchdogStarted = true;
        window.setTimeout(function() {
          try {
            var g = document.getElementById('screen-gallery');
            var c = document.getElementById('cover-photo');
            if (!g || !c || !g.classList.contains('active')) return;
            if (g.classList.contains('loading')) {
              releaseLoadingUi();
            }
            ensureCoverFromGrid();
          } catch (_) {}
        }, 1800);
      }

      var coverRect = cover.getBoundingClientRect();
      var hasCoverNode = !!cover.querySelector('.photo-card-cover img');
      var hasCoverClass = cover.classList.contains('has-cover-image');
      if (coverRect.height > 40 && (hasCoverNode || hasCoverClass)) return;

      var vh = Math.max(
        window.innerHeight || 0,
        window.visualViewport ? Math.round(window.visualViewport.height) : 0,
        document.documentElement ? document.documentElement.clientHeight : 0
      );
      if (vh > 0) {
        cover.style.minHeight = vh + 'px';
        cover.style.height = vh + 'px';
      }

      if (gallery.classList.contains('loading') && ensureCoverFromGrid()) {
        releaseLoadingUi();
      }

      ensureCoverFromGrid();
    })();
  """.trimIndent()
  target.evaluateJavascript(script, null)
}

private fun injectMobileWebDebugPanel(view: WebView?, phase: String, note: String = "") {
  val target = view ?: return
  val appId = BuildConfig.APPLICATION_ID
  val webClientIdRaw = BuildConfig.CARNIVAL_GOOGLE_WEB_CLIENT_ID.trim()
  val webClientIdMasked =
    when {
      webClientIdRaw.isBlank() -> "missing"
      webClientIdRaw.length <= 16 -> webClientIdRaw
      else -> "${webClientIdRaw.take(8)}...${webClientIdRaw.takeLast(8)}"
    }
  val script = """
    (function() {
      var phase = ${jsQuoted(phase)};
      var note = ${jsQuoted(note)};
      function r(v){ return (typeof v === 'number' && isFinite(v)) ? Math.round(v) : v; }
      function metric(sel) {
        var el = null;
        try { el = document.querySelector(sel); } catch (_) { el = null; }
        if (!el) return sel + ':missing';
        var cs = getComputedStyle(el);
        var rect = el.getBoundingClientRect();
        return sel + ': rect=' + r(rect.width) + 'x' + r(rect.height) +
          ' off=' + el.offsetWidth + 'x' + el.offsetHeight +
          ' pos=' + cs.position +
          ' disp=' + cs.display +
          ' h=' + cs.height +
          ' minH=' + cs.minHeight +
          ' ov=' + cs.overflow + '/' + cs.overflowY;
      }
      function inlineStyleLine(sel) {
        var el = null;
        try { el = document.querySelector(sel); } catch (_) { el = null; }
        if (!el) return sel + '.style=missing';
        return sel + '.style h=' + (el.style.height || 'na') + ' minH=' + (el.style.minHeight || 'na');
      }
      function flagLine() {
        var cover = document.getElementById('cover-photo');
        if (!cover) return 'coverRecovery=missing';
        var hasNode = !!cover.querySelector('.photo-card-cover img');
        return 'coverRecovery hasNode=' + hasNode + ' hasClass=' + cover.classList.contains('has-cover-image');
      }
      function recoveryLine() {
        var body = document.body;
        var shell = document.querySelector('.app-shell');
        if (!body || !shell) return 'parentRecovery=missing';
        return 'parentRecovery bodyMinH=' + (body.style.minHeight || 'na') +
          ' shellMinH=' + (shell.style.minHeight || 'na');
      }
      function galleryStateLine() {
        var gallery = document.getElementById('screen-gallery');
        if (!gallery) return 'galleryState=missing';
        return 'galleryState classes=' + (gallery.className || '');
      }
      function loadingLine() {
        var el = document.querySelector('.loading-indicator');
        if (!el) return 'loadingIndicator=missing';
        var cs = getComputedStyle(el);
        return 'loadingIndicator disp=' + cs.display + ' vis=' + cs.visibility + ' classes=' + (el.className || '');
      }
      function imageSourceLine() {
        var coverImg = document.querySelector('#cover-photo .photo-card-cover img');
        var gridImg = document.querySelector('#gallery .photo-card:not(.photo-card-cover) img');
        var slideImg = document.querySelector('#slide-image');
        var slideImgFull = document.querySelector('#slide-image-full');
        var coverSrc = coverImg ? (coverImg.currentSrc || coverImg.src || '') : '';
        var gridSrc = gridImg ? (gridImg.currentSrc || gridImg.src || '') : '';
        var slideSrc = slideImg ? (slideImg.currentSrc || slideImg.src || '') : '';
        var slideFullSrc = slideImgFull ? (slideImgFull.currentSrc || slideImgFull.src || '') : '';
        return 'imgSrc cover=' + (coverSrc || 'na') +
          ' grid=' + (gridSrc || 'na') +
          ' slide=' + (slideSrc || 'na') +
          ' slideFull=' + (slideFullSrc || 'na');
      }
      function slideshowDebugLine() {
        var state = window.__mobileSlideshowDebug;
        var slideshow = document.getElementById('slideshow');
        var mode = slideshow && slideshow.classList.contains('slideshow-album-presentation') ? 'presentation' : 'standard';
        if (!state || !Array.isArray(state.logs) || !state.logs.length) {
          return 'slideshowDebug=none mode=' + mode;
        }
        return 'slideshowDebug mode=' + mode + ' ' + state.logs.slice(0, 4).join(' || ');
      }
      function classLine(sel) {
        var el = null;
        try { el = document.querySelector(sel); } catch (_) { el = null; }
        if (!el) return sel + '.class=missing';
        return sel + '.class=' + (el.className || '');
      }
      function imageDetailLine(sel) {
        var img = null;
        try { img = document.querySelector(sel); } catch (_) { img = null; }
        if (!img) return sel + '.img=missing';
        var cs = getComputedStyle(img);
        var rect = img.getBoundingClientRect();
        return sel + '.img complete=' + !!img.complete +
          ' natural=' + (img.naturalWidth || 0) + 'x' + (img.naturalHeight || 0) +
          ' rect=' + r(rect.width) + 'x' + r(rect.height) +
          ' disp=' + cs.display +
          ' vis=' + cs.visibility +
          ' opacity=' + cs.opacity +
          ' src=' + (img.currentSrc || img.src || 'na');
      }
      function styleLine(sel) {
        var el = null;
        try { el = document.querySelector(sel); } catch (_) { el = null; }
        if (!el) return sel + '.style=missing';
        var cs = getComputedStyle(el);
        return sel + '.style z=' + cs.zIndex +
          ' opacity=' + cs.opacity +
          ' vis=' + cs.visibility +
          ' transform=' + cs.transform +
          ' pointer=' + cs.pointerEvents;
      }
      function hitTestLine() {
        var x = Math.round((window.innerWidth || 0) / 2);
        var y = Math.round((window.innerHeight || 0) / 2);
        var list = [];
        try {
          list = (document.elementsFromPoint ? document.elementsFromPoint(x, y) : [document.elementFromPoint(x, y)])
            .filter(Boolean)
            .slice(0, 8)
            .map(function(el) {
              return (el.id ? '#' + el.id : el.tagName.toLowerCase()) +
                (el.className && typeof el.className === 'string' ? '.' + el.className.trim().replace(/\s+/g, '.') : '');
            });
        } catch (_) {}
        return 'hitTest center=' + x + ',' + y + ' stack=' + (list.length ? list.join(' > ') : 'na');
      }
      function openerLine() {
        var cards = document.querySelectorAll('#gallery .photo-card:not(.photo-card-cover)');
        return 'openers openSlideshow=' + (typeof window.openSlideshow) +
          ' mobileForce=' + (typeof window.__mobileForceSlideshowPaint) +
          ' firstCards=' + cards.length;
      }
      function downloadLine() {
        var button = document.getElementById('download-slide') ||
          document.querySelector('.slideshow-action-download, [data-action="download"]');
        var rect = button ? button.getBoundingClientRect() : { left: 0, top: 0, width: 0, height: 0 };
        return 'download bridge=' + (typeof window.AndroidDownloader) +
          ' bound=' + !!window.__mobileDownloadBridgeBound +
          ' version=' + (window.__mobileDownloadBridgeVersion || 'na') +
          ' wrapped=' + !!window.__mobileDownloadOriginal +
          ' manual=' + (typeof window.__mobileDownloadNow) +
          ' last=' + (window.__mobileDownloadLast || 'na') +
          ' button=' + (button ? ((button.id ? '#' + button.id : button.tagName.toLowerCase()) + ' disp=' + getComputedStyle(button).display + ' rect=' + r(rect.left) + ',' + r(rect.top) + ',' + r(rect.width) + 'x' + r(rect.height)) : 'missing');
      }
      function settingsLine() {
        var gallery = document.getElementById('screen-gallery');
        var side = document.querySelector('#screen-gallery .workspace-side') ||
          document.querySelector('body > .workspace-side[data-mobile-settings-promoted="true"]');
        var panel = side ? side.querySelector('.side-panel') : null;
        if (!gallery || !side) return 'settings=missing';
        var cs = getComputedStyle(side);
        var rect = side.getBoundingClientRect();
        var panelRect = panel ? panel.getBoundingClientRect() : { width: 0, height: 0 };
        return 'settings panelOpen=' + gallery.classList.contains('panel-open') +
          ' sideRect=' + r(rect.width) + 'x' + r(rect.height) +
          ' sideDisp=' + cs.display +
          ' sidePos=' + cs.position +
          ' sideZ=' + cs.zIndex +
          ' sideParent=' + (side.parentNode === document.body ? 'body' : '#screen-gallery') +
          ' promoted=' + (side.dataset && side.dataset.mobileSettingsPromoted === 'true') +
          ' panelRect=' + r(panelRect.width) + 'x' + r(panelRect.height);
      }
      function facePopupLine() {
        var popup = document.getElementById('face-picker-popup');
        if (!popup) return 'facePopup=missing';
        var dialog = popup.querySelector('.face-picker-popup');
        var cs = getComputedStyle(popup);
        var rect = popup.getBoundingClientRect();
        var dialogRect = dialog ? dialog.getBoundingClientRect() : { width: 0, height: 0, top: 0 };
        return 'facePopup rect=' + r(rect.width) + 'x' + r(rect.height) +
          ' top=' + r(rect.top) +
          ' disp=' + cs.display +
          ' pos=' + cs.position +
          ' z=' + cs.zIndex +
          ' dialog=' + r(dialogRect.width) + 'x' + r(dialogRect.height) + '@' + r(dialogRect.top);
      }
      var state = window.__mobileUiDebugState || (window.__mobileUiDebugState = { logs: [] });
      var now = new Date().toISOString().slice(11, 23);
      state.logs.unshift(now + ' [' + phase + '] ' + note);
      state.logs = state.logs.slice(0, 60);

      var panel = document.getElementById('mobile-ui-debug-panel');
      if (!panel) {
        panel = document.createElement('div');
        panel.id = 'mobile-ui-debug-panel';
        panel.style.position = 'fixed';
        panel.style.left = '8px';
        panel.style.right = '8px';
        panel.style.bottom = '8px';
        panel.style.height = '42vh';
        panel.style.maxHeight = '520px';
        panel.style.minHeight = '280px';
        panel.style.zIndex = '2147483647';
        panel.style.background = 'rgba(10, 12, 14, 0.93)';
        panel.style.color = '#d2ffd2';
        panel.style.border = '1px solid rgba(150, 255, 150, 0.28)';
        panel.style.borderRadius = '10px';
        panel.style.overflow = 'hidden';
        panel.style.pointerEvents = 'auto';

        var title = document.createElement('div');
        title.style.position = 'relative';
        title.textContent = 'Mobile UI Debug';
        title.style.padding = '8px 10px';
        title.style.font = '600 11px/1.2 ui-monospace, SFMono-Regular, Menlo, monospace';
        title.style.letterSpacing = '0.08em';
        title.style.textTransform = 'uppercase';
        title.style.borderBottom = '1px solid rgba(150, 255, 150, 0.22)';

        var copyBtn = document.createElement('button');
        copyBtn.type = 'button';
        copyBtn.id = 'mobile-ui-debug-copy';
        copyBtn.textContent = 'Copy';
        copyBtn.style.position = 'absolute';
        copyBtn.style.top = '5px';
        copyBtn.style.right = '8px';
        copyBtn.style.padding = '3px 8px';
        copyBtn.style.border = '1px solid rgba(150, 255, 150, 0.4)';
        copyBtn.style.borderRadius = '6px';
        copyBtn.style.background = 'rgba(20, 28, 24, 0.9)';
        copyBtn.style.color = '#d2ffd2';
        copyBtn.style.font = '600 10px/1 ui-monospace, SFMono-Regular, Menlo, monospace';
        copyBtn.style.letterSpacing = '0.06em';
        copyBtn.style.cursor = 'pointer';
        copyBtn.style.pointerEvents = 'auto';
        copyBtn.addEventListener('click', function() {
          var preNode = document.getElementById('mobile-ui-debug-pre');
          var text = preNode ? preNode.textContent || '' : '';
          if (!text) return;
          var done = function() {
            copyBtn.textContent = 'Copied';
            window.setTimeout(function() { copyBtn.textContent = 'Copy'; }, 1100);
          };
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(done).catch(function() {});
          } else {
            var ta = document.createElement('textarea');
            ta.value = text;
            ta.style.position = 'fixed';
            ta.style.opacity = '0';
            ta.style.pointerEvents = 'none';
            document.body.appendChild(ta);
            ta.focus();
            ta.select();
            try {
              document.execCommand('copy');
              done();
            } catch (_) {}
            ta.remove();
          }
        });

        var openBtn = document.createElement('button');
        openBtn.type = 'button';
        openBtn.id = 'mobile-ui-debug-open-slide';
        openBtn.textContent = 'Open Slide';
        openBtn.style.position = 'absolute';
        openBtn.style.top = '5px';
        openBtn.style.right = '118px';
        openBtn.style.padding = '3px 8px';
        openBtn.style.border = '1px solid rgba(150, 255, 150, 0.4)';
        openBtn.style.borderRadius = '6px';
        openBtn.style.background = 'rgba(20, 28, 24, 0.9)';
        openBtn.style.color = '#d2ffd2';
        openBtn.style.font = '600 10px/1 ui-monospace, SFMono-Regular, Menlo, monospace';
        openBtn.style.letterSpacing = '0.03em';
        openBtn.style.cursor = 'pointer';
        openBtn.style.pointerEvents = 'auto';
        openBtn.addEventListener('click', function() {
          try {
            var s = window.__mobileUiDebugState || (window.__mobileUiDebugState = { logs: [] });
            var ts = new Date().toISOString().slice(11, 23);
            var firstCard = document.querySelector('#gallery .photo-card:not(.photo-card-cover)');
            if (typeof window.openSlideshow === 'function') {
              window.openSlideshow(0);
              s.logs.unshift(ts + ' [debug-open] window.openSlideshow(0)');
              s.logs = s.logs.slice(0, 80);
              window.setTimeout(function() {
                try {
                  if (typeof window.__mobileForceSlideshowPaint === 'function') {
                    window.__mobileForceSlideshowPaint('debug-open');
                  }
                } catch (_) {}
              }, 120);
              return;
            }
            if (firstCard && typeof firstCard.click === 'function') {
              firstCard.click();
              s.logs.unshift(ts + ' [debug-open] firstCard.click()');
              s.logs = s.logs.slice(0, 80);
              window.setTimeout(function() {
                try {
                  if (typeof window.__mobileForceSlideshowPaint === 'function') {
                    window.__mobileForceSlideshowPaint('debug-open');
                  }
                } catch (_) {}
              }, 120);
              return;
            }
            s.logs.unshift(ts + ' [debug-open] no callable opener');
            s.logs = s.logs.slice(0, 80);
          } catch (err) {
            try {
              var s2 = window.__mobileUiDebugState || (window.__mobileUiDebugState = { logs: [] });
              var ts2 = new Date().toISOString().slice(11, 23);
              s2.logs.unshift(ts2 + ' [debug-open] error=' + (err && err.message ? err.message : 'unknown'));
              s2.logs = s2.logs.slice(0, 80);
            } catch (_) {}
          }
        });

        var hideBtn = document.createElement('button');
        hideBtn.type = 'button';
        hideBtn.id = 'mobile-ui-debug-hide';
        hideBtn.textContent = 'Hide';
        hideBtn.style.position = 'absolute';
        hideBtn.style.top = '5px';
        hideBtn.style.right = '56px';
        hideBtn.style.padding = '3px 8px';
        hideBtn.style.border = '1px solid rgba(150, 255, 150, 0.4)';
        hideBtn.style.borderRadius = '6px';
        hideBtn.style.background = 'rgba(20, 28, 24, 0.9)';
        hideBtn.style.color = '#d2ffd2';
        hideBtn.style.font = '600 10px/1 ui-monospace, SFMono-Regular, Menlo, monospace';
        hideBtn.style.letterSpacing = '0.06em';
        hideBtn.style.cursor = 'pointer';
        hideBtn.style.pointerEvents = 'auto';

        var showBtn = document.getElementById('mobile-ui-debug-show');
        if (!showBtn) {
          showBtn = document.createElement('button');
          showBtn.type = 'button';
          showBtn.id = 'mobile-ui-debug-show';
          showBtn.textContent = 'Show Debug';
          showBtn.style.position = 'fixed';
          showBtn.style.right = '12px';
          showBtn.style.bottom = '12px';
          showBtn.style.zIndex = '2147483647';
          showBtn.style.padding = '6px 10px';
          showBtn.style.border = '1px solid rgba(150, 255, 150, 0.42)';
          showBtn.style.borderRadius = '8px';
          showBtn.style.background = 'rgba(10, 12, 14, 0.9)';
          showBtn.style.color = '#d2ffd2';
          showBtn.style.font = '600 11px/1 ui-monospace, SFMono-Regular, Menlo, monospace';
          showBtn.style.letterSpacing = '0.06em';
          showBtn.style.cursor = 'pointer';
          showBtn.style.pointerEvents = 'auto';
          showBtn.style.display = 'none';
          showBtn.addEventListener('click', function() {
            var p = document.getElementById('mobile-ui-debug-panel');
            if (!p) return;
            p.style.display = 'block';
            showBtn.style.display = 'none';
          });
          document.body.appendChild(showBtn);
        }

        hideBtn.addEventListener('click', function() {
          panel.style.display = 'none';
          var button = document.getElementById('mobile-ui-debug-show');
          if (button) {
            button.style.display = 'block';
          }
        });

        var pre = document.createElement('pre');
        pre.id = 'mobile-ui-debug-pre';
        pre.style.margin = '0';
        pre.style.padding = '8px 10px 10px';
        pre.style.height = 'calc(100% - 34px)';
        pre.style.overflow = 'auto';
        pre.style.whiteSpace = 'pre';
        pre.style.font = '11px/1.35 ui-monospace, SFMono-Regular, Menlo, monospace';
        title.appendChild(openBtn);
        title.appendChild(hideBtn);
        title.appendChild(copyBtn);
        panel.appendChild(title);
        panel.appendChild(pre);
        document.body.appendChild(panel);
      }

      var vv = window.visualViewport;
      var lines = [
        now + ' [' + phase + ']',
        'url=' + location.href,
        'readyState=' + document.readyState + ' visibility=' + document.visibilityState,
        'viewport inner=' + innerWidth + 'x' + innerHeight +
          ' visual=' + (vv ? r(vv.width) + 'x' + r(vv.height) : 'na') +
          ' scale=' + (vv ? vv.scale : 'na'),
        'html c/s=' + document.documentElement.clientWidth + 'x' + document.documentElement.clientHeight +
          ' / ' + document.documentElement.scrollWidth + 'x' + document.documentElement.scrollHeight,
        'body c/s=' + (document.body ? document.body.clientWidth : 'na') + 'x' + (document.body ? document.body.clientHeight : 'na') +
          ' / ' + (document.body ? document.body.scrollWidth : 'na') + 'x' + (document.body ? document.body.scrollHeight : 'na'),
        'nativeView w/h=' + ${target.width} + 'x' + ${target.height} +
          ' measured=' + ${target.measuredWidth} + 'x' + ${target.measuredHeight} +
          ' contentHeightPx=' + ${target.contentHeight} + ' scale=' + ${target.scale},
        'androidAuth appId=' + ${jsQuoted(appId)} +
          ' webClientId=' + ${jsQuoted(webClientIdMasked)} +
          ' hasBridge=' + (typeof window.AndroidStudioAuth) +
          ' webAuth=' + (window.CarnivalAndroidAuth && typeof window.CarnivalAndroidAuth.signInWithGoogleIdToken),
        metric('.app-shell'),
        metric('#screen-direct-link'),
        metric('#screen-gallery'),
        metric('#cover-photo'),
        inlineStyleLine('#cover-photo'),
        flagLine(),
        recoveryLine(),
        galleryStateLine(),
        loadingLine(),
        imageSourceLine(),
        slideshowDebugLine(),
        metric('#slideshow'),
        classLine('#slideshow'),
        styleLine('#slideshow'),
        metric('.slideshow-frame'),
        styleLine('.slideshow-frame'),
        metric('#slide-card-a'),
        classLine('#slide-card-a'),
        styleLine('#slide-card-a'),
        metric('#slide-card-b'),
        classLine('#slide-card-b'),
        styleLine('#slide-card-b'),
        imageDetailLine('#slide-image'),
        imageDetailLine('#slide-image-full'),
        metric('#slideshow-loader'),
        classLine('#slideshow-loader'),
        openerLine(),
        downloadLine(),
        settingsLine(),
        facePopupLine(),
        hitTestLine(),
        metric('.link-stage'),
        metric('.home-footer'),
        'note=' + note
      ];

      var preNode = document.getElementById('mobile-ui-debug-pre');
      if (preNode) {
        preNode.textContent = lines.join('\n') + '\n\nEvents\n' + state.logs.join('\n');
      }
    })();
  """.trimIndent()
  target.evaluateJavascript(script, null)
}

private fun buildBrowserParityUserAgent(current: String?): String {
  val fallback =
    "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36"
  val source = current.orEmpty().ifBlank { fallback }
  return source
    .replace("; wv", "", ignoreCase = true)
    .replace(" wv", "", ignoreCase = true)
    .replace("Version/4.0 ", "", ignoreCase = true)
}

private fun getMobileDeepLinkTarget(intent: Intent?): String? {
  val data = intent?.data ?: return null
  if (data.scheme != "carnivalstories" || data.host != "auth") {
    return null
  }
  if (!data.path.orEmpty().startsWith("/callback")) {
    return null
  }
  return data.getQueryParameter("returnTo")?.takeIf { it.isNotBlank() } ?: "/studio"
}

private fun handleMobileWebNavigation(
  context: Context,
  webView: WebView?,
  baseUrl: String,
  requestedUrl: String
): Boolean {
  if (requestedUrl.isBlank()) {
    return false
  }
  val uri = runCatching { Uri.parse(requestedUrl) }.getOrNull() ?: return false
  val scheme = uri.scheme.orEmpty().lowercase()
  if (scheme == "carnivalstories") {
    val target = getMobileDeepLinkTarget(Intent(Intent.ACTION_VIEW, uri)) ?: "/studio"
    // If the web app ever lands on our app callback scheme inside WebView, consume it
    // by letting Android route the deep link back to this Activity instead.
    openExternalBrowser(context, "carnivalstories://auth/callback?returnTo=${urlEncode(target)}")
    return true
  }

  if (shouldOpenOutsideMobileWebView(baseUrl, uri)) {
    val host = uri.host.orEmpty().lowercase()
    if (host.contains("accounts.google.com") || host.contains("googleusercontent.com")) {
      val message = "Use the in-app Google sign-in button. External Chrome auth cannot complete from WebView."
      webView?.let {
        injectAndroidAuthStatus(it, message, true)
        injectAndroidStudioAuthBridge(it)
      }
      Toast.makeText(context, message, Toast.LENGTH_LONG).show()
    } else {
      openExternalBrowser(context, getExternalStudioAuthUrl(baseUrl, uri))
    }
    return true
  }

  return false
}

private fun shouldOpenOutsideMobileWebView(baseUrl: String, uri: Uri): Boolean {
  val host = uri.host.orEmpty().lowercase()
  if (host.contains("accounts.google.com") || host.contains("googleusercontent.com")) {
    return true
  }

  val baseHost = runCatching { Uri.parse(baseUrl).host.orEmpty().lowercase() }.getOrDefault("")
  if (host != baseHost) {
    return false
  }

  return false
}

private fun getExternalStudioAuthUrl(baseUrl: String, uri: Uri): String {
  val host = uri.host.orEmpty().lowercase()
  if (host.contains("accounts.google.com") || host.contains("googleusercontent.com")) {
    return uri.toString()
  }

  val normalizedBase = baseUrl.trim().trimEnd('/').ifBlank {
    "https://carnivalshowcase.kaustubhmokashi.com"
  }
  val targetPath = uri.encodedPath?.takeIf { it.isNotBlank() } ?: "/studio"
  val targetQuery = uri.encodedQuery?.let { "?$it" }.orEmpty()
  val returnTo = if (targetPath == "/login") "/studio" else "$targetPath$targetQuery"
  return Uri.parse("$normalizedBase/login").buildUpon()
    .appendQueryParameter("source", "android")
    .appendQueryParameter("returnTo", returnTo)
    .build()
    .toString()
}

private fun resolveMobileWebUrl(baseUrl: String, target: String): String {
  val trimmedTarget = target.trim()
  val targetUri = runCatching { Uri.parse(trimmedTarget) }.getOrNull()
  if (targetUri?.scheme == "http" || targetUri?.scheme == "https") {
    return trimmedTarget
  }
  val normalizedBase = baseUrl.trim().trimEnd('/').ifBlank {
    "https://carnivalshowcase.kaustubhmokashi.com"
  }
  return "$normalizedBase/${trimmedTarget.trimStart('/')}"
}

private fun openExternalBrowser(context: Context, url: String) {
  val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url)).apply {
    addCategory(Intent.CATEGORY_BROWSABLE)
  }
  runCatching {
    context.startActivity(intent)
  }
}

private fun urlEncode(value: String): String =
  URLEncoder.encode(value, "UTF-8")

@Composable
private fun SplashScreen(
  widthFraction: Float
) {
  val composition by rememberLottieComposition(
    LottieCompositionSpec.RawRes(R.raw.splash_screen_animation)
  )
  val progress by animateLottieCompositionAsState(
    composition = composition,
    iterations = LottieConstants.IterateForever,
  )

  Box(
    modifier = Modifier
      .fillMaxSize()
      .background(AppBackgroundMuted),
    contentAlignment = Alignment.Center
  ) {
    LottieAnimation(
      composition = composition,
      progress = { progress },
      modifier = Modifier
        .fillMaxWidth(widthFraction)
    )
  }
}

@Composable
private fun HomeScreen(
  state: DriveDeckUiState,
  onCodeChanged: (String) -> Unit,
  onSubmitCode: () -> Unit,
  onOpenDirect: () -> Unit,
) {
  val codeFieldFocusRequester = remember { FocusRequester() }
  val continueFocusRequester = remember { FocusRequester() }
  LaunchedEffect(Unit) {
    codeFieldFocusRequester.requestFocus()
  }

  Box(
    modifier = Modifier
      .fillMaxSize()
      .background(AppBackground)
  ) {
    Column(
      modifier = Modifier
        .align(Alignment.TopStart)
        .fillMaxWidth()
        .padding(horizontal = 56.dp, vertical = 36.dp),
      horizontalAlignment = Alignment.Start
    ) {
      HomeBrandLogo(
        modifier = Modifier
          .width(280.dp)
      )
      Spacer(modifier = Modifier.height(50.dp))
      Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(56.dp),
        verticalAlignment = Alignment.Top
      ) {
        Column(
          modifier = Modifier.weight(1f),
          verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
          Text(
            text = "Enter the pairing code here.",
            color = TextSecondary,
            fontSize = 24.sp,
            lineHeight = 34.sp,
            textAlign = TextAlign.Left
          )
          OutlinedTextField(
            value = state.pairingCode,
            onValueChange = { onCodeChanged(it.filter(Char::isDigit).take(9)) },
            modifier = Modifier
              .fillMaxWidth()
              .focusRequester(codeFieldFocusRequester),
            singleLine = true,
            label = { Text("Pairing code") },
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
            textStyle = androidx.compose.ui.text.TextStyle(
              color = TextPrimary,
              fontSize = 36.sp,
              fontWeight = FontWeight.ExtraBold,
              letterSpacing = 6.sp,
              textAlign = TextAlign.Center
            ),
            shape = RoundedCornerShape(0.dp),
            colors = androidx.compose.material3.OutlinedTextFieldDefaults.colors(
              focusedBorderColor = AccentColor,
              unfocusedBorderColor = BorderStrong,
              focusedLabelColor = AccentColor,
              unfocusedLabelColor = TextSecondary,
              focusedTextColor = TextPrimary,
              unfocusedTextColor = TextPrimary,
              cursorColor = AccentColor
            )
          )
          FocusablePrimaryButton(
            onClick = onSubmitCode,
            modifier = Modifier
              .fillMaxWidth()
              .focusRequester(continueFocusRequester),
            sharpCorners = true,
          ) {
            Text("Open folder", color = Color.White, fontWeight = FontWeight.SemiBold)
          }
          if (state.lastUsedCode.isNotBlank()) {
            Text(
              text = "Last code used: ${state.lastUsedCode}",
              color = Color(0x99000000),
              fontSize = 18.sp,
              lineHeight = 26.sp,
              fontWeight = FontWeight.Normal,
            )
          }
          if (state.status.isNotBlank()) {
            Text(
              text = state.status,
              color = if (state.statusTone == StatusTone.Error) AccentColor else TextSecondary,
              fontSize = 18.sp,
              lineHeight = 26.sp,
            )
          }
        }

        if (state.pairingUrl.isNotBlank()) {
          PairingQrBlock(
            pairingUrl = state.pairingUrl,
            modifier = Modifier.weight(1f)
          )
        }
      }
    }
  }
}

@Composable
private fun PairingQrBlock(
  pairingUrl: String,
  modifier: Modifier = Modifier,
) {
  val qrBitmap = remember(pairingUrl) { generateQrBitmap(pairingUrl) }
  val qrSize = 220.dp

  Column(
    modifier = modifier,
    horizontalAlignment = Alignment.CenterHorizontally,
    verticalArrangement = Arrangement.Top
  ) {
    qrBitmap?.let {
      Image(
        bitmap = it.asImageBitmap(),
        contentDescription = "QR code for CarnivalStories TV pairing",
        modifier = Modifier.size(qrSize)
      )
    }
    Spacer(modifier = Modifier.height(20.dp))
    Text(
      text = "Scan QR to create a Pairing Code",
      modifier = Modifier.width(qrSize),
      color = TextPrimary,
      fontWeight = FontWeight.SemiBold,
      textAlign = TextAlign.Center,
      fontSize = 18.sp,
      lineHeight = 28.sp,
    )
  }
}

@Composable
private fun BrandLogo(
  modifier: Modifier = Modifier,
) {
  val context = LocalContext.current
  val imageLoader = context.imageLoader.newBuilder()
    .components {
      add(SvgDecoder.Factory())
    }
    .build()

  AsyncImage(
    model = ImageRequest.Builder(context)
      .data("android.resource://${context.packageName}/${R.raw.carnival_showcase_logo}")
      .build(),
    imageLoader = imageLoader,
    contentDescription = "CarnivalStories logo",
    modifier = modifier,
    contentScale = ContentScale.Fit,
  )
}

@Composable
private fun HomeBrandLogo(
  modifier: Modifier = Modifier,
) {
  val context = LocalContext.current
  val imageLoader = context.imageLoader.newBuilder()
    .components {
      add(SvgDecoder.Factory())
    }
    .build()

  AsyncImage(
    model = ImageRequest.Builder(context)
      .data("android.resource://${context.packageName}/${R.raw.carnival_stories_logo}")
      .build(),
    imageLoader = imageLoader,
    contentDescription = "CarnivalStories logo",
    modifier = modifier,
    contentScale = ContentScale.Fit,
  )
}

@Composable
private fun DirectLinkScreen(
  state: DriveDeckUiState,
  onLinkChanged: (String) -> Unit,
  onSubmit: () -> Unit,
  onBack: () -> Unit,
) {
  CenterStage(
    title = "Type Google Drive Link",
    subtitle = "Paste a public Google Drive folder link here if you'd rather type it manually.",
    status = state.status,
    statusTone = state.statusTone,
    isLoading = state.isLoading,
  ) {
    val linkFieldFocusRequester = remember { FocusRequester() }

    LaunchedEffect(Unit) {
      linkFieldFocusRequester.requestFocus()
    }

    OutlinedTextField(
      value = state.directLink,
      onValueChange = onLinkChanged,
      modifier = Modifier
        .fillMaxWidth()
        .focusRequester(linkFieldFocusRequester),
      label = { Text("Google Drive folder link") },
      colors = androidx.compose.material3.OutlinedTextFieldDefaults.colors(
        focusedBorderColor = AccentColor,
        unfocusedBorderColor = BorderStrong,
        focusedLabelColor = AccentColor,
        unfocusedLabelColor = TextSecondary,
        focusedTextColor = TextPrimary,
        unfocusedTextColor = TextPrimary,
        cursorColor = AccentColor
      )
    )
    Spacer(modifier = Modifier.height(18.dp))
    FocusablePrimaryButton(
      onClick = onSubmit,
      modifier = Modifier.fillMaxWidth(),
    ) {
      Text("Open folder", color = Color.White)
    }
    FocusableTextAction(onClick = onBack, modifier = Modifier.align(Alignment.CenterHorizontally)) {
      Text("Got Pairing code? Enter")
    }
    FocusableTextAction(onClick = onBack, modifier = Modifier.align(Alignment.CenterHorizontally)) {
      Text("Back")
    }
  }
}

@Composable
private fun FolderGridScreen(
  state: DriveDeckUiState,
  onBack: () -> Unit,
  onOpenFolder: (FolderSummary) -> Unit,
  onOpenPresentation: () -> Unit,
) {
  val firstFolderFocusRequester = remember { FocusRequester() }

  LaunchedEffect(state.folders) {
    if (state.folders.isNotEmpty()) {
      firstFolderFocusRequester.requestFocus()
    }
  }

  ContentScaffold(
    title = "Choose a folder",
    subtitle = state.status.ifBlank { "Pick a folder to browse." },
    onBack = onBack,
    topAction = {
      FocusableIconAction(onClick = onOpenPresentation) {
        Icon(
          painter = painterResource(id = R.drawable.ic_present),
          contentDescription = "Open presentation",
          tint = TextPrimary
        )
      }
    }
  ) { padding ->
    LazyVerticalGrid(
      columns = GridCells.Adaptive(240.dp),
      modifier = Modifier
        .fillMaxSize()
        .padding(padding),
      horizontalArrangement = Arrangement.spacedBy(18.dp),
      verticalArrangement = Arrangement.spacedBy(18.dp),
      contentPadding = PaddingValues(24.dp)
    ) {
      itemsIndexed(state.folders, key = { index, item -> item.id }) { index, folder ->
        TvCard(
          modifier = if (index == 0) Modifier.focusRequester(firstFolderFocusRequester) else Modifier,
          title = folder.name,
          subtitle = "${folder.images.size} photos",
          supporting = folder.path,
          onClick = { onOpenFolder(folder) }
        )
      }
    }
  }
}

@Composable
private fun GalleryScreen(
  state: DriveDeckUiState,
  onBack: () -> Unit,
  onOpenSlideshow: (Int) -> Unit,
  onOpenPresentation: () -> Unit,
  onToggleSettings: () -> Unit,
  onDecreaseDuration: () -> Unit,
  onIncreaseDuration: () -> Unit,
  onToggleLoop: () -> Unit,
  onToggleAutoplay: () -> Unit,
  onTogglePlayVideos: () -> Unit,
  onStartSlideshow: () -> Unit,
) {
  val gridState = rememberLazyGridState()
  val photoFocusRequesters = remember(state.images) {
    List(state.images.size) { FocusRequester() }
  }

  LaunchedEffect(state.images, state.gallerySettingsVisible, state.currentSlideIndex) {
    if (state.images.isNotEmpty() && !state.gallerySettingsVisible) {
      val targetIndex = state.currentSlideIndex.coerceIn(0, state.images.lastIndex)
      gridState.scrollToItem(targetIndex)
      photoFocusRequesters.getOrNull(targetIndex)?.requestFocus()
    }
  }

  ContentScaffold(
    title = state.selectedFolder?.name ?: "Photo grid",
    subtitle = "${state.images.size} photos ready to browse.",
    onBack = onBack,
    topAction = {
      Row(horizontalArrangement = Arrangement.spacedBy(10.dp), verticalAlignment = Alignment.CenterVertically) {
        FocusableIconAction(onClick = onOpenPresentation) {
          Icon(
            painter = painterResource(id = R.drawable.ic_present),
            contentDescription = "Open presentation",
            tint = TextPrimary
          )
        }
        FocusableIconAction(onClick = onToggleSettings) {
          Icon(Icons.Default.Settings, contentDescription = "Open settings", tint = TextPrimary)
        }
      }
    }
  ) { padding ->
    Row(
      modifier = Modifier
        .fillMaxSize()
        .padding(padding)
    ) {
      LazyVerticalGrid(
        columns = GridCells.Adaptive(180.dp),
        modifier = Modifier.weight(1f),
        state = gridState,
        horizontalArrangement = Arrangement.spacedBy(18.dp),
        verticalArrangement = Arrangement.spacedBy(18.dp),
        contentPadding = PaddingValues(24.dp)
      ) {
        itemsIndexed(state.images, key = { _, item -> item.id }) { index, image ->
          PhotoCard(
            modifier = Modifier.focusRequester(photoFocusRequesters[index]),
            image = image,
            onClick = { onOpenSlideshow(index) }
          )
        }
      }

      if (state.gallerySettingsVisible) {
        SettingsPanel(
          duration = state.durationSeconds,
          loop = state.loopEnabled,
          autoplay = state.autoplayEnabled,
          playVideosInSlideshow = state.playVideosInSlideshow,
          onDecreaseDuration = onDecreaseDuration,
          onIncreaseDuration = onIncreaseDuration,
          onToggleLoop = onToggleLoop,
          onToggleAutoplay = onToggleAutoplay,
          onTogglePlayVideosInSlideshow = onTogglePlayVideos,
          onPrimary = onStartSlideshow,
          primaryLabel = "Start slideshow",
        )
      }
    }
  }
}

@Composable
private fun SlideshowScreen(
  state: DriveDeckUiState,
  onBack: () -> Unit,
  onPrevious: () -> Unit,
  onNext: () -> Unit,
  onTogglePlay: () -> Unit,
  onShowChrome: () -> Unit,
  onHideChrome: () -> Unit,
  onPlayVideoInline: () -> Unit,
  onOpenVideoPlayer: () -> Unit,
) {
  val current = state.currentSlide ?: return
  val isPresentationMode = state.isEventPresentationMode || state.isAlbumPresentationMode
  val context = LocalContext.current
  val imageLoader = context.imageLoader
  var interactionVersion by remember { mutableStateOf(0) }
  var slideReady by remember(current.id, current.slideshowUrl, current.isVideo) {
    mutableStateOf(current.isVideo)
  }
  val latestAutoplayEnabled by rememberUpdatedState(state.autoplayEnabled)
  val latestOnNext by rememberUpdatedState(onNext)
  val inlineVideoAllowed = current.isVideo && state.playVideosInSlideshow
  var inlineVideoError by remember(current.id, current.fullUrl, inlineVideoAllowed) { mutableStateOf<String?>(null) }
  val shouldPromptForVideoPlayer = current.isVideo &&
    !state.playVideosInSlideshow &&
    !isPresentationMode &&
    state.videoPlayerPromptDismissedId != current.id
  val inlinePlayer = remember(current.id, current.fullUrl, inlineVideoAllowed) {
    if (inlineVideoAllowed) {
      ExoPlayer.Builder(context).build().apply {
        setMediaItem(
          MediaItem.Builder()
            .setUri(current.fullUrl)
            .setMimeType(current.mimeType)
            .build()
        )
        repeatMode = Player.REPEAT_MODE_OFF
        prepare()
      }
    } else {
      null
    }
  }

  fun registerInteraction(showChrome: Boolean = true) {
    if (isPresentationMode) {
      return
    }
    if (showChrome) {
      onShowChrome()
    }
    interactionVersion += 1
  }

  DisposableEffect(inlinePlayer) {
    if (inlinePlayer == null) {
      onDispose { }
    } else {
      val listener = object : Player.Listener {
        override fun onPlaybackStateChanged(playbackState: Int) {
          if (playbackState == Player.STATE_READY) {
            inlineVideoError = null
          }
          if (
            playbackState == Player.STATE_ENDED &&
            latestAutoplayEnabled
          ) {
            latestOnNext()
          }
        }

        override fun onPlayerError(error: androidx.media3.common.PlaybackException) {
          inlineVideoError = friendlyVideoPlaybackError(error, current.mimeType)
        }
      }
      inlinePlayer.addListener(listener)
      onDispose {
        inlinePlayer.removeListener(listener)
        inlinePlayer.release()
      }
    }
  }

  LaunchedEffect(shouldPromptForVideoPlayer) {
    if (shouldPromptForVideoPlayer) {
      onShowChrome()
    }
  }

  LaunchedEffect(state.autoplayEnabled, inlinePlayer) {
    inlinePlayer?.playWhenReady = state.autoplayEnabled
  }

  LaunchedEffect(
    state.autoplayEnabled,
    state.currentSlideIndex,
    state.durationSeconds,
    state.images.size,
    state.loopEnabled,
    inlineVideoAllowed,
    slideReady,
  ) {
    if (!state.autoplayEnabled || state.images.size <= 1 || (current.isVideo && inlineVideoAllowed)) {
      return@LaunchedEffect
    }

    if (!current.isVideo && !slideReady) {
      return@LaunchedEffect
    }

    delay(state.durationSeconds * 1000L)

    val isLastSlide = state.currentSlideIndex >= state.images.lastIndex
    if (isLastSlide && !state.loopEnabled) {
      onTogglePlay()
      return@LaunchedEffect
    }

    onNext()
  }

  LaunchedEffect(state.currentSlideIndex, state.images) {
    val neighborIndexes = ((state.currentSlideIndex - 2)..(state.currentSlideIndex + 2))
      .filter { it in state.images.indices && it != state.currentSlideIndex }

    neighborIndexes.forEach { index ->
      val asset = state.images[index]
      if (asset.isVideo) {
        return@forEach
      }

      imageLoader.enqueue(
        ImageRequest.Builder(context)
          .data(asset.slideshowUrl)
          .memoryCacheKey("${asset.id}-slideshow")
          .diskCacheKey(asset.slideshowUrl)
          .build()
      )
    }
  }

  LaunchedEffect(state.slideshowChromeVisible, interactionVersion) {
    if (!state.slideshowChromeVisible || isPresentationMode) {
      return@LaunchedEffect
    }

    delay(2000)
    onHideChrome()
  }

  Box(
    modifier = Modifier
      .fillMaxSize()
      .background(Color.Black)
      .focusable()
      .onPreviewKeyEvent { event ->
        if (event.type != KeyEventType.KeyDown) {
          return@onPreviewKeyEvent false
        }

        if (shouldPromptForVideoPlayer) {
          return@onPreviewKeyEvent when (event.key) {
            Key.Escape, Key.Back -> {
              onBack()
              true
            }
            else -> false
          }
        }

        if (isPresentationMode) {
          return@onPreviewKeyEvent when (event.key) {
            Key.Escape, Key.Back -> {
              onBack()
              true
            }
            else -> false
          }
        }

        when (event.key) {
          Key.Escape,
          Key.Back -> {
            onBack()
            true
          }
          Key.DirectionLeft -> {
            registerInteraction()
            onPrevious()
            true
          }
          Key.DirectionRight -> {
            registerInteraction()
            onNext()
            true
          }
          Key.DirectionCenter,
          Key.Enter -> {
            if (current.isVideo && !state.playVideosInSlideshow) {
              registerInteraction(showChrome = true)
              onOpenVideoPlayer()
              return@onPreviewKeyEvent true
            }
            registerInteraction(showChrome = !state.slideshowChromeVisible || state.autoplayEnabled)
            onTogglePlay()
            true
          }
          else -> false
        }
      }
      .clickable {
        if (isPresentationMode) {
          return@clickable
        }
        registerInteraction()
        onTogglePlay()
      }
  ) {
    if (isPresentationMode) {
      EventPresentationSurface(
        state = state,
        slide = current,
        slideReady = slideReady,
        onSlideReady = { ready -> slideReady = ready }
      )
    } else {
      Crossfade(
        targetState = current,
        animationSpec = tween(durationMillis = 220),
        label = "slideshow-media-fade"
      ) { slide ->
        androidx.compose.runtime.key(slide.id, slide.slideshowUrl) {
          if (slide.isVideo && inlineVideoAllowed && inlinePlayer != null) {
            Box(modifier = Modifier.fillMaxSize()) {
              AndroidView(
                factory = { context ->
                  PlayerView(context).apply {
                    useController = false
                    resizeMode = AspectRatioFrameLayout.RESIZE_MODE_FIT
                    player = inlinePlayer
                  }
                },
                update = { playerView ->
                  playerView.player = inlinePlayer
                },
                modifier = Modifier.fillMaxSize()
              )
              inlineVideoError?.let { message ->
                Box(
                  modifier = Modifier
                    .align(Alignment.BottomEnd)
                    .padding(22.dp)
                    .width(420.dp)
                ) {
                  StatusBanner(
                    status = message,
                    tone = StatusTone.Error,
                    isLoading = false
                  )
                }
              }
            }
          } else {
            Box(modifier = Modifier.fillMaxSize()) {
              AsyncImage(
                model = slide.thumbnailUrl,
                contentDescription = null,
                contentScale = ContentScale.Fit,
                modifier = Modifier.fillMaxSize()
              )
              SubcomposeAsyncImage(
                model = slide.slideshowUrl,
                contentDescription = slide.name,
                contentScale = ContentScale.Fit,
                modifier = Modifier.fillMaxSize()
              ) {
                val imageState = painter.state
                LaunchedEffect(slide.id, imageState) {
                  slideReady = imageState is AsyncImagePainter.State.Success || imageState is AsyncImagePainter.State.Error
                }

                if (imageState is AsyncImagePainter.State.Success) {
                  SubcomposeAsyncImageContent()
                } else {
                  Box(modifier = Modifier.fillMaxSize()) {
                    CircularProgressIndicator(
                      modifier = Modifier
                        .align(Alignment.BottomEnd)
                        .padding(18.dp)
                        .size(20.dp),
                      color = Color.White,
                      strokeWidth = 2.dp
                    )
                  }
                }
              }
              if (slide.isVideo) {
                Box(
                  modifier = Modifier
                    .align(Alignment.Center)
                    .size(64.dp)
                    .clip(RoundedCornerShape(32.dp))
                    .background(Color(0xB0000000)),
                  contentAlignment = Alignment.Center
                ) {
                  Icon(
                    Icons.Default.PlayArrow,
                    contentDescription = "Video",
                    tint = Color.White,
                    modifier = Modifier.size(34.dp)
                  )
                }
              }
            }
          }
        }
      }
    }

    if (state.slideshowChromeVisible && !isPresentationMode) {
      Column(
        modifier = Modifier
          .fillMaxSize()
          .padding(28.dp)
      ) {
        if (!state.autoplayEnabled) {
          BrandLogo(
            modifier = Modifier
              .size(40.dp)
              .align(Alignment.Start)
          )
        }

        Spacer(modifier = Modifier.weight(1f))

        Row(
          horizontalArrangement = Arrangement.spacedBy(12.dp),
          verticalAlignment = Alignment.CenterVertically
        ) {
          RoundActionButton(onClick = {
            registerInteraction()
            onPrevious()
          }) {
            Icon(Icons.Default.ChevronLeft, contentDescription = "Previous", tint = Color.White)
          }
          RoundActionButton(
            onClick = {
              registerInteraction()
              onTogglePlay()
            },
            emphasized = true,
          ) {
            Icon(
              if (state.autoplayEnabled) Icons.Default.Pause else Icons.Default.PlayArrow,
              contentDescription = "Play or pause",
              tint = Color.White
            )
          }
          RoundActionButton(onClick = {
            registerInteraction()
            onNext()
          }) {
            Icon(Icons.Default.ChevronRight, contentDescription = "Next", tint = Color.White)
          }
        }

        if (shouldPromptForVideoPlayer) {
          Spacer(modifier = Modifier.height(18.dp))
          VideoPromptCard(
            onPlayInline = onPlayVideoInline,
            onOpenVideoPlayer = onOpenVideoPlayer,
            modifier = Modifier.align(Alignment.End)
          )
        }
      }
    }
  }
}

@Composable
private fun VideoPromptCard(
  onPlayInline: () -> Unit,
  onOpenVideoPlayer: () -> Unit,
  modifier: Modifier = Modifier,
) {
  val promptFocusRequester = remember { FocusRequester() }
  var selectedYes by remember { mutableStateOf(true) }

  LaunchedEffect(Unit) {
    delay(150)
    promptFocusRequester.requestFocus()
  }

  Column(
    modifier = modifier
      .width(360.dp)
      .focusRequester(promptFocusRequester)
      .focusable()
      .onPreviewKeyEvent { event ->
        if (event.type != KeyEventType.KeyDown) {
          return@onPreviewKeyEvent false
        }

        when (event.key) {
          Key.DirectionLeft -> {
            selectedYes = false
            true
          }
          Key.DirectionRight -> {
            selectedYes = true
            true
          }
          Key.DirectionCenter,
          Key.Enter -> {
            if (selectedYes) onOpenVideoPlayer() else onPlayInline()
            true
          }
          else -> false
        }
      }
      .clip(RoundedCornerShape(18.dp))
      .background(Color(0xF6FFFFFF))
      .border(BorderStroke(1.dp, Color(0x14000000)), RoundedCornerShape(18.dp))
      .padding(18.dp),
    verticalArrangement = Arrangement.spacedBy(14.dp)
  ) {
    Text(
      text = "Open this video in the full player?",
      color = TextPrimary,
      fontWeight = FontWeight.SemiBold
    )
    Text(
      text = "Choose yes for full controls, or no to keep playing it inside the slideshow.",
      color = Color(0xFF5F5F5F)
    )
    Row(
      modifier = Modifier.fillMaxWidth(),
      horizontalArrangement = Arrangement.spacedBy(10.dp)
    ) {
      PromptChoiceButton(
        modifier = Modifier.weight(1f).height(52.dp),
        selected = !selectedYes,
        onClick = {
          selectedYes = false
          onPlayInline()
        }
      ) {
        Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
          Text("No", color = TextPrimary)
        }
      }
      PromptChoiceButton(
        modifier = Modifier.weight(1f).height(52.dp),
        selected = selectedYes,
        emphasized = true,
        onClick = {
          selectedYes = true
          onOpenVideoPlayer()
        }
      ) {
        Text("Yes", color = Color.White)
      }
    }
  }
}

@Composable
private fun PromptChoiceButton(
  modifier: Modifier = Modifier,
  selected: Boolean,
  emphasized: Boolean = false,
  onClick: () -> Unit,
  content: @Composable () -> Unit,
) {
  Card(
    modifier = modifier.clickable(onClick = onClick),
    colors = CardDefaults.cardColors(
      containerColor = if (selected && emphasized) AccentColor else SurfaceBackground
    ),
    border = BorderStroke(
      width = if (selected) 2.dp else 1.dp,
      color = if (selected) AccentColor else BorderSoft
    ),
    shape = RoundedCornerShape(16.dp)
  ) {
    Box(
      modifier = Modifier.fillMaxSize(),
      contentAlignment = Alignment.Center
    ) {
      content()
    }
  }
}

@OptIn(ExperimentalAnimationApi::class)
@Composable
private fun EventPresentationSurface(
  state: DriveDeckUiState,
  slide: PhotoAsset,
  slideReady: Boolean,
  onSlideReady: (Boolean) -> Unit,
) {
  val backgroundUrl = state.presentationBackgroundUrl.trim()
  val overlayColor = if (state.isAlbumPresentationMode) {
    val parsedOverlay = parseHexColorOrNull(state.albumPresentationOverlayColor)
    (parsedOverlay ?: if (state.isTemporaryAlbumPresentationMode) Color.White else AppBackground).copy(alpha = 0.8f)
  } else {
    Color(0x66000000)
  }
  var displayedSlide by remember { mutableStateOf(slide) }
  var stagedSlide by remember { mutableStateOf(slide) }
  var stagedReady by remember { mutableStateOf(true) }
  var transitionStep by remember { mutableIntStateOf(0) }
  var displayedAspectRatio by remember(displayedSlide.id) { mutableStateOf(16f / 9f) }

  LaunchedEffect(slide.id, slide.slideshowUrl) {
    stagedSlide = slide
    if (slide.id == displayedSlide.id) {
      stagedReady = true
      return@LaunchedEffect
    }
    stagedReady = false
  }

  LaunchedEffect(stagedReady, stagedSlide.id) {
    if (stagedReady && stagedSlide.id != displayedSlide.id) {
      displayedSlide = stagedSlide
      transitionStep += 1
    }
  }

  Box(modifier = Modifier.fillMaxSize()) {
    if (backgroundUrl.isNotBlank()) {
      AsyncImage(
        model = backgroundUrl,
        contentDescription = null,
        contentScale = ContentScale.Crop,
        modifier = Modifier.fillMaxSize()
      )
      Box(
        modifier = Modifier
          .fillMaxSize()
          .background(overlayColor)
      )
    } else {
      Box(
        modifier = Modifier
          .fillMaxSize()
          .background(Color.Black)
      )
    }

    val transition = remember(transitionStep) { eventCardTransitionDirection(transitionStep) }
    val rotation = remember(displayedSlide.id) { eventCardRotation(displayedSlide.id) }

    // Preload the next slide off-screen; once ready we switch cards and animate.
    Box(
      modifier = Modifier
        .size(1.dp)
        .padding(0.dp)
    ) {
      SubcomposeAsyncImage(
        model = stagedSlide.slideshowUrl.ifBlank { stagedSlide.fullUrl },
        contentDescription = null,
        contentScale = ContentScale.Fit,
        modifier = Modifier.fillMaxSize()
      ) {
        val preloadState = painter.state
        LaunchedEffect(stagedSlide.id, preloadState) {
          if (preloadState is AsyncImagePainter.State.Success || preloadState is AsyncImagePainter.State.Error) {
            stagedReady = true
          }
        }
      }
    }

    AnimatedContent(
      targetState = displayedSlide,
      label = "event-card-slide",
      transitionSpec = {
        val enter = slideInHorizontally(
          animationSpec = tween(740),
          initialOffsetX = { fullWidth -> transition.inX(fullWidth) }
        ) + slideInVertically(
          animationSpec = tween(740),
          initialOffsetY = { fullHeight -> transition.inY(fullHeight) }
        ) + fadeIn(
          animationSpec = tween(280)
        )
        // Keep exit visually clean so old cards don't peek from under the new card.
        val exit = fadeOut(animationSpec = tween(180))
        enter togetherWith exit using SizeTransform(clip = false)
      }
    ) { targetSlide ->
      BoxWithConstraints(
        modifier = Modifier.fillMaxSize(),
        contentAlignment = Alignment.Center
      ) {
        val borderWidth = 10.dp
        val outerRadius = 16.dp
        val innerRadius = (outerRadius - borderWidth).coerceAtLeast(0.dp)
        val maxCardWidth = maxWidth * 0.8f
        val maxCardHeight = maxHeight * 0.8f

        var cardWidth = maxCardWidth
        var cardHeight = cardWidth / displayedAspectRatio
        if (cardHeight > maxCardHeight) {
          cardHeight = maxCardHeight
          cardWidth = cardHeight * displayedAspectRatio
        }

        Box(
          modifier = Modifier
            .width(cardWidth)
            .height(cardHeight)
            .graphicsLayer { rotationZ = rotation }
        ) {
          Box(
            modifier = Modifier
              .fillMaxSize()
              .clip(RoundedCornerShape(outerRadius))
              .background(Color.White)
              .padding(borderWidth)
          ) {
            SubcomposeAsyncImage(
              model = targetSlide.slideshowUrl.ifBlank { targetSlide.fullUrl },
              contentDescription = targetSlide.name,
              contentScale = ContentScale.Crop,
              modifier = Modifier
                .fillMaxSize()
                .clip(RoundedCornerShape(innerRadius))
            ) {
              val imageState = painter.state
              LaunchedEffect(targetSlide.id, imageState) {
                onSlideReady(imageState is AsyncImagePainter.State.Success || imageState is AsyncImagePainter.State.Error)
                if (imageState is AsyncImagePainter.State.Success) {
                  val intrinsic = painter.intrinsicSize
                  val w = intrinsic.width
                  val h = intrinsic.height
                  if (w > 0f && h > 0f) {
                    displayedAspectRatio = (w / h).coerceIn(0.3f, 3.5f)
                  }
                }
              }
              if (imageState is AsyncImagePainter.State.Success) {
                SubcomposeAsyncImageContent()
              } else {
                Box(modifier = Modifier.fillMaxSize()) {
                  CircularProgressIndicator(
                    modifier = Modifier
                      .align(Alignment.BottomEnd)
                      .padding(18.dp)
                      .size(20.dp),
                    color = Color.White,
                    strokeWidth = 2.dp
                  )
                }
              }
            }
          }
        }
      }
    }

    if (!slideReady || !stagedReady) {
      CircularProgressIndicator(
        modifier = Modifier
          .align(Alignment.BottomEnd)
          .padding(18.dp)
          .size(20.dp),
        color = Color.White,
        strokeWidth = 2.dp
      )
    }
  }
}

private data class EventTransitionDirection(
  val inX: (Int) -> Int,
  val inY: (Int) -> Int,
  val outX: (Int) -> Int,
  val outY: (Int) -> Int,
)

private fun eventCardTransitionDirection(step: Int): EventTransitionDirection {
  return when (step.absoluteValue % 4) {
    0 -> EventTransitionDirection(
      inX = { -it },
      inY = { -it / 2 },
      outX = { it },
      outY = { it / 2 }
    )
    1 -> EventTransitionDirection(
      inX = { it },
      inY = { -it / 2 },
      outX = { -it },
      outY = { it / 2 }
    )
    2 -> EventTransitionDirection(
      inX = { -it },
      inY = { it / 2 },
      outX = { it },
      outY = { -it / 2 }
    )
    else -> EventTransitionDirection(
      inX = { it },
      inY = { it / 2 },
      outX = { -it },
      outY = { -it / 2 }
    )
  }
}

private fun eventCardRotation(seed: String): Float {
  return (((seed.hashCode().absoluteValue % 21) - 10).toFloat()).coerceIn(-10f, 10f)
}

@Composable
private fun YouTubePlayerScreen(
  state: DriveDeckUiState,
  onBack: () -> Unit,
) {
  val context = LocalContext.current
  val youtubeUrl = state.youtubePlaybackUrl.trim()
  if (youtubeUrl.isBlank()) {
    return
  }

  val embedUrl = remember(youtubeUrl) {
    youtubeEmbedUrlFromRaw(youtubeUrl)
  }
  val targetUrl = if (embedUrl.isNotBlank()) embedUrl else youtubeUrl
  var showLaunchPrompt by remember(targetUrl) { mutableStateOf(true) }
  var launchRequestCount by remember(targetUrl) { mutableIntStateOf(0) }
  var nativeLaunchFailed by remember(targetUrl) { mutableStateOf(false) }

  LaunchedEffect(targetUrl, launchRequestCount) {
    if (launchRequestCount <= 0) {
      return@LaunchedEffect
    }
    nativeLaunchFailed = false
    val url = targetUrl.trim()
    if (url.isBlank()) {
      nativeLaunchFailed = true
      return@LaunchedEffect
    }

    val specificIntent = Intent(Intent.ACTION_VIEW, Uri.parse(url)).apply {
      setPackage("com.google.android.youtube.tv")
      addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
    }

    val genericIntent = Intent(Intent.ACTION_VIEW, Uri.parse(url)).apply {
      addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
    }

    val opened = runCatching {
      context.startActivity(specificIntent)
      true
    }.recoverCatching {
      context.startActivity(genericIntent)
      true
    }.getOrElse { false }

    if (opened) {
      onBack()
    } else {
      nativeLaunchFailed = true
    }
  }
  val embedHtml = remember(targetUrl) {
    """
      <!doctype html>
      <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>
          html, body { margin: 0; padding: 0; width: 100%; height: 100%; background: #000; overflow: hidden; }
          iframe { position: absolute; inset: 0; width: 100%; height: 100%; border: 0; }
        </style>
      </head>
      <body>
        <iframe
          src="$targetUrl"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowfullscreen
          referrerpolicy="strict-origin-when-cross-origin">
        </iframe>
      </body>
      </html>
    """.trimIndent()
  }

  Box(
    modifier = Modifier
      .fillMaxSize()
      .background(Color.Black)
  ) {
    if (showLaunchPrompt) {
      Box(
        modifier = Modifier
          .fillMaxSize()
          .background(Color(0xCC000000)),
        contentAlignment = Alignment.Center
      ) {
        Column(
          modifier = Modifier
            .width(760.dp)
            .clip(RoundedCornerShape(18.dp))
            .background(Color(0xEE111111))
            .border(1.dp, Color(0x33FFFFFF), RoundedCornerShape(18.dp))
            .padding(28.dp),
          verticalArrangement = Arrangement.spacedBy(18.dp)
        ) {
          Text(
            text = "This video will open in YouTube app, continue?",
            color = Color.White,
            fontSize = 26.sp,
            fontWeight = FontWeight.SemiBold
          )
          Row(horizontalArrangement = Arrangement.spacedBy(14.dp)) {
            FocusablePrimaryButton(
              modifier = Modifier.width(180.dp),
              onClick = {
                showLaunchPrompt = false
                launchRequestCount += 1
              },
              sharpCorners = true
            ) {
              Text("Yes", color = Color.White, fontWeight = FontWeight.Bold)
            }
            FocusableSurface(
              modifier = Modifier
                .height(58.dp)
                .width(180.dp),
              onClick = {
                showLaunchPrompt = false
                nativeLaunchFailed = true
              },
              focusedBorderColor = Color.White,
              shape = RoundedCornerShape(0.dp),
              focusedShadow = true
            ) {
              Box(
                modifier = Modifier
                  .fillMaxSize()
                  .background(Color.Transparent)
                  .border(1.dp, Color.White),
                contentAlignment = Alignment.Center
              ) {
                Text("No", color = Color.White, fontWeight = FontWeight.SemiBold)
              }
            }
          }
        }
      }
    } else if (nativeLaunchFailed) {
      AndroidView(
        factory = { context ->
          WebView(context).apply {
            webViewClient = WebViewClient()
            webChromeClient = WebChromeClient()
            settings.javaScriptEnabled = true
            settings.javaScriptCanOpenWindowsAutomatically = true
            settings.loadsImagesAutomatically = true
            settings.domStorageEnabled = true
            settings.mediaPlaybackRequiresUserGesture = false
            settings.useWideViewPort = true
            settings.loadWithOverviewMode = true
            settings.mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
            settings.userAgentString =
              "Mozilla/5.0 (Linux; Android 13; TV) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
            settings.cacheMode = WebSettings.LOAD_DEFAULT
            CookieManager.getInstance().setAcceptCookie(true)
            CookieManager.getInstance().setAcceptThirdPartyCookies(this, true)
            loadDataWithBaseURL(
              "https://www.youtube.com",
              embedHtml,
              "text/html",
              "utf-8",
              null
            )
          }
        },
        update = { webView ->
          if (webView.url.isNullOrBlank()) {
            webView.loadDataWithBaseURL(
              "https://www.youtube.com",
              embedHtml,
              "text/html",
              "utf-8",
              null
            )
          }
        },
        modifier = Modifier.fillMaxSize()
      )
    } else {
      Box(
        modifier = Modifier.fillMaxSize(),
        contentAlignment = Alignment.Center
      ) {
        Text("Opening YouTube…", color = Color.White)
      }
    }

    Box(
      modifier = Modifier
        .align(Alignment.TopStart)
        .padding(24.dp)
    ) {
      FocusableIconAction(onClick = onBack) {
        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back", tint = Color.White)
      }
    }
  }
}

@Composable
private fun VideoPlayerScreen(
  state: DriveDeckUiState,
  onBack: () -> Unit,
) {
  val current = state.currentSlide?.takeIf { it.isVideo } ?: return
  val context = LocalContext.current
  var playerErrorMessage by remember(current.id, current.fullUrl) { mutableStateOf<String?>(null) }
  var playerPlaybackState by remember(current.id, current.fullUrl) { mutableStateOf(Player.STATE_IDLE) }
  val player = remember(current.id, current.fullUrl) {
    ExoPlayer.Builder(context).build().apply {
      setMediaItem(
        MediaItem.Builder()
          .setUri(current.fullUrl)
          .setMimeType(current.mimeType)
          .build()
      )
      prepare()
      playWhenReady = true
    }
  }
  var durationMs by remember { mutableStateOf(0L) }
  var positionMs by remember { mutableStateOf(0L) }
  var isPlaying by remember { mutableStateOf(true) }
  var sliderScrubPositionMs by remember { mutableStateOf<Long?>(null) }
  var pendingSeekKey by remember { mutableStateOf<Key?>(null) }
  var longPressSeekActive by remember { mutableStateOf(false) }
  var resumePlaybackAfterLongSeek by remember { mutableStateOf(false) }
  var previewPositionMs by remember { mutableStateOf<Long?>(null) }
  var previewBitmap by remember { mutableStateOf<Bitmap?>(null) }
  val showPlayerUi = !isPlaying || sliderScrubPositionMs != null || longPressSeekActive || previewPositionMs != null
  var isBuffering by remember(current.id, current.fullUrl) { mutableStateOf(false) }

  fun seekBy(deltaMs: Long, resumePlayback: Boolean = false) {
    val duration = (durationMs.takeIf { it > 0 } ?: player.duration.takeIf { it > 0 } ?: 0L)
    val target = (player.currentPosition + deltaMs).coerceIn(0L, duration)
    player.seekTo(target)
    if (resumePlayback) {
      player.play()
    }
  }

  DisposableEffect(player) {
    val listener = object : Player.Listener {
      override fun onPlaybackStateChanged(playbackState: Int) {
        playerPlaybackState = playbackState
        durationMs = player.duration.takeIf { it > 0 } ?: durationMs
        isBuffering = playbackState == Player.STATE_BUFFERING
        if (playbackState == Player.STATE_READY) {
          playerErrorMessage = null
        }
      }

      override fun onIsPlayingChanged(isPlayingNow: Boolean) {
        isPlaying = isPlayingNow
      }

      override fun onPlayerError(error: androidx.media3.common.PlaybackException) {
        playerErrorMessage = friendlyVideoPlaybackError(error, current.mimeType)
      }
    }
    player.addListener(listener)
    onDispose {
      player.removeListener(listener)
      player.release()
    }
  }

  LaunchedEffect(player, sliderScrubPositionMs, longPressSeekActive) {
    while (true) {
      if (sliderScrubPositionMs == null && !longPressSeekActive) {
        positionMs = player.currentPosition.coerceAtLeast(0L)
        durationMs = player.duration.takeIf { it > 0 } ?: durationMs
      }
      delay(250)
    }
  }

  LaunchedEffect(current.id, current.mimeType, playerPlaybackState, isPlaying, positionMs, playerErrorMessage) {
    if (playerErrorMessage != null || !isPotentiallyUnsupportedVideoMime(current.mimeType)) {
      return@LaunchedEffect
    }
    if (positionMs > 0L || isPlaying) {
      return@LaunchedEffect
    }
    if (playerPlaybackState != Player.STATE_BUFFERING && playerPlaybackState != Player.STATE_READY) {
      return@LaunchedEffect
    }

    delay(2500)

    if (playerErrorMessage == null && positionMs <= 0L && !player.isPlaying) {
      playerErrorMessage = unsupportedVideoFormatMessage(current.mimeType)
    }
  }

  LaunchedEffect(current.fullUrl, previewPositionMs) {
    previewBitmap = if (previewPositionMs == null) {
      null
    } else {
      withContext(Dispatchers.IO) {
        runCatching {
          val retriever = MediaMetadataRetriever()
          try {
            retriever.setDataSource(current.fullUrl, emptyMap())
            retriever.getFrameAtTime(previewPositionMs!! * 1000, MediaMetadataRetriever.OPTION_CLOSEST_SYNC)
          } finally {
            retriever.release()
          }
        }.getOrNull()
      }
    }
  }

  Box(
    modifier = Modifier
      .fillMaxSize()
      .background(Color.Black)
      .focusable()
      .onPreviewKeyEvent { event ->
        if (event.type == KeyEventType.KeyUp && pendingSeekKey != null && event.key == pendingSeekKey) {
          val targetPreview = previewPositionMs
          val wasLongPress = longPressSeekActive
          pendingSeekKey = null
          longPressSeekActive = false
          if (wasLongPress && targetPreview != null) {
            player.seekTo(targetPreview)
            player.play()
            previewPositionMs = null
            return@onPreviewKeyEvent true
          }
          if (event.key == Key.DirectionLeft) {
            seekBy(-10_000L, resumePlayback = true)
          } else if (event.key == Key.DirectionRight) {
            seekBy(10_000L, resumePlayback = true)
          }
          return@onPreviewKeyEvent true
        }

        if (event.type != KeyEventType.KeyDown) {
          return@onPreviewKeyEvent false
        }

        when (event.key) {
          Key.DirectionLeft,
          Key.DirectionRight -> {
            val direction = if (event.key == Key.DirectionLeft) -1 else 1
            if (pendingSeekKey == event.key) {
              if (!longPressSeekActive) {
                longPressSeekActive = true
                resumePlaybackAfterLongSeek = player.isPlaying
                if (player.isPlaying) {
                  player.pause()
                }
                previewPositionMs = player.currentPosition.coerceAtLeast(0L)
              }
              val duration = (durationMs.takeIf { it > 0 } ?: player.duration.takeIf { it > 0 } ?: 0L)
              val basePosition = previewPositionMs ?: player.currentPosition.coerceAtLeast(0L)
              previewPositionMs = (basePosition + direction * 5_000L).coerceIn(0L, duration)
              true
            } else {
              pendingSeekKey = event.key
              true
            }
          }
          Key.DirectionCenter,
          Key.Enter -> {
            if (player.isPlaying) player.pause() else player.play()
            true
          }
          Key.Escape,
          Key.Back -> {
            onBack()
            true
          }
          else -> false
        }
      }
  ) {
    AndroidView(
      factory = { context ->
        PlayerView(context).apply {
          useController = false
          resizeMode = AspectRatioFrameLayout.RESIZE_MODE_FIT
          this.player = player
        }
      },
      update = { playerView ->
        playerView.player = player
      },
      modifier = Modifier.fillMaxSize()
    )

    if (isBuffering && playerErrorMessage == null) {
      Box(
        modifier = Modifier
          .align(Alignment.TopStart)
          .padding(18.dp)
          .clip(RoundedCornerShape(12.dp))
          .background(Color(0xCCFFFFFF))
          .border(BorderStroke(1.dp, Color(0x14000000)), RoundedCornerShape(12.dp))
          .padding(horizontal = 12.dp, vertical = 8.dp)
      ) {
        Text("Buffering", color = Color.White, fontSize = 12.sp, fontWeight = FontWeight.Medium)
      }
    }

    playerErrorMessage?.let { message ->
      Box(
        modifier = Modifier
          .align(Alignment.BottomEnd)
          .padding(22.dp)
          .width(460.dp)
      ) {
        StatusBanner(
          status = message,
          tone = StatusTone.Error,
          isLoading = false
        )
      }
    }

    AnimatedVisibility(
      visible = showPlayerUi,
      enter = fadeIn(animationSpec = tween(180)),
      exit = fadeOut(animationSpec = tween(180)),
      modifier = Modifier
        .align(Alignment.BottomCenter)
        .fillMaxWidth()
    ) {
      Column(
        modifier = Modifier
          .fillMaxWidth()
          .padding(horizontal = 24.dp, vertical = 20.dp)
      ) {
        BoxWithConstraints(modifier = Modifier.fillMaxWidth()) {
          val density = LocalDensity.current
          val activePreviewPosition = sliderScrubPositionMs ?: previewPositionMs
          val effectiveDuration = durationMs.coerceAtLeast(1L)
          val previewFraction = ((activePreviewPosition ?: positionMs).toFloat() / effectiveDuration.toFloat())
            .coerceIn(0f, 1f)
          val previewWidthPx = with(density) { 92.dp.roundToPx() }
          val previewYOffsetPx = with(density) { 100.dp.roundToPx() }
          val maxWidthPx = with(density) { maxWidth.roundToPx() }

          if (activePreviewPosition != null && previewBitmap != null) {
            Box(
              modifier = Modifier
                .offset {
                  IntOffset(
                    x = ((maxWidthPx - previewWidthPx) * previewFraction).toInt(),
                    y = -previewYOffsetPx
                  )
                }
                .width(92.dp)
                .clip(RoundedCornerShape(12.dp))
                .background(Color(0xF6FFFFFF))
                .padding(6.dp)
            ) {
              Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Image(
                  bitmap = previewBitmap!!.asImageBitmap(),
                  contentDescription = "Seek preview",
                  contentScale = ContentScale.Crop,
                  modifier = Modifier
                    .fillMaxWidth()
                    .aspectRatio(16f / 9f)
                    .clip(RoundedCornerShape(8.dp))
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(formatVideoTime(activePreviewPosition), color = Color.White, fontSize = 10.sp)
              }
            }
          }

          Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Slider(
              value = (sliderScrubPositionMs ?: positionMs).toFloat(),
              onValueChange = { value ->
                val scrubValue = value.toLong()
                sliderScrubPositionMs = scrubValue
                previewPositionMs = scrubValue
              },
              onValueChangeFinished = {
                sliderScrubPositionMs?.let {
                  player.seekTo(it)
                  player.play()
                }
                sliderScrubPositionMs = null
                previewPositionMs = null
              },
              valueRange = 0f..effectiveDuration.toFloat()
            )
            Row(
              modifier = Modifier.fillMaxWidth(),
              horizontalArrangement = Arrangement.SpaceBetween
            ) {
              Text(formatVideoTime(positionMs), color = Color.White, fontSize = 11.sp)
              Text(formatVideoTime(durationMs), color = Color.White, fontSize = 11.sp)
            }
          }
        }

        Spacer(modifier = Modifier.height(12.dp))

        Row(
          modifier = Modifier.align(Alignment.CenterHorizontally),
          horizontalArrangement = Arrangement.spacedBy(12.dp),
          verticalAlignment = Alignment.CenterVertically
        ) {
          CompactRoundActionButton(onClick = { seekBy(-10_000L, resumePlayback = true) }) {
            Icon(Icons.Default.Replay10, contentDescription = "Back 10 seconds", tint = Color.White, modifier = Modifier.size(22.dp))
          }
          CompactRoundActionButton(
            onClick = { if (player.isPlaying) player.pause() else player.play() },
            emphasized = true,
          ) {
            Icon(
              if (isPlaying) Icons.Default.Pause else Icons.Default.PlayArrow,
              contentDescription = "Play or pause",
              tint = Color.White,
              modifier = Modifier.size(24.dp)
            )
          }
          CompactRoundActionButton(onClick = { seekBy(10_000L, resumePlayback = true) }) {
            Icon(Icons.Default.Forward10, contentDescription = "Forward 10 seconds", tint = Color.White, modifier = Modifier.size(22.dp))
          }
        }
      }
    }
  }
}

@Composable
private fun CompactRoundActionButton(
  modifier: Modifier = Modifier,
  onClick: () -> Unit,
  emphasized: Boolean = false,
  content: @Composable () -> Unit,
) {
  var focused by remember { mutableStateOf(false) }

  Card(
    modifier = modifier
      .onFocusChanged { focused = it.isFocused }
      .size(54.dp)
      .focusable()
      .clickable(onClick = onClick),
    colors = CardDefaults.cardColors(
      containerColor = if (focused) Color(0xE6000000) else Color(0xCC000000)
    ),
    border = BorderStroke(1.dp, if (focused) Color(0x55FFFFFF) else Color(0x22FFFFFF)),
    shape = RoundedCornerShape(16.dp)
  ) {
    Box(
      modifier = Modifier.fillMaxSize(),
      contentAlignment = Alignment.Center
    ) {
      if (emphasized) {
        Box(
          modifier = Modifier
            .size(38.dp)
            .clip(RoundedCornerShape(19.dp))
            .background(Color(0xFF000000))
        )
      }
      content()
    }
  }
}

private fun friendlyVideoPlaybackError(
  error: androidx.media3.common.PlaybackException,
  mimeType: String,
): String {
  val detail = error.localizedMessage?.lowercase().orEmpty()
  if (isPotentiallyUnsupportedVideoMime(mimeType)) {
    return unsupportedVideoFormatMessage(mimeType)
  }
  return when {
    "403" in detail || "404" in detail -> "This video is no longer available. It may have moved, been deleted, or its sharing permissions may have changed."
    "format" in detail || "decoder" in detail || "mime" in detail || "unsupported" in detail ->
      "This TV does not support this video format. Please use MP4 for the most reliable playback."
    else -> "We couldn't play this video right now. The video may still be buffering, unavailable, or unsupported on this device."
  }
}

private fun isPotentiallyUnsupportedVideoMime(mimeType: String): Boolean {
  return mimeType.contains("quicktime", ignoreCase = true) ||
    mimeType.contains("mpeg", ignoreCase = true)
}

private fun unsupportedVideoFormatMessage(mimeType: String): String {
  return when {
    mimeType.contains("quicktime", ignoreCase = true) ->
      "This TV does not support this MOV video reliably. Please use MP4 for the most reliable playback."
    mimeType.contains("mpeg", ignoreCase = true) ->
      "This TV does not support this MPG video reliably. Please use MP4 for the most reliable playback."
    else ->
      "This TV does not support this video format. Please use MP4 for the most reliable playback."
  }
}

private fun youtubeVideoIdFromRaw(url: String): String {
  if (url.isBlank()) return ""
  return runCatching {
    val uri = android.net.Uri.parse(url)
    val host = uri.host.orEmpty().lowercase()
    when {
      host == "youtu.be" -> uri.lastPathSegment.orEmpty()
      host.endsWith("youtube.com") && uri.path == "/watch" -> uri.getQueryParameter("v").orEmpty()
      host.endsWith("youtube.com") && uri.path.orEmpty().startsWith("/shorts/") ->
        uri.pathSegments.getOrNull(1).orEmpty()
      host.endsWith("youtube.com") && uri.path.orEmpty().startsWith("/embed/") ->
        uri.pathSegments.getOrNull(1).orEmpty()
      else -> ""
    }.trim()
  }.getOrDefault("")
}

private fun youtubeEmbedUrlFromRaw(url: String): String {
  val videoId = youtubeVideoIdFromRaw(url)
  if (videoId.isBlank()) return ""
  return "https://www.youtube.com/embed/$videoId?autoplay=1&playsinline=1&rel=0"
}

private fun formatVideoTime(positionMs: Long): String {
  val totalSeconds = (positionMs / 1000L).coerceAtLeast(0L)
  val hours = totalSeconds / 3600L
  val minutes = (totalSeconds % 3600L) / 60L
  val seconds = totalSeconds % 60L
  return if (hours > 0) {
    "%d:%02d:%02d".format(hours, minutes, seconds)
  } else {
    "%02d:%02d".format(minutes, seconds)
  }
}

@Composable
private fun SettingsPanel(
  duration: Int,
  loop: Boolean,
  autoplay: Boolean,
  playVideosInSlideshow: Boolean,
  onDecreaseDuration: () -> Unit,
  onIncreaseDuration: () -> Unit,
  onToggleLoop: () -> Unit,
  onToggleAutoplay: () -> Unit,
  onTogglePlayVideosInSlideshow: () -> Unit,
  onPrimary: () -> Unit,
  primaryLabel: String,
) {
  Column(
    modifier = Modifier
      .padding(24.dp)
      .clip(RoundedCornerShape(18.dp))
      .background(Color(0xF6FFFFFF))
      .padding(20.dp)
      .widthClamped(),
    verticalArrangement = Arrangement.spacedBy(18.dp)
  ) {
    Text("CarnivalStories", color = TextPrimary, fontWeight = FontWeight.Bold)
    Text("Duration", color = TextSecondary, letterSpacing = 1.5.sp)
    CounterControl(duration, onDecreaseDuration, onIncreaseDuration)
    ToggleRow("Repeat slideshow", loop, onToggleLoop)
    ToggleRow("Play automatically", autoplay, onToggleAutoplay)
    ToggleRow("Play videos in slideshow", playVideosInSlideshow, onTogglePlayVideosInSlideshow)
    FocusablePrimaryButton(
      onClick = onPrimary,
      modifier = Modifier.fillMaxWidth(),
    ) {
      Text(primaryLabel, color = Color.White)
    }
  }
}

@Composable
private fun CounterControl(
  duration: Int,
  onDecrease: () -> Unit,
  onIncrease: () -> Unit,
) {
  Row(
    modifier = Modifier.fillMaxWidth(),
    horizontalArrangement = Arrangement.spacedBy(12.dp),
    verticalAlignment = Alignment.CenterVertically
  ) {
    CounterButton("-", onDecrease)
    Box(
      modifier = Modifier
        .weight(1f)
        .height(56.dp)
        .border(BorderStroke(1.dp, BorderStrong), RoundedCornerShape(14.dp)),
      contentAlignment = Alignment.Center
    ) {
      Text("${duration}s", color = TextPrimary, fontWeight = FontWeight.SemiBold)
    }
    CounterButton("+", onIncrease)
  }
}

@Composable
private fun CounterButton(label: String, onClick: () -> Unit) {
  FocusableSurface(
    modifier = Modifier.size(56.dp),
    onClick = onClick
  ) {
    Box(contentAlignment = Alignment.Center, modifier = Modifier.fillMaxSize()) {
      Text(label, color = TextPrimary, fontSize = 26.sp, fontWeight = FontWeight.Bold)
    }
  }
}

@Composable
private fun ToggleRow(label: String, checked: Boolean, onToggle: () -> Unit) {
  Row(
    modifier = Modifier.fillMaxWidth(),
    horizontalArrangement = Arrangement.SpaceBetween,
    verticalAlignment = Alignment.CenterVertically
  ) {
    Text(label, color = TextPrimary)
    Switch(checked = checked, onCheckedChange = { onToggle() })
  }
}

@Composable
private fun PhotoCard(
  modifier: Modifier = Modifier,
  image: PhotoAsset,
  onClick: () -> Unit,
) {
  FocusableSurface(
    modifier = modifier,
    onClick = onClick,
    shape = RoundedCornerShape(0.dp)
  ) {
    Column {
      Box(
        modifier = Modifier
          .fillMaxWidth()
          .aspectRatio(1f)
      ) {
        SubcomposeAsyncImage(
          model = image.thumbnailUrl,
          contentDescription = image.name,
          contentScale = ContentScale.Crop,
          modifier = Modifier.fillMaxSize()
        ) {
          if (painter.state is coil.compose.AsyncImagePainter.State.Success) {
            SubcomposeAsyncImageContent()
          } else {
            Box(modifier = Modifier.fillMaxSize()) {
              CircularProgressIndicator(
                modifier = Modifier
                  .align(Alignment.BottomEnd)
                  .padding(10.dp)
                  .size(16.dp),
                color = AccentColor,
                strokeWidth = 2.dp
              )
            }
          }
        }
        if (image.isVideo) {
          Box(
            modifier = Modifier
              .align(Alignment.Center)
              .size(56.dp)
              .clip(RoundedCornerShape(28.dp))
              .background(OverlaySoft),
            contentAlignment = Alignment.Center
          ) {
            Icon(
              Icons.Default.PlayArrow,
              contentDescription = "Video",
              tint = AccentColor,
              modifier = Modifier.size(28.dp)
            )
          }
        }
      }
      Column(modifier = Modifier.padding(14.dp)) {
        Text(image.name, color = TextPrimary, maxLines = 1)
        Text(image.path, color = TextSecondary, maxLines = 1, fontSize = 12.sp)
      }
    }
  }
}

@Composable
private fun TvCard(
  modifier: Modifier = Modifier,
  title: String,
  subtitle: String,
  supporting: String,
  onClick: () -> Unit,
) {
  FocusableSurface(
    modifier = modifier.fillMaxWidth(),
    onClick = onClick,
    shape = RoundedCornerShape(0.dp)
  ) {
    Column(
      modifier = Modifier
        .fillMaxWidth()
        .padding(18.dp),
      verticalArrangement = Arrangement.spacedBy(10.dp)
    ) {
      Text(title, color = TextPrimary, fontWeight = FontWeight.Bold, fontSize = 20.sp)
      Text(subtitle.uppercase(), color = AccentColor, fontSize = 12.sp)
      Text(supporting, color = TextSecondary, fontSize = 12.sp, lineHeight = 16.sp)
    }
  }
}

@Composable
private fun FocusableSurface(
  modifier: Modifier = Modifier,
  onClick: () -> Unit,
  focusedBorderColor: Color = Color(0xFF000000),
  shape: RoundedCornerShape = RoundedCornerShape(18.dp),
  focusedShadow: Boolean = false,
  content: @Composable () -> Unit,
) {
  var focused by remember { mutableStateOf(false) }

  Card(
    modifier = modifier
      .onFocusChanged { focused = it.isFocused }
      .focusable()
      .clickable(onClick = onClick),
    colors = CardDefaults.cardColors(
      containerColor = if (focused) SurfaceMuted else SurfaceBackground
    ),
    border = BorderStroke(
      width = if (focused) 2.dp else 1.dp,
      color = if (focused) focusedBorderColor else BorderSoft
    ),
    shape = shape,
    elevation = CardDefaults.cardElevation(
      defaultElevation = 0.dp,
      focusedElevation = if (focusedShadow) 18.dp else 0.dp
    )
  ) {
    content()
  }
}

@Composable
private fun RoundActionButton(
  modifier: Modifier = Modifier,
  onClick: () -> Unit,
  emphasized: Boolean = false,
  label: String? = null,
  content: @Composable () -> Unit,
) {
  var focused by remember { mutableStateOf(false) }

  Card(
    modifier = modifier
      .size(72.dp)
      .onFocusChanged { focused = it.isFocused }
      .focusable()
      .clickable(onClick = onClick),
    colors = CardDefaults.cardColors(
      containerColor = if (focused) Color(0xE6000000) else Color(0xCC000000)
    ),
    border = BorderStroke(1.dp, if (focused) Color(0x55FFFFFF) else Color(0x22FFFFFF)),
    shape = RoundedCornerShape(18.dp)
  ) {
    Box(
      modifier = Modifier.fillMaxSize(),
      contentAlignment = Alignment.Center
    ) {
      if (emphasized) {
        Box(
          modifier = Modifier
            .size(52.dp)
            .clip(RoundedCornerShape(26.dp))
            .background(AccentColor)
        )
      }
      content()
      if (label != null) {
        Text(
          text = label,
          modifier = Modifier.align(Alignment.BottomCenter).padding(bottom = 8.dp),
          color = Color.Transparent,
          fontSize = 1.sp
        )
      }
    }
  }
}

@Composable
private fun FocusablePrimaryButton(
  modifier: Modifier = Modifier,
  onClick: () -> Unit,
  sharpCorners: Boolean = false,
  content: @Composable () -> Unit,
) {
  FocusableSurface(
    modifier = modifier.height(58.dp),
    onClick = onClick,
    focusedBorderColor = AccentColor,
    shape = RoundedCornerShape(if (sharpCorners) 0.dp else 18.dp),
    focusedShadow = true,
  ) {
    Box(
      modifier = Modifier
        .fillMaxSize()
        .background(AccentColor),
      contentAlignment = Alignment.Center
    ) {
      content()
    }
  }
}

@Composable
private fun FocusableTextAction(
  modifier: Modifier = Modifier,
  onClick: () -> Unit,
  content: @Composable () -> Unit,
) {
  var focused by remember { mutableStateOf(false) }

  Card(
    modifier = modifier
      .onFocusChanged { focused = it.isFocused }
      .focusable()
      .clickable(onClick = onClick),
    colors = CardDefaults.cardColors(
      containerColor = if (focused) BorderSoft else Color.Transparent
    ),
    border = BorderStroke(
      width = if (focused) 2.dp else 1.dp,
      color = if (focused) AccentColor else Color.Transparent
    ),
    shape = RoundedCornerShape(16.dp)
  ) {
    Box(
      modifier = Modifier.padding(horizontal = 18.dp, vertical = 12.dp),
      contentAlignment = Alignment.Center
    ) {
      androidx.compose.material3.ProvideTextStyle(
        MaterialTheme.typography.bodyLarge.copy(
          color = if (focused) TextPrimary else Color(0xFF7A7A7A),
          textDecoration = TextDecoration.Underline,
          fontWeight = if (focused) FontWeight.SemiBold else FontWeight.Normal
        )
      ) {
        content()
      }
    }
  }
}

@Composable
private fun FocusableIconAction(
  modifier: Modifier = Modifier,
  onClick: () -> Unit,
  content: @Composable () -> Unit,
) {
  FocusableSurface(
    modifier = modifier.size(56.dp),
    onClick = onClick,
    shape = RoundedCornerShape(0.dp)
  ) {
    Box(
      modifier = Modifier.fillMaxSize(),
      contentAlignment = Alignment.Center
    ) {
      content()
    }
  }
}

@Composable
private fun CenterStage(
  title: String,
  subtitle: String,
  status: String,
  statusTone: StatusTone,
  isLoading: Boolean,
  content: @Composable ColumnScope.() -> Unit,
) {
  Box(
    modifier = Modifier
      .fillMaxSize()
      .background(AppBackground)
  ) {
    Column(
      modifier = Modifier
        .align(Alignment.Center)
        .fillMaxWidth(0.6f)
        .clip(RoundedCornerShape(24.dp))
        .background(SurfaceBackground)
        .border(BorderStroke(1.dp, BorderSoft), RoundedCornerShape(24.dp))
        .padding(28.dp),
      verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
      Text(title, color = TextPrimary, fontSize = 38.sp, fontWeight = FontWeight.Bold)
      Text(subtitle, color = TextSecondary)
      if (status.isNotBlank()) {
        StatusBanner(status = status, tone = statusTone, isLoading = isLoading)
      }
      Spacer(modifier = Modifier.height(8.dp))
      content()
    }
  }
}

@Composable
private fun StatusBanner(
  status: String,
  tone: StatusTone,
  isLoading: Boolean,
) {
  val borderColor = when (tone) {
    StatusTone.Error -> AccentColor
    StatusTone.Loading -> AccentColor
    StatusTone.Neutral -> BorderSoft
  }
  val backgroundColor = when (tone) {
    StatusTone.Error -> BorderSoft
    StatusTone.Loading -> Color(0x0F000000)
    StatusTone.Neutral -> SurfaceStrong
  }

  Row(
    modifier = Modifier
      .fillMaxWidth()
      .border(BorderStroke(1.dp, borderColor), RoundedCornerShape(16.dp))
      .background(backgroundColor, RoundedCornerShape(16.dp))
      .padding(horizontal = 16.dp, vertical = 14.dp),
    horizontalArrangement = Arrangement.spacedBy(12.dp),
    verticalAlignment = Alignment.CenterVertically
  ) {
    if (isLoading) {
      CircularProgressIndicator(
        modifier = Modifier.size(18.dp),
        strokeWidth = 2.dp,
        color = AccentColor
      )
    }
    Text(
      text = status,
      color = TextPrimary,
      lineHeight = 20.sp
    )
  }
}

@Composable
private fun ContentScaffold(
  title: String,
  subtitle: String,
  onBack: () -> Unit,
  topAction: @Composable (() -> Unit)? = null,
  content: @Composable (PaddingValues) -> Unit,
) {
  Scaffold(
    containerColor = AppBackground,
    topBar = {
      Row(
        modifier = Modifier
          .fillMaxWidth()
          .padding(horizontal = 24.dp, vertical = 20.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
      ) {
        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
          FocusableIconAction(onClick = onBack) {
            Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back", tint = TextPrimary)
          }
          Column {
            Text(title, color = TextPrimary, fontSize = 30.sp, fontWeight = FontWeight.Bold)
            Text(subtitle, color = TextSecondary)
          }
        }
        topAction?.invoke()
      }
    }
  ) { padding ->
    content(padding)
  }
}

private fun Modifier.widthClamped() = this.then(Modifier.fillMaxWidth(0.32f))

private fun resolvePresentationCoverBackground(
  folders: List<FolderSummary>,
  explicitCover: String,
): String {
  val explicit = explicitCover.trim()
  if (explicit.isNotBlank()) return explicit
  return folders
    .asSequence()
    .flatMap { it.images.asSequence() }
    .filterNot { it.isVideo }
    .mapNotNull { image ->
      val primary = image.slideshowUrl.trim()
      if (primary.isNotBlank()) {
        primary
      } else {
        image.fullUrl.trim().ifBlank { null }
      }
    }
    .firstOrNull()
    .orEmpty()
}

private fun parseHexColorOrNull(value: String): Color? {
  val trimmed = value.trim()
  if (trimmed.isBlank()) return null
  return runCatching {
    Color(android.graphics.Color.parseColor(trimmed))
  }.getOrNull()
}

private const val QR_BITMAP_SIZE = 360

private fun generateQrBitmap(content: String): Bitmap? {
  return runCatching {
    val hints = mapOf(EncodeHintType.MARGIN to 1)
    val bitMatrix = QRCodeWriter().encode(content, BarcodeFormat.QR_CODE, QR_BITMAP_SIZE, QR_BITMAP_SIZE, hints)
    Bitmap.createBitmap(QR_BITMAP_SIZE, QR_BITMAP_SIZE, Bitmap.Config.ARGB_8888).apply {
      for (x in 0 until QR_BITMAP_SIZE) {
        for (y in 0 until QR_BITMAP_SIZE) {
          setPixel(
            x,
            y,
            if (bitMatrix[x, y]) android.graphics.Color.BLACK else android.graphics.Color.WHITE
          )
        }
      }
    }
  }.getOrNull()
}

sealed interface TvScreen {
  data object Home : TvScreen
  data object DirectLink : TvScreen
  data object Folders : TvScreen
  data object Gallery : TvScreen
  data object Slideshow : TvScreen
  data object VideoPlayer : TvScreen
  data object YouTubePlayer : TvScreen
}

data class DriveDeckUiState(
  val screen: TvScreen = TvScreen.Home,
  val pairingCode: String = "",
  val lastUsedCode: String = "",
  val pairingUrl: String = "",
  val directLink: String = "",
  val status: String = "",
  val statusTone: StatusTone = StatusTone.Neutral,
  val isLoading: Boolean = false,
  val folders: List<FolderSummary> = emptyList(),
  val selectedFolder: FolderSummary? = null,
  val albumCoverBackgroundUrl: String = "",
  val images: List<PhotoAsset> = emptyList(),
  val currentSlideIndex: Int = 0,
  val durationSeconds: Int = 4,
  val loopEnabled: Boolean = true,
  val autoplayEnabled: Boolean = true,
  val playVideosInSlideshow: Boolean = true,
  val gallerySettingsVisible: Boolean = false,
  val slideshowSettingsVisible: Boolean = false,
  val slideshowChromeVisible: Boolean = true,
  val isEventPresentationMode: Boolean = false,
  val isAlbumPresentationMode: Boolean = false,
  val albumPresentationBackgroundUrl: String = "",
  val albumPresentationOverlayColor: String = "",
  val isTemporaryAlbumPresentationMode: Boolean = false,
  val albumPresentationReturnScreen: TvScreen = TvScreen.Gallery,
  val eventPresentationTitle: String = "",
  val eventPresentationSlug: String = "",
  val eventPresentationBackgroundUrl: String = "",
  val youtubePlaybackUrl: String = "",
  val youtubePlaybackTitle: String = "",
  val inlineVideoPlaybackApprovedId: String? = null,
  val videoPlayerPromptDismissedId: String? = null,
) {
  val currentSlide: PhotoAsset?
    get() = images.getOrNull(currentSlideIndex)

  val presentationBackgroundUrl: String
    get() = if (isEventPresentationMode) eventPresentationBackgroundUrl else albumPresentationBackgroundUrl
}

enum class StatusTone {
  Neutral,
  Loading,
  Error,
}

class DriveDeckViewModel(
  private val repository: DriveDeckRepository,
  private val initialPairingUrl: String = "",
  private val lastUsedCodeStore: LastUsedCodeStore,
) : ViewModel() {
  private var eventPresentationRefreshJob: Job? = null

  var uiState by mutableStateOf(
    DriveDeckUiState(
      pairingUrl = initialPairingUrl,
      lastUsedCode = lastUsedCodeStore.get(),
    )
  )
    private set

  init {
    if (initialPairingUrl.isBlank()) {
      viewModelScope.launch {
        preparePairingUrl()
      }
    }
  }

  private suspend fun preparePairingUrl() {
    val deadlineMs = System.currentTimeMillis() + 90_000L
    var lastError: Throwable? = null

    uiState = uiState.copy(
      isLoading = true,
      status = "Preparing the phone pairing link. This can take about a minute if the server is waking up.",
      statusTone = StatusTone.Loading
    )

    while (System.currentTimeMillis() < deadlineMs) {
      val pairingUrl = runCatching { repository.fetchPairingUrl() }
        .onFailure { lastError = it }
        .getOrNull()

      if (!pairingUrl.isNullOrBlank()) {
        uiState = uiState.copy(
          pairingUrl = pairingUrl,
          isLoading = false,
          status = "",
          statusTone = StatusTone.Neutral
        )
        return
      }

      delay(5_000)
    }

    uiState = uiState.copy(
      isLoading = false,
      status = lastError?.message
        ?: "We couldn’t prepare the phone pairing link just now. You can still type a code or enter a Drive link manually.",
      statusTone = StatusTone.Error
    )
  }

  fun updatePairingCode(value: String) {
    uiState = uiState.copy(pairingCode = value).withClearedStatus()
  }

  fun updateDirectLink(value: String) {
    uiState = uiState.copy(directLink = value).withClearedStatus()
  }

  fun navigateTo(screen: TvScreen) {
    uiState = uiState.copy(screen = screen).withClearedStatus()
  }

  fun submitPairingCode() {
    val code = uiState.pairingCode
    if (code.length != 6 && code.length != 7 && code.length != 9) {
      uiState = uiState.copy(
        status = "Please enter the full 6, 7, or 9 digit code from your phone.",
        statusTone = StatusTone.Error
      )
      return
    }

    viewModelScope.launch {
      uiState = uiState.copy(
        isLoading = true,
        status = "Checking your code and opening it…",
        statusTone = StatusTone.Loading
      )
      runCatching {
        repository.resolvePairing(code)
      }.onSuccess { resolution ->
        lastUsedCodeStore.set(code)
        uiState = uiState.copy(lastUsedCode = code)
        loadResolvedPairing(resolution)
      }.onFailure {
        uiState = uiState.copy(
          isLoading = false,
          status = it.message ?: "We couldn’t find that code. Please check it and try again.",
          statusTone = StatusTone.Error
        )
      }
    }
  }

  private suspend fun loadResolvedPairing(resolution: PairingResolution) {
    when (resolution) {
      is PairingResolution.Snapshot -> {
        val folders = flattenSnapshotFolders(resolution.snapshot)
        if (folders.isNotEmpty()) {
          val selectedFolder = folders.firstOrNull()
          val nextScreen = if (folders.size > 1) TvScreen.Folders else TvScreen.Gallery
          uiState = uiState.copy(
            isLoading = false,
            status = "",
            statusTone = StatusTone.Neutral,
            folders = folders,
            selectedFolder = selectedFolder,
            albumCoverBackgroundUrl = resolvePresentationCoverBackground(
              folders = folders,
              explicitCover = resolution.coverBackgroundUrl
            ),
            images = selectedFolder?.images.orEmpty(),
            screen = nextScreen,
            gallerySettingsVisible = false
          )
          uiState = uiState.copy(
            albumPresentationOverlayColor = resolution.studioBackgroundColor,
            isTemporaryAlbumPresentationMode = false
          )
          return
        }

        val fallbackUrl = resolution.folderUrl.trim()
        if (fallbackUrl.isNotBlank()) {
          loadFolder(
            folderUrl = fallbackUrl,
            isTemporary = false
          )
          return
        }

        uiState = uiState.copy(
          isLoading = false,
          status = "This gallery preview is still being prepared.",
          statusTone = StatusTone.Error
        )
      }

      is PairingResolution.Folder -> loadFolder(
        folderUrl = resolution.url,
        isTemporary = !resolution.isPermanent
      )
      is PairingResolution.EventPresentation -> {
        // Some resolve responses can miss background URL; hydrate once from public event API
        // so the presentation background appears immediately.
        val hydrated = if (resolution.backgroundUrl.isBlank() && resolution.slug.isNotBlank()) {
          runCatching { repository.fetchEventPresentation(resolution.slug) }.getOrDefault(resolution)
        } else {
          resolution
        }
        loadEventPresentation(hydrated)
      }
    }
  }

  private fun loadEventPresentation(resolution: PairingResolution.EventPresentation) {
    val photos = resolution.photos
    if (photos.isEmpty()) {
      uiState = uiState.copy(
        isLoading = false,
        status = "This event doesn’t have any live photos yet.",
        statusTone = StatusTone.Error
      )
      return
    }

    stopEventPresentationRefresh()
    uiState = uiState.copy(
      isLoading = false,
      status = "",
      statusTone = StatusTone.Neutral,
      folders = emptyList(),
      selectedFolder = null,
      images = photos,
      screen = TvScreen.Slideshow,
      currentSlideIndex = 0,
      autoplayEnabled = true,
      slideshowChromeVisible = false,
      slideshowSettingsVisible = false,
      gallerySettingsVisible = false,
      inlineVideoPlaybackApprovedId = null,
      videoPlayerPromptDismissedId = null,
      isEventPresentationMode = true,
      isAlbumPresentationMode = false,
      albumPresentationBackgroundUrl = "",
      albumPresentationOverlayColor = "",
      isTemporaryAlbumPresentationMode = false,
      eventPresentationTitle = resolution.name,
      eventPresentationSlug = resolution.slug,
      eventPresentationBackgroundUrl = resolution.backgroundUrl
    )
    startEventPresentationRefresh()
  }

  private fun DriveDeckUiState.withClearedStatus(): DriveDeckUiState {
    val shouldKeepPairingLoading = pairingUrl.isBlank() && isLoading && statusTone == StatusTone.Loading
    return if (shouldKeepPairingLoading) this else copy(status = "", statusTone = StatusTone.Neutral)
  }

  fun submitDirectLink() {
    val folderUrl = uiState.directLink.trim()
    if (folderUrl.isBlank()) {
      uiState = uiState.copy(
        status = "Paste a Google Drive folder link first.",
        statusTone = StatusTone.Error
      )
      return
    }

    viewModelScope.launch {
      loadFolder(
        folderUrl = folderUrl,
        isTemporary = true
      )
    }
  }

  private suspend fun loadFolder(
    folderUrl: String,
    isTemporary: Boolean = false,
  ) {
    stopEventPresentationRefresh()
    uiState = uiState.copy(
      isLoading = true,
      status = "Loading your folder and getting photos ready…",
      statusTone = StatusTone.Loading
    )
    runCatching {
      repository.loadFolder(folderUrl)
    }.onSuccess { response ->
      val folders = flattenFolders(response.tree).ifEmpty {
        listOf(
          FolderSummary(
            id = response.tree.id,
            name = response.tree.name,
            path = response.tree.name,
            images = response.tree.images.map(repository::toPhotoAsset)
          )
        )
      }

      val selectedFolder = folders.firstOrNull()
      val nextScreen = if (folders.size > 1) TvScreen.Folders else TvScreen.Gallery
      uiState = uiState.copy(
        isLoading = false,
        status = "",
        statusTone = StatusTone.Neutral,
        folders = folders,
        selectedFolder = selectedFolder,
        albumCoverBackgroundUrl = resolvePresentationCoverBackground(
          folders = folders,
          explicitCover = ""
        ),
        albumPresentationOverlayColor = if (isTemporary) "#FFFFFF" else "",
        isTemporaryAlbumPresentationMode = isTemporary,
        images = selectedFolder?.images.orEmpty(),
        screen = nextScreen,
        gallerySettingsVisible = false,
        isEventPresentationMode = false,
        isAlbumPresentationMode = false,
        albumPresentationBackgroundUrl = "",
        eventPresentationTitle = "",
        eventPresentationSlug = "",
        eventPresentationBackgroundUrl = ""
      )
    }.onFailure {
      uiState = uiState.copy(
        isLoading = false,
        status = it.message ?: "We couldn’t load that folder right now.",
        statusTone = StatusTone.Error
      )
    }
  }

  fun openFolder(folder: FolderSummary) {
    stopEventPresentationRefresh()
    uiState = uiState.copy(
      selectedFolder = folder,
      albumCoverBackgroundUrl = uiState.albumCoverBackgroundUrl,
      images = folder.images,
      screen = TvScreen.Gallery,
      gallerySettingsVisible = false,
      status = "",
      statusTone = StatusTone.Neutral,
      isEventPresentationMode = false,
      isAlbumPresentationMode = false,
      albumPresentationBackgroundUrl = "",
      eventPresentationTitle = "",
      eventPresentationSlug = "",
      eventPresentationBackgroundUrl = ""
    )
  }

  fun openSlideshow(index: Int) {
    val clampedIndex = index.coerceIn(0, uiState.images.lastIndex.coerceAtLeast(0))
    val target = uiState.images.getOrNull(clampedIndex)
    if (target != null && target.mimeType.equals("video/youtube", ignoreCase = true)) {
      val playbackUrl = target.fullUrl.ifBlank { target.slideshowUrl }
      if (playbackUrl.isNotBlank()) {
        uiState = uiState.copy(
          currentSlideIndex = clampedIndex,
          screen = TvScreen.YouTubePlayer,
          youtubePlaybackUrl = playbackUrl,
          youtubePlaybackTitle = target.name,
          autoplayEnabled = false,
          slideshowChromeVisible = true,
      slideshowSettingsVisible = false,
      inlineVideoPlaybackApprovedId = null,
      videoPlayerPromptDismissedId = target.id,
      isAlbumPresentationMode = false,
      albumPresentationBackgroundUrl = "",
      albumPresentationOverlayColor = "",
      isTemporaryAlbumPresentationMode = false,
        )
      }
      return
    }
    uiState = uiState.copy(
      currentSlideIndex = clampedIndex,
      screen = TvScreen.Slideshow,
      autoplayEnabled = true,
      slideshowChromeVisible = false,
      slideshowSettingsVisible = false,
      inlineVideoPlaybackApprovedId = null,
      videoPlayerPromptDismissedId = null,
      isAlbumPresentationMode = false,
      albumPresentationBackgroundUrl = "",
      albumPresentationOverlayColor = "",
      isTemporaryAlbumPresentationMode = false,
    )
  }

  fun openAlbumPresentation() {
    stopEventPresentationRefresh()
    val pool = uiState.folders
      .flatMap { folder -> folder.images }
      .filterNot { it.isVideo }
      .ifEmpty { uiState.images.filterNot { it.isVideo } }

    if (pool.isEmpty()) {
      uiState = uiState.copy(
        status = "No photos are ready for presentation yet.",
        statusTone = StatusTone.Error
      )
      return
    }

    val backgroundUrl = resolvePresentationCoverBackground(
      folders = uiState.folders,
      explicitCover = uiState.albumCoverBackgroundUrl
    )

    uiState = uiState.copy(
      images = pool.shuffled(),
      currentSlideIndex = 0,
      screen = TvScreen.Slideshow,
      autoplayEnabled = true,
      slideshowChromeVisible = false,
      slideshowSettingsVisible = false,
      gallerySettingsVisible = false,
      inlineVideoPlaybackApprovedId = null,
      videoPlayerPromptDismissedId = null,
      isEventPresentationMode = false,
      eventPresentationTitle = "",
      eventPresentationSlug = "",
      eventPresentationBackgroundUrl = "",
      isAlbumPresentationMode = true,
      albumPresentationBackgroundUrl = backgroundUrl,
      albumPresentationOverlayColor = uiState.albumPresentationOverlayColor,
      isTemporaryAlbumPresentationMode = uiState.isTemporaryAlbumPresentationMode,
      albumPresentationReturnScreen = uiState.screen,
      status = "",
      statusTone = StatusTone.Neutral
    )
  }

  fun showPreviousSlide() {
    if (uiState.images.isEmpty()) return
    val nextIndex = if (uiState.loopEnabled) {
      (uiState.currentSlideIndex - 1 + uiState.images.size) % uiState.images.size
    } else {
      (uiState.currentSlideIndex - 1).coerceAtLeast(0)
    }
    uiState = uiState.copy(
      currentSlideIndex = nextIndex,
      inlineVideoPlaybackApprovedId = null,
      videoPlayerPromptDismissedId = null
    )
  }

  fun showNextSlide() {
    if (uiState.images.isEmpty()) return
    val nextIndex = if (uiState.loopEnabled) {
      (uiState.currentSlideIndex + 1) % uiState.images.size
    } else {
      (uiState.currentSlideIndex + 1).coerceAtMost(uiState.images.lastIndex)
    }
    uiState = uiState.copy(
      currentSlideIndex = nextIndex,
      inlineVideoPlaybackApprovedId = null,
      videoPlayerPromptDismissedId = null
    )
  }

  fun toggleAutoplay() {
    uiState = uiState.copy(autoplayEnabled = !uiState.autoplayEnabled)
  }

  fun togglePlayVideosInSlideshow() {
    uiState = uiState.copy(
      playVideosInSlideshow = !uiState.playVideosInSlideshow,
      inlineVideoPlaybackApprovedId = null,
      videoPlayerPromptDismissedId = null
    )
  }

  fun toggleSlideshowPlayback() {
    val nextPlaying = !uiState.autoplayEnabled
    uiState = uiState.copy(
      autoplayEnabled = nextPlaying,
      slideshowChromeVisible = !nextPlaying,
      slideshowSettingsVisible = false
    )
  }

  fun toggleLoop() {
    uiState = uiState.copy(loopEnabled = !uiState.loopEnabled)
  }

  fun allowCurrentVideoInlinePlayback() {
    val currentId = uiState.currentSlide?.id ?: return
    uiState = uiState.copy(
      inlineVideoPlaybackApprovedId = currentId,
      autoplayEnabled = true,
      slideshowChromeVisible = false,
      videoPlayerPromptDismissedId = null
    )
  }

  fun dismissCurrentVideoPlayerPrompt() {
    val currentId = uiState.currentSlide?.id ?: return
    uiState = uiState.copy(
      slideshowChromeVisible = !uiState.autoplayEnabled,
      videoPlayerPromptDismissedId = currentId
    )
  }

  fun openCurrentVideoInPlayer() {
    val currentId = uiState.currentSlide?.id ?: return
    if (uiState.currentSlide?.isVideo != true) return
    uiState = uiState.copy(
      screen = TvScreen.VideoPlayer,
      autoplayEnabled = false,
      slideshowChromeVisible = true,
      videoPlayerPromptDismissedId = currentId
    )
  }

  fun closeVideoPlayer() {
    uiState = uiState.copy(
      screen = TvScreen.Slideshow,
      autoplayEnabled = false,
      slideshowChromeVisible = true
    )
  }

  fun closeYouTubePlayer() {
    uiState = uiState.copy(
      screen = TvScreen.Gallery,
      youtubePlaybackUrl = "",
      youtubePlaybackTitle = "",
      autoplayEnabled = false,
      slideshowChromeVisible = true,
      slideshowSettingsVisible = false
    )
  }

  fun changeDuration(delta: Int) {
    uiState = uiState.copy(durationSeconds = (uiState.durationSeconds + delta).coerceIn(2, 15))
  }

  fun toggleGallerySettings() {
    uiState = uiState.copy(gallerySettingsVisible = !uiState.gallerySettingsVisible)
  }

  fun toggleSlideshowSettings() {
    uiState = uiState.copy(
      slideshowSettingsVisible = !uiState.slideshowSettingsVisible,
      slideshowChromeVisible = true
    )
  }

  fun showSlideshowChrome() {
    uiState = uiState.copy(slideshowChromeVisible = true)
  }

  fun hideSlideshowChrome() {
    uiState = uiState.copy(slideshowChromeVisible = false)
  }

  fun onBack() {
    uiState = when (uiState.screen) {
      TvScreen.Home -> uiState
      TvScreen.DirectLink -> uiState.copy(screen = TvScreen.Home, status = "", statusTone = StatusTone.Neutral)
      TvScreen.Folders -> uiState.copy(screen = TvScreen.Home, status = "", statusTone = StatusTone.Neutral)
      TvScreen.Gallery -> if (uiState.folders.size > 1) {
        uiState.copy(screen = TvScreen.Folders, gallerySettingsVisible = false)
      } else {
        uiState.copy(screen = TvScreen.Home, gallerySettingsVisible = false)
      }
      TvScreen.Slideshow -> if (uiState.isEventPresentationMode) {
        stopEventPresentationRefresh()
        uiState.copy(
          screen = TvScreen.Home,
          autoplayEnabled = false,
          slideshowChromeVisible = true,
          slideshowSettingsVisible = false,
          inlineVideoPlaybackApprovedId = null,
          videoPlayerPromptDismissedId = null,
          isEventPresentationMode = false,
          eventPresentationTitle = "",
          eventPresentationSlug = "",
          eventPresentationBackgroundUrl = "",
          images = emptyList(),
          status = "",
          statusTone = StatusTone.Neutral
        )
      } else if (uiState.isAlbumPresentationMode) {
        uiState.copy(
          screen = uiState.albumPresentationReturnScreen,
          autoplayEnabled = false,
          slideshowChromeVisible = true,
          slideshowSettingsVisible = false,
          inlineVideoPlaybackApprovedId = null,
          videoPlayerPromptDismissedId = null,
          isAlbumPresentationMode = false,
          albumPresentationBackgroundUrl = "",
        )
      } else uiState.copy(
        screen = TvScreen.Gallery,
        autoplayEnabled = false,
        slideshowChromeVisible = true,
        slideshowSettingsVisible = false,
        inlineVideoPlaybackApprovedId = null,
        videoPlayerPromptDismissedId = null
      )
      TvScreen.VideoPlayer -> uiState.copy(
        screen = TvScreen.Slideshow,
        autoplayEnabled = false,
        slideshowChromeVisible = true,
        slideshowSettingsVisible = false
      )
      TvScreen.YouTubePlayer -> uiState.copy(
        screen = TvScreen.Gallery,
        youtubePlaybackUrl = "",
        youtubePlaybackTitle = "",
        autoplayEnabled = false,
        slideshowChromeVisible = true,
        slideshowSettingsVisible = false
      )
    }
  }

  private fun startEventPresentationRefresh() {
    stopEventPresentationRefresh()
    val slug = uiState.eventPresentationSlug.trim()
    if (slug.isBlank()) {
      return
    }

    eventPresentationRefreshJob = viewModelScope.launch {
      while (isActive) {
        delay(5_000)
        val activeSlug = uiState.eventPresentationSlug.trim()
        if (!uiState.isEventPresentationMode || activeSlug.isBlank()) {
          break
        }

        runCatching {
          repository.fetchEventPresentation(activeSlug)
        }.onSuccess { refreshed ->
          val currentPhotoId = uiState.currentSlide?.id
          val nextPhotos = refreshed.photos
          val nextIndex = if (currentPhotoId.isNullOrBlank()) {
            0
          } else {
            nextPhotos.indexOfFirst { it.id == currentPhotoId }.takeIf { it >= 0 } ?: 0
          }

          uiState = uiState.copy(
            images = nextPhotos,
            currentSlideIndex = nextIndex.coerceAtMost(nextPhotos.lastIndex.coerceAtLeast(0)),
            eventPresentationTitle = refreshed.name,
            eventPresentationSlug = refreshed.slug,
            eventPresentationBackgroundUrl = refreshed.backgroundUrl
          )
        }
      }
    }
  }

  private fun stopEventPresentationRefresh() {
    eventPresentationRefreshJob?.cancel()
    eventPresentationRefreshJob = null
  }

  private fun flattenFolders(node: FolderNode, parentPath: String = ""): List<FolderSummary> {
    val path = if (parentPath.isBlank()) node.name else "$parentPath/${node.name}"
    val result = mutableListOf<FolderSummary>()
    val currentImages = node.images.map(repository::toPhotoAsset)

    if (currentImages.isNotEmpty()) {
      result += FolderSummary(
        id = node.id,
        name = node.name,
        path = path,
        images = currentImages
      )
    }

    node.folders.forEach { child ->
      result += flattenFolders(child, path)
    }

    return result
  }

  private fun flattenSnapshotFolders(snapshot: AlbumSnapshotPayload): List<FolderSummary> {
    val baseFolders = snapshot.folders.mapNotNull { folder ->
      val path = folder.path.ifBlank { folder.name }
      val images = folder.images.mapNotNull { image ->
        val id = image.id.trim()
        if (id.isBlank()) {
          return@mapNotNull null
        }

        PhotoAsset(
          id = id,
          name = image.name,
          path = image.path.ifBlank { path },
          mimeType = image.mimeType,
          thumbnailUrl = repository.makeAbsolute(image.thumbnailUrl.ifBlank { image.url }),
          slideshowUrl = repository.makeAbsolute(image.slideshowUrl.ifBlank { image.url }),
          fullUrl = repository.makeAbsolute(image.url),
        )
      }

      if (folder.id.isBlank() || images.isEmpty()) {
        null
      } else {
        FolderSummary(
          id = folder.id,
          name = folder.name,
          path = path,
          images = images
        )
      }
    }

    val youtubeFolder = buildYouTubeFolderSummary(snapshot)
    return if (youtubeFolder == null) baseFolders else baseFolders + youtubeFolder
  }

  private fun buildYouTubeFolderSummary(snapshot: AlbumSnapshotPayload): FolderSummary? {
    if (snapshot.youtubeLinks.isEmpty()) {
      return null
    }

    val videos = snapshot.youtubeLinks.mapIndexedNotNull { index, link ->
      if (!link.validated && link.title.isBlank() && link.thumbnailUrl.isBlank()) {
        return@mapIndexedNotNull null
      }
      val videoId = youtubeVideoIdFromRaw(link.url)
      if (videoId.isBlank()) {
        return@mapIndexedNotNull null
      }
      val title = link.title.trim().ifBlank { "Video ${index + 1}" }
      val watchUrl = "https://www.youtube.com/watch?v=$videoId"
      val thumbnail = link.thumbnailUrl.trim().ifBlank { "https://i.ytimg.com/vi/$videoId/hqdefault.jpg" }
      PhotoAsset(
        id = "youtube-$videoId-$index",
        name = title,
        path = "Videos",
        mimeType = "video/youtube",
        thumbnailUrl = thumbnail,
        slideshowUrl = watchUrl,
        fullUrl = watchUrl,
      )
    }

    if (videos.isEmpty()) {
      return null
    }

    return FolderSummary(
      id = "__youtube_videos__",
      name = "Videos",
      path = "Videos",
      images = videos
    )
  }

  class Factory(
    private val repository: DriveDeckRepository,
    private val initialPairingUrl: String = "",
    private val lastUsedCodeStore: LastUsedCodeStore,
  ) : ViewModelProvider.Factory {
    @Suppress("UNCHECKED_CAST")
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
      return DriveDeckViewModel(repository, initialPairingUrl, lastUsedCodeStore) as T
    }
  }
}

class LastUsedCodeStore(private val context: Context) {
  private val preferences = context.getSharedPreferences("carnivalstories_tv", Context.MODE_PRIVATE)

  fun get(): String = preferences.getString("last_used_pairing_code", "")?.trim().orEmpty()

  fun set(code: String) {
    preferences.edit().putString("last_used_pairing_code", code.trim()).apply()
  }
}

data class FolderSummary(
  val id: String,
  val name: String,
  val path: String,
  val images: List<PhotoAsset>,
)

data class PhotoAsset(
  val id: String,
  val name: String,
  val path: String,
  val mimeType: String,
  val thumbnailUrl: String,
  val slideshowUrl: String,
  val fullUrl: String,
) {
  val isVideo: Boolean
    get() = mimeType.startsWith("video/")
}

sealed interface PairingResolution {
  data class Folder(
    val url: String,
    val isPermanent: Boolean = false,
  ) : PairingResolution
  data class Snapshot(
    val snapshot: AlbumSnapshotPayload,
    val folderUrl: String = "",
    val coverBackgroundUrl: String = "",
    val studioBackgroundColor: String = "",
  ) : PairingResolution
  data class EventPresentation(
    val name: String,
    val slug: String,
    val photos: List<PhotoAsset>,
    val backgroundUrl: String = "",
  ) : PairingResolution
}

class DriveDeckRepository(
  private val baseUrl: String,
  private val pairingUrlOverride: String = "",
) {
  private val client = OkHttpClient()
  private val json = Json { ignoreUnknownKeys = true }
  @Volatile
  private var activeBaseUrl: String = baseUrl.trimEnd('/')
  private val fallbackBaseUrls: List<String> = listOf(
    baseUrl,
    "https://carnivalshowcase.kaustubhmokashi.com",
    "https://carnivalshowcase.kaustubmokashi.com",
  )
    .map { it.trim() }
    .filter { it.isNotBlank() }
    .map { it.trimEnd('/') }
    .distinct()

  suspend fun fetchPairingUrl(): String = withContext(Dispatchers.IO) {
    val explicit = pairingUrlOverride.trim()
    if (explicit.isNotBlank()) {
      return@withContext explicit
    }
    requestWithBaseUrlFallback("/api/pairing-origin") { response ->
      val parsed = json.decodeFromString<PairingOriginResponse>(response)
      "${parsed.origin.trimEnd('/')}/remote-tv"
    }
  }

  suspend fun resolvePairing(code: String): PairingResolution = withContext(Dispatchers.IO) {
    requestWithBaseUrlFallback("/api/pairing/resolve?code=${urlEncode(code)}") { response ->
      val parsed = json.decodeFromString<PairingResolveResponse>(response)
      when {
        parsed.mode == "event-presentation" -> {
          PairingResolution.EventPresentation(
            name = parsed.eventName.orEmpty().ifBlank { "Event" },
            slug = parsed.eventSlug.orEmpty(),
            photos = parsed.eventPhotos.orEmpty().map { photo -> toPhotoAsset(photo) },
            backgroundUrl = parsed.eventBackgroundUrl.orEmpty().trim().let { bg ->
              if (bg.isBlank()) "" else makeAbsolute(bg)
            }
          )
        }

        parsed.mode == "snapshot" && parsed.snapshot != null -> {
          PairingResolution.Snapshot(
            snapshot = parsed.snapshot,
            folderUrl = parsed.folderUrl.orEmpty(),
            coverBackgroundUrl = resolveSnapshotCoverBackground(parsed.snapshot),
            studioBackgroundColor = parsed.pageBackgroundColor.orEmpty().trim(),
          )
        }

        !parsed.url.isNullOrBlank() -> PairingResolution.Folder(
          url = parsed.url,
          isPermanent = parsed.permanent
        )
        else -> error("This code has no Drive link yet.")
      }
    }
  }

  suspend fun loadFolder(folderUrl: String): FolderTreeResponse = withContext(Dispatchers.IO) {
    requestWithBaseUrlFallback("/api/folder?includeVideos=1&url=${urlEncode(folderUrl)}") { response ->
      json.decodeFromString<FolderTreeResponse>(response)
    }
  }

  suspend fun fetchEventPresentation(slug: String): PairingResolution.EventPresentation = withContext(Dispatchers.IO) {
    requestWithBaseUrlFallback("/api/events/public?slug=${urlEncode(slug)}") { response ->
      val parsed = json.decodeFromString<EventPublicResponse>(response)
      val event = parsed.event
      PairingResolution.EventPresentation(
        name = event.name.ifBlank { "Event" },
        slug = event.slug.ifBlank { slug },
        photos = event.livePhotos.map(::toPhotoAsset),
        backgroundUrl = event.backgroundUrl.trim().let { bg ->
          if (bg.isBlank()) "" else makeAbsolute(bg)
        }
      )
    }
  }

  fun toPhotoAsset(image: ImageNode): PhotoAsset = PhotoAsset(
    id = image.id,
    name = image.name,
    path = image.path.ifBlank { "Root folder" },
    mimeType = image.mimeType,
    thumbnailUrl = makeAbsolute(image.thumbnailUrl),
    slideshowUrl = makeAbsolute(image.slideshowUrl.ifBlank { image.url }),
    fullUrl = makeAbsolute(image.url),
  )

  fun toPhotoAsset(photo: EventPhotoPayload): PhotoAsset = PhotoAsset(
    id = photo.id,
    name = photo.name,
    path = "Live event photos",
    mimeType = photo.mimeType,
    thumbnailUrl = makeAbsolute(photo.thumbnailUrl.ifBlank { photo.fullUrl }),
    slideshowUrl = makeAbsolute(photo.slideshowUrl.ifBlank { photo.fullUrl }),
    fullUrl = makeAbsolute(photo.fullUrl),
  )

  internal fun makeAbsolute(path: String): String {
    if (path.startsWith("http://") || path.startsWith("https://")) {
      return path
    }
    return "$activeBaseUrl$path"
  }

  private fun <T> requestWithBaseUrlFallback(path: String, parser: (String) -> T): T {
    var lastError: Throwable? = null
    val preferred = listOf(activeBaseUrl) + fallbackBaseUrls.filter { it != activeBaseUrl }
    for (candidateBaseUrl in preferred) {
      try {
        val request = Request.Builder()
          .url("$candidateBaseUrl$path")
          .get()
          .build()
        client.newCall(request).execute().use { response ->
          val body = response.body?.string().orEmpty()
          if (!response.isSuccessful) {
            throw IllegalStateException(extractError(body))
          }
          activeBaseUrl = candidateBaseUrl
          return parser(body)
        }
      } catch (error: Throwable) {
        lastError = error
        if (!isDnsResolutionError(error)) {
          throw error
        }
      }
    }
    throw lastError ?: IllegalStateException("Unable to reach server.")
  }

  private fun isDnsResolutionError(error: Throwable): Boolean {
    var current: Throwable? = error
    while (current != null) {
      if (current is UnknownHostException) {
        return true
      }
      current = current.cause
    }
    return error.message?.contains("Unable to resolve host", ignoreCase = true) == true
  }

  private fun extractError(body: String): String {
    val rawMessage = runCatching {
      json.decodeFromString<ErrorResponse>(body).error
    }.getOrDefault("Request failed.")
    return normalizeErrorMessage(rawMessage)
  }

  private fun resolveSnapshotCoverBackground(snapshot: AlbumSnapshotPayload): String {
    val explicitCover = snapshot.coverImageUrl.ifBlank { snapshot.coverThumbnailUrl }.trim()
    if (explicitCover.isNotBlank()) {
      return makeAbsolute(explicitCover)
    }

    val coverId = snapshot.coverFileId.trim()
    if (coverId.isNotBlank()) {
      snapshot.folders.forEach { folder ->
        val match = folder.images.firstOrNull { image -> image.id.trim() == coverId }
        if (match != null) {
          return makeAbsolute(match.slideshowUrl.ifBlank { match.url })
        }
      }
    }

    return ""
  }

  private fun normalizeErrorMessage(message: String): String {
    val normalized = message.trim()

    if (
      normalized.contains("Drive metadata request failed (404)", ignoreCase = true) ||
      normalized.contains("Drive metadata request failed (403)", ignoreCase = true) ||
      normalized.contains("File not found", ignoreCase = true) ||
      normalized.contains("notFound", ignoreCase = true) ||
      normalized.contains("insufficient permissions", ignoreCase = true) ||
      normalized.contains("insufficientFilePermissions", ignoreCase = true)
    ) {
      return "This Google Drive folder is no longer available. It may have been deleted, moved, or its sharing permissions may have changed. Please generate a new code with a folder shared as 'Anyone with the link' and Viewer access."
    }

    return normalized
  }

  private fun urlEncode(value: String): String = URLEncoder.encode(value, "UTF-8")
}

@Serializable
data class FolderTreeResponse(
  val tree: FolderNode,
)

@Serializable
data class FolderNode(
  val id: String,
  val name: String,
  val folders: List<FolderNode> = emptyList(),
  val images: List<ImageNode> = emptyList(),
)

@Serializable
data class ImageNode(
  val id: String,
  val name: String,
  val mimeType: String,
  val path: String = "",
  val url: String,
  val slideshowUrl: String = "",
  @SerialName("thumbnailUrl") val thumbnailUrl: String,
)

@Serializable
data class ResolveCodeResponse(
  val code: String,
  val url: String,
  val ready: Boolean,
)

@Serializable
data class PairingResolveResponse(
  val code: String,
  val mode: String = "folder",
  val url: String? = null,
  val ready: Boolean = false,
  val permanent: Boolean = false,
  val source: String = "",
  val folderName: String = "",
  val folderUrl: String? = null,
  val snapshot: AlbumSnapshotPayload? = null,
  val eventSlug: String? = null,
  val eventName: String? = null,
  val eventPhotos: List<EventPhotoPayload>? = null,
  val eventBackgroundUrl: String? = null,
  val pageBackgroundColor: String? = null,
)

@Serializable
data class EventPublicResponse(
  val event: EventPublicPayload = EventPublicPayload(),
)

@Serializable
data class EventPublicPayload(
  val slug: String = "",
  val name: String = "",
  val backgroundUrl: String = "",
  val livePhotos: List<EventPhotoPayload> = emptyList(),
)

@Serializable
data class EventPhotoPayload(
  val id: String = "",
  val name: String = "",
  val mimeType: String = "",
  @SerialName("thumbnailUrl") val thumbnailUrl: String = "",
  @SerialName("slideshowUrl") val slideshowUrl: String = "",
  @SerialName("fullUrl") val fullUrl: String = "",
)

@Serializable
data class AlbumSnapshotPayload(
  val version: Int = 1,
  val rootName: String = "",
  val folderCount: Int = 0,
  val mediaCount: Int = 0,
  val generatedAt: String = "",
  val coverFileId: String = "",
  val coverImageUrl: String = "",
  val coverThumbnailUrl: String = "",
  val includeYoutubeVideosFolder: Boolean = false,
  val youtubeLinks: List<SnapshotYoutubeLink> = emptyList(),
  val folders: List<SnapshotFolder> = emptyList(),
)

@Serializable
data class SnapshotYoutubeLink(
  val url: String = "",
  val title: String = "",
  @SerialName("thumbnailUrl") val thumbnailUrl: String = "",
  val validated: Boolean = false,
)

@Serializable
data class SnapshotFolder(
  val id: String = "",
  val name: String = "",
  val path: String = "",
  val images: List<SnapshotImage> = emptyList(),
)

@Serializable
data class SnapshotImage(
  val id: String = "",
  val name: String = "",
  val mimeType: String = "",
  val path: String = "",
  val url: String = "",
  val slideshowUrl: String = "",
  @SerialName("thumbnailUrl") val thumbnailUrl: String = "",
)

@Serializable
data class PairingOriginResponse(
  val origin: String,
)

@Serializable
data class ErrorResponse(
  val error: String,
)
