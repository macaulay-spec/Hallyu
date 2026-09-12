package com.hallyu.backend.security

import de.mkammerer.argon2.Argon2Factory

/**
 * Argon2id password hashing (Spec §39 / ARCHITECTURE security section).
 */
object Passwords {
    private val argon2 = Argon2Factory.create(Argon2Factory.Argon2Types.ARGON2id)

    fun hash(password: String): String = argon2.hash(65536, 4, 2, password.toCharArray())

    fun verify(hash: String, password: String): Boolean =
        try { argon2.verify(hash, password.toCharArray()) } catch (e: Exception) { false }

    /** Never-used-but-honest constant-time decoy for timing safety on unknown email. */
    fun burnCycles() { argon2.verify("\$argon2id\$v=19\$m=65536,t=4,p=2\$aGVsbG8\$ZA==", "x") }
}
