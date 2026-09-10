package com.hallyu.data.remote

import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.contentOrNull

internal fun JsonObject.stringOrNull(key: String): String? =
    (this[key] as? JsonPrimitive)?.contentOrNull

internal fun JsonObject.stringOrEmpty(key: String): String = stringOrNull(key) ?: ""

internal fun JsonObject.intOrNull(key: String): Int? =
    (this[key] as? JsonPrimitive)?.contentOrNull?.toIntOrNull()

internal fun JsonObject.intOrZero(key: String): Int = intOrNull(key) ?: 0

internal fun JsonObject.boolOrNull(key: String): Boolean? =
    (this[key] as? JsonPrimitive)?.contentOrNull?.toBooleanStrictOrNull()

internal fun JsonObject.boolOrFalse(key: String): Boolean = boolOrNull(key) ?: false

internal fun JsonObject.objectOrNull(key: String): JsonObject? = this[key] as? JsonObject

internal fun JsonObject.stringList(key: String): List<String> =
    (this[key] as? JsonArray)?.mapNotNull { (it as? JsonPrimitive)?.contentOrNull } ?: emptyList()

internal fun JsonObject.arrayOrEmpty(key: String): JsonArray =
    this[key] as? JsonArray ?: JsonArray(emptyList())

internal inline fun <T> JsonArray.mapObjects(transform: (JsonObject) -> T): List<T> =
    mapNotNull { it as? JsonObject }.map(transform)
