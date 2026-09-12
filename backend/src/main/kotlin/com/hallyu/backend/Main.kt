package com.hallyu.backend

import com.hallyu.backend.config.AppConfig
import com.hallyu.backend.db.HallyuDb
import com.hallyu.backend.db.Migrations
import com.hallyu.backend.http.hallyuModule
import io.ktor.server.engine.embeddedServer
import io.ktor.server.netty.Netty

fun main() {
    val config = AppConfig.fromEnv()
    HallyuDb.connect(config)
    Migrations.run()
    val server = embeddedServer(Netty, port = config.port, host = config.host) {
        hallyuModule(config)
    }
    server.start(wait = true)
}
