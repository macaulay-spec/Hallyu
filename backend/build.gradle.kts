import org.jetbrains.kotlin.gradle.dsl.JvmTarget

plugins {
    alias(libs.plugins.kotlin.jvm)
    alias(libs.plugins.kotlin.serialization)
    application
}

kotlin {
    compilerOptions {
        jvmTarget.set(JvmTarget.JVM_17)
    }
}

dependencies {
    // Config + JSON
    implementation(libs.kotlinx.serialization.json)
    implementation(libs.kotlinx.coroutines.core)

    // Ktor server
    implementation(libs.bundles.ktor.server)
    implementation(libs.logback)

    // Database
    implementation(libs.bundles.exposed)

    // Security
    implementation(libs.java.jwt)
    implementation(libs.argon2)

    // Tests
    testImplementation(libs.kotlin.test.junit)
    testImplementation(libs.ktor.server.test.host)
    testImplementation(libs.bundles.exposed)
}

application {
    mainClass.set("com.hallyu.MainKt")
}

tasks.jar {
    manifest {
        attributes["Main-Class"] = "com.hallyu.MainKt"
    }
    duplicatesStrategy = DuplicatesStrategy.EXCLUDE
    from(configurations.runtimeClasspath.get().map { if (it.isDirectory) it else zipTree(it) })
    exclude("META-INF/*.RSA", "META-INF/*.SF", "META-INF/*.DSA")
}

tasks.test {
    // Integration tests talk to a real Postgres (see backend/src/test README).
    environment("HALYU_TEST_DB", System.getenv("HALYU_TEST_DB") ?: "jdbc:postgresql://localhost:5432/hallyu_test?user=postgres&password=hallyu_dev")
}
