package com.hallyu.app.ui.auth

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavController
import com.hallyu.app.navigation.Routes
import com.hallyu.designsystem.HallyuButton
import com.hallyu.designsystem.HallyuColors
import com.hallyu.designsystem.HallyuOutlinedButton
import com.hallyu.designsystem.HallyuTopBar
import com.hallyu.designsystem.Spacing
import com.hallyu.designsystem.brandGradient
import kotlinx.coroutines.delay

// ---------------------------------------------------------------------------
// Splash
// ---------------------------------------------------------------------------

@Composable
fun SplashScreen(
    navController: NavController,
    viewModel: AuthViewModel = hiltViewModel(),
) {
    val session by viewModel.isSignedIn.collectAsState(initial = false)
    LaunchedEffect(session) {
        delay(1200)
        if (session) {
            navController.navigate(Routes.MAIN) {
                popUpTo(Routes.SPLASH) { inclusive = true }
            }
        } else {
            navController.navigate(Routes.WELCOME) {
                popUpTo(Routes.SPLASH) { inclusive = true }
            }
        }
    }

    Box(
        modifier = Modifier.fillMaxSize().background(HallyuColors.Background),
        contentAlignment = Alignment.Center,
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text(
                text = "Hallyu",
                fontSize = 52.sp,
                fontWeight = FontWeight.Bold,
                color = HallyuColors.OnBackground,
            )
            Spacer(Modifier.height(6.dp))
            Box(
                modifier = Modifier
                    .width(120.dp)
                    .height(5.dp)
                    .clip(CircleShape)
                    .background(brandGradient),
            )
            Spacer(Modifier.height(10.dp))
            Text(
                text = "한류",
                fontSize = 18.sp,
                color = HallyuColors.TextSecondary,
            )
            Spacer(Modifier.height(40.dp))
            Box(
                modifier = Modifier
                    .size(28.dp)
                    .clip(CircleShape)
                    .background(
                        Brush.radialGradient(
                            listOf(HallyuColors.BrandGradientEnd.copy(alpha = 0.6f), HallyuColors.BrandGradientStart.copy(alpha = 0f)),
                        ),
                    ),
            )
        }
    }
}

// ---------------------------------------------------------------------------
// Welcome
// ---------------------------------------------------------------------------

@Composable
fun WelcomeScreen(navController: NavController) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(HallyuColors.Background)
            .verticalScroll(rememberScrollState())
            .padding(Spacing.xl),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Spacer(Modifier.height(60.dp))
        Box(
            modifier = Modifier
                .size(180.dp)
                .clip(CircleShape)
                .background(
                    Brush.radialGradient(
                        listOf(HallyuColors.BrandGradientEnd, HallyuColors.BrandGradientStart, HallyuColors.Background),
                    ),
                ),
            contentAlignment = Alignment.Center,
        ) {
            Text("한류", fontSize = 56.sp, color = HallyuColors.OnBackground)
        }
        Spacer(Modifier.height(Spacing.xl))
        Text(
            text = "Where the Wave Lives",
            style = MaterialTheme.typography.displayLarge,
            textAlign = TextAlign.Center,
        )
        Spacer(Modifier.height(Spacing.md))
        Text(
            text = "The social home for K-drama fandom. Follow your dramas, join episode discussions, and find your people.",
            style = MaterialTheme.typography.bodyLarge,
            color = HallyuColors.TextSecondary,
            textAlign = TextAlign.Center,
        )
        Spacer(Modifier.height(48.dp))
        HallyuButton(text = "Get started", onClick = { navController.navigate(Routes.SIGNUP) })
        Spacer(Modifier.height(Spacing.md))
        HallyuOutlinedButton(text = "Log in", onClick = { navController.navigate(Routes.LOGIN) })
    }
}

// ---------------------------------------------------------------------------
// Sign up / Login / Recovery
// ---------------------------------------------------------------------------

@Composable
fun SignUpScreen(navController: NavController, viewModel: AuthViewModel = hiltViewModel()) {
    AuthFormScaffold(title = "Create your account", onBack = { navController.popBackStack() }) {
        var email by remember { mutableStateOf("") }
        var username by remember { mutableStateOf("") }
        var password by remember { mutableStateOf("") }

        Field("Email", email) { email = it }
        Spacer(Modifier.height(Spacing.md))
        Field("Username", username) { username = it }
        Spacer(Modifier.height(Spacing.md))
        Field("Password", password, secret = true) { password = it }
        Spacer(Modifier.height(Spacing.lg))

        if (viewModel.state.error != null) ErrorText(viewModel.state.error)
        Spacer(Modifier.height(Spacing.md))

        HallyuButton(
            text = "Sign up",
            enabled = !viewModel.state.loading,
            onClick = { viewModel.signUp(email, password, username) },
        )
        Spacer(Modifier.height(Spacing.lg))
        Text(
            text = "Already have an account? Log in",
            style = MaterialTheme.typography.labelMedium,
            color = HallyuColors.BrandGradientEnd,
            modifier = Modifier.fillMaxWidth().clickable { navController.navigate(Routes.LOGIN) },
            textAlign = TextAlign.Center,
        )

        NavigateOnSignIn(navController, viewModel)
    }
}

@Composable
fun LoginScreen(navController: NavController, viewModel: AuthViewModel = hiltViewModel()) {
    AuthFormScaffold(title = "Welcome back", onBack = { navController.popBackStack() }) {
        var email by remember { mutableStateOf("") }
        var password by remember { mutableStateOf("") }

        Field("Email", email) { email = it }
        Spacer(Modifier.height(Spacing.md))
        Field("Password", password, secret = true) { password = it }
        Spacer(Modifier.height(Spacing.sm))
        Text(
            text = "Forgot password?",
            style = MaterialTheme.typography.labelMedium,
            color = HallyuColors.Accent,
            modifier = Modifier.align(Alignment.End).clickable { navController.navigate(Routes.RECOVERY) },
        )
        Spacer(Modifier.height(Spacing.lg))

        if (viewModel.state.error != null) ErrorText(viewModel.state.error)
        Spacer(Modifier.height(Spacing.md))

        HallyuButton(
            text = "Log in",
            enabled = !viewModel.state.loading,
            onClick = { viewModel.login(email, password) },
        )
        Spacer(Modifier.height(Spacing.lg))
        Text(
            text = "New to Hallyu? Sign up",
            style = MaterialTheme.typography.labelMedium,
            color = HallyuColors.BrandGradientEnd,
            modifier = Modifier.fillMaxWidth().clickable { navController.navigate(Routes.SIGNUP) },
            textAlign = TextAlign.Center,
        )

        NavigateOnSignIn(navController, viewModel)
    }
}

@Composable
fun RecoveryScreen(navController: NavController, viewModel: AuthViewModel = hiltViewModel()) {
    AuthFormScaffold(title = "Reset password", onBack = { navController.popBackStack() }) {
        var email by remember { mutableStateOf("") }
        Text(
            text = "Enter your email and we'll send you a reset link.",
            style = MaterialTheme.typography.bodyLarge,
            color = HallyuColors.TextSecondary,
        )
        Spacer(Modifier.height(Spacing.lg))
        Field("Email", email) { email = it }
        Spacer(Modifier.height(Spacing.lg))

        if (viewModel.state.error != null) ErrorText(viewModel.state.error)
        if (viewModel.state.recovered) {
            Text(
                text = "Check your inbox for the reset link.",
                style = MaterialTheme.typography.bodyLarge,
                color = HallyuColors.Success,
            )
        }
        Spacer(Modifier.height(Spacing.md))

        HallyuButton(
            text = "Send reset link",
            enabled = !viewModel.state.loading,
            onClick = { viewModel.recover(email) },
        )
    }
}

// ---------------------------------------------------------------------------
// shared
// ---------------------------------------------------------------------------

@Composable
private fun NavigateOnSignIn(navController: NavController, viewModel: AuthViewModel) {
    LaunchedEffect(viewModel.state.signedIn) {
        if (viewModel.state.signedIn) {
            navController.navigate(Routes.ONBOARDING_INTERESTS) {
                popUpTo(Routes.WELCOME) { inclusive = true }
            }
        }
    }
}

@Composable
private fun AuthFormScaffold(
    title: String,
    onBack: () -> Unit,
    content: @Composable ColumnScope.() -> Unit,
) {
    Column(
        modifier = Modifier.fillMaxSize().background(HallyuColors.Background),
    ) {
        HallyuTopBar(title = title, onBack = onBack)
        Column(
            modifier = Modifier
                .weight(1f)
                .verticalScroll(rememberScrollState())
                .padding(horizontal = Spacing.xl),
        ) {
            Spacer(Modifier.height(Spacing.md))
            content()
        }
    }
}

@Composable
private fun Field(label: String, value: String, secret: Boolean = false, onChange: (String) -> Unit) {
    OutlinedTextField(
        value = value,
        onValueChange = onChange,
        label = { Text(label) },
        singleLine = true,
        visualTransformation = if (secret) PasswordVisualTransformation() else androidx.compose.ui.text.input.VisualTransformation.None,
        modifier = Modifier.fillMaxWidth(),
    )
}

@Composable
private fun ErrorText(error: String?) {
    if (error != null) {
        Text(
            text = error,
            style = MaterialTheme.typography.bodyMedium,
            color = HallyuColors.Accent,
        )
    }
}


