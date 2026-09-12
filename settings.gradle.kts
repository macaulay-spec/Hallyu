pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}

dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}

rootProject.name = "Hallyu"

include(
    ":shared:shared-domain",
    ":shared:shared-data",
    ":shared:shared-ui",
    ":backend",
    ":cli",
    ":androidApp",
)
