package com.hallyu.cli

/**
 * Hallyu operations CLI (Spec 34).
 * Skeleton entry point: prints real usage; commands are implemented in milestone M8
 * (setup, migrate, serve, seed, smoke-test, validate, create-admin, token, stats).
 */
object Main {
    private val COMMANDS = listOf(
        "setup        verify environment (DB reachable, migrations dir present)",
        "migrate      apply pending SQL migrations",
        "serve        start the API server (same as backend Main)",
        "seed         insert editorial seed data",
        "smoke-test   run end-to-end API smoke checks against a running server",
        "validate     validate configuration and schema integrity",
        "create-admin promote a user to admin",
        "token        mint a JWT for a user (dev tooling)",
        "stats        print database statistics",
    )

    @JvmStatic
    fun main(args: Array<String>) {
        if (args.isEmpty()) {
            println("Hallyu CLI — K-drama community platform operations")
            println()
            println("Usage: hallyu <command> [options]")
            println()
            println("Commands:")
            COMMANDS.forEach { println("  $it") }
            println()
            println("Commands migrate/serve and friends are wired in milestone M8 (see docs/PLAN.md).")
            kotlin.system.exitProcess(2)
        }
        when (args[0]) {
            else -> {
                println("Unknown command: ${args[0]}")
                println("Run without arguments to see usage.")
                kotlin.system.exitProcess(2)
            }
        }
    }
}
