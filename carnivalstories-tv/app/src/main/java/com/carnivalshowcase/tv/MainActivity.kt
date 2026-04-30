package com.carnivalshowcase.tv

import android.content.Context
import android.os.Bundle
import android.graphics.Bitmap
import android.media.MediaMetadataRetriever
import androidx.activity.ComponentActivity
import androidx.activity.compose.BackHandler
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
import androidx.compose.material.icons.filled.PresentToAll
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
import androidx.compose.ui.draw.shadow
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
import com.google.zxing.BarcodeFormat
import com.google.zxing.EncodeHintType
import com.google.zxing.qrcode.QRCodeWriter
import androidx.media3.common.MediaItem
import androidx.media3.common.Player
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.ui.AspectRatioFrameLayout
import androidx.media3.ui.PlayerView
import java.net.URLEncoder
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
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)

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
          DriveDeckApp(viewModel)
        }
      }
    }
  }
}

@Composable
private fun DriveDeckApp(viewModel: DriveDeckViewModel) {
  var showSplash by remember { mutableStateOf(true) }
  val state = viewModel.uiState

  LaunchedEffect(Unit) {
    delay(6000)
    showSplash = false
  }

  if (showSplash) {
    SplashScreen()
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
  }
}

@Composable
private fun SplashScreen() {
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
        .fillMaxWidth(0.34f)
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
        Icon(Icons.Default.PresentToAll, contentDescription = "Open presentation", tint = TextPrimary)
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
          Icon(Icons.Default.PresentToAll, contentDescription = "Open presentation", tint = TextPrimary)
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
    AppBackground.copy(alpha = 0.8f)
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
    // Immediate fallback background to avoid delayed appearance on slow networks.
    AsyncImage(
      model = if (backgroundUrl.isNotBlank()) backgroundUrl else displayedSlide.thumbnailUrl,
      contentDescription = null,
      contentScale = ContentScale.Crop,
      modifier = Modifier.fillMaxSize()
    )
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
        val exit = slideOutHorizontally(
          animationSpec = tween(740),
          targetOffsetX = { fullWidth -> transition.outX(fullWidth) }
        ) + slideOutVertically(
          animationSpec = tween(740),
          targetOffsetY = { fullHeight -> transition.outY(fullHeight) }
        ) + fadeOut(
          animationSpec = tween(280)
        )
        enter togetherWith exit using SizeTransform(clip = false)
      }
    ) { targetSlide ->
      BoxWithConstraints(
        modifier = Modifier.fillMaxSize(),
        contentAlignment = Alignment.Center
      ) {
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
            .shadow(elevation = 26.dp, shape = RoundedCornerShape(12.dp), clip = false)
            .clip(RoundedCornerShape(12.dp))
            .background(Color.White)
            .padding(12.dp)
        ) {
          SubcomposeAsyncImage(
            model = targetSlide.slideshowUrl.ifBlank { targetSlide.fullUrl },
            contentDescription = targetSlide.name,
            contentScale = ContentScale.Fit,
            modifier = Modifier
              .fillMaxSize()
              .clip(RoundedCornerShape(12.dp))
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
  val albumPresentationReturnScreen: TvScreen = TvScreen.Gallery,
  val eventPresentationTitle: String = "",
  val eventPresentationSlug: String = "",
  val eventPresentationBackgroundUrl: String = "",
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
            albumCoverBackgroundUrl = resolution.coverBackgroundUrl,
            images = selectedFolder?.images.orEmpty(),
            screen = nextScreen,
            gallerySettingsVisible = false
          )
          return
        }

        val fallbackUrl = resolution.folderUrl.trim()
        if (fallbackUrl.isNotBlank()) {
          loadFolder(fallbackUrl)
          return
        }

        uiState = uiState.copy(
          isLoading = false,
          status = "This gallery preview is still being prepared.",
          statusTone = StatusTone.Error
        )
      }

      is PairingResolution.Folder -> loadFolder(resolution.url)
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
      loadFolder(folderUrl)
    }
  }

  private suspend fun loadFolder(folderUrl: String) {
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
        albumCoverBackgroundUrl = "",
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
    uiState = uiState.copy(
      currentSlideIndex = index.coerceIn(0, uiState.images.lastIndex.coerceAtLeast(0)),
      screen = TvScreen.Slideshow,
      autoplayEnabled = true,
      slideshowChromeVisible = false,
      slideshowSettingsVisible = false,
      inlineVideoPlaybackApprovedId = null,
      videoPlayerPromptDismissedId = null,
      isAlbumPresentationMode = false,
      albumPresentationBackgroundUrl = "",
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

    val backgroundUrl = uiState.albumCoverBackgroundUrl.trim()

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
    return snapshot.folders.mapNotNull { folder ->
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
  data class Folder(val url: String) : PairingResolution
  data class Snapshot(
    val snapshot: AlbumSnapshotPayload,
    val folderUrl: String = "",
    val coverBackgroundUrl: String = "",
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

  suspend fun fetchPairingUrl(): String = withContext(Dispatchers.IO) {
    val explicit = pairingUrlOverride.trim()
    if (explicit.isNotBlank()) {
      return@withContext explicit
    }

    val request = Request.Builder()
      .url("$baseUrl/api/pairing-origin")
      .get()
      .build()

    client.newCall(request).execute().use { response ->
      val body = response.body?.string().orEmpty()
      if (!response.isSuccessful) {
        throw IllegalStateException(extractError(body))
      }

      val parsed = json.decodeFromString<PairingOriginResponse>(body)
      "${parsed.origin.trimEnd('/')}/remote-tv"
    }
  }

  suspend fun resolvePairing(code: String): PairingResolution = withContext(Dispatchers.IO) {
    val request = Request.Builder()
      .url("$baseUrl/api/pairing/resolve?code=${urlEncode(code)}")
      .get()
      .build()

    client.newCall(request).execute().use { response ->
      val body = response.body?.string().orEmpty()
      if (!response.isSuccessful) {
        throw IllegalStateException(extractError(body))
      }

      val parsed = json.decodeFromString<PairingResolveResponse>(body)
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
            coverBackgroundUrl = resolveSnapshotCoverBackground(parsed.snapshot)
          )
        }

        !parsed.url.isNullOrBlank() -> PairingResolution.Folder(parsed.url)
        else -> error("This code has no Drive link yet.")
      }
    }
  }

  suspend fun loadFolder(folderUrl: String): FolderTreeResponse = withContext(Dispatchers.IO) {
    val request = Request.Builder()
      .url("$baseUrl/api/folder?includeVideos=1&url=${urlEncode(folderUrl)}")
      .get()
      .build()

    client.newCall(request).execute().use { response ->
      val body = response.body?.string().orEmpty()
      if (!response.isSuccessful) {
        throw IllegalStateException(extractError(body))
      }

      json.decodeFromString<FolderTreeResponse>(body)
    }
  }

  suspend fun fetchEventPresentation(slug: String): PairingResolution.EventPresentation = withContext(Dispatchers.IO) {
    val request = Request.Builder()
      .url("$baseUrl/api/events/public?slug=${urlEncode(slug)}")
      .get()
      .build()

    client.newCall(request).execute().use { response ->
      val body = response.body?.string().orEmpty()
      if (!response.isSuccessful) {
        throw IllegalStateException(extractError(body))
      }

      val parsed = json.decodeFromString<EventPublicResponse>(body)
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
    return "$baseUrl$path"
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
  val folders: List<SnapshotFolder> = emptyList(),
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
