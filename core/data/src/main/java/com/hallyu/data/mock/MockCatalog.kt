package com.hallyu.data.mock

import com.hallyu.domain.model.Actor
import com.hallyu.domain.model.AppNotification
import com.hallyu.domain.model.Comment
import com.hallyu.domain.model.Community
import com.hallyu.domain.model.CommunityVisibility
import com.hallyu.domain.model.Drama
import com.hallyu.domain.model.DramaStatus
import com.hallyu.domain.model.Episode
import com.hallyu.domain.model.NotificationType
import com.hallyu.domain.model.Post
import com.hallyu.domain.model.PostCategory
import com.hallyu.domain.model.Profile
import com.hallyu.domain.model.Report
import com.hallyu.domain.model.ReportReason
import com.hallyu.domain.model.ReportStatus
import com.hallyu.domain.model.TrendingTopic
import com.hallyu.domain.model.WatchingStatus

/**
 * In-memory preview catalog — the entire product surface, populated end-to-end so the frontend
 * can be explored without any backend (BLUEPRINT.md §1). All lists are mutable so interactions
 * (like/follow/bookmark) update live during a session.
 */
object MockCatalog {

    val me: Profile = Profile(
        id = "me",
        username = "seoulseeker",
        displayName = "Mina Park",
        bio = "Watching way too many dramas. It's fine. Everything is fine.",
        followerCount = 1284,
        followingCount = 312,
        postCount = 42,
        isFollowed = false,
    )

    val profiles: MutableList<Profile> = mutableListOf(
        me,
        Profile(id = "u_drama_doc", username = "drama.doc", displayName = "Drama Doc", bio = "Reviews & reactions. Ep 12 of everything will break you.", isVerified = true, followerCount = 52_400, followingCount = 180, postCount = 918),
        Profile(id = "u_theory", username = "midnight_theories", displayName = "Midnight Theories", bio = "If it's foreshadowing, I will find it.", followerCount = 31_700, followingCount = 96, postCount = 402),
        Profile(id = "u_hana", username = "hanbok_hana", displayName = "Hana", bio = "Costume design appreciation + soft crying.", followerCount = 9_850, followingCount = 240, postCount = 301),
        Profile(id = "u_bin", username = "binge_bin", displayName = "Binge Bin", bio = "16 episodes in one sitting. No regrets.", followerCount = 4_120, followingCount = 510, postCount = 88),
        Profile(id = "u_ost", username = "ost.archive", displayName = "OST Archive", bio = "Soundtrack collector. Vinyl + streaming.", isVerified = true, followerCount = 18_600, followingCount = 77, postCount = 264),
        Profile(id = "u_official", username = "hallyu_official", displayName = "Hallyu", bio = "Official announcements & release schedules.", isVerified = true, isOfficial = true, followerCount = 1_240_000, followingCount = 12, postCount = 1_022),
        Profile(id = "u_actor", username = "kim_haneul", displayName = "Kim Ha-neul", bio = "Actor. Currently: Moonlit Waves.", isVerified = true, isOfficial = true, followerCount = 2_410_000, followingCount = 88, postCount = 640),
        Profile(id = "u_meme", username = "kdrama_memes", displayName = "K-Drama Memes", bio = "Meme HQ. Chaebol heir and a convenience store.", followerCount = 214_000, followingCount = 34, postCount = 1_540),
    )

    val dramas: MutableList<Drama> = mutableListOf(
        Drama(id = "d1", title = "Moonlit Waves", koreanTitle = "달빛 파도", status = DramaStatus.AIRING, year = 2026, genres = listOf("Romance", "Melodrama"), airsOn = "Sat–Sun", network = "tvN", episodeCount = 16, isFollowed = true, watchingStatus = "WATCHING",
            synopsis = "A marine biologist returns to her seaside hometown and reopens the lighthouse where her first love disappeared ten years ago."),
        Drama(id = "d2", title = "Crimson Vows", koreanTitle = "진홍의 맹세", status = DramaStatus.AIRING, year = 2026, genres = listOf("Thriller", "Mystery"), airsOn = "Wed–Thu", network = "JTBC", episodeCount = 12,
            synopsis = "A prosecutor infiltrates a wedding-planner syndicate whose clients never reach the altar — literally."),
        Drama(id = "d3", title = "Seoul Bloom", koreanTitle = "서울의 봄", status = DramaStatus.COMPLETED, year = 2024, genres = listOf("Romance", "Slice of Life"), airsOn = "Netflix", network = "Netflix", episodeCount = 16,
            synopsis = "Two rival florists on the same street keep accidentally falling for each other's disasters."),
        Drama(id = "d4", title = "The King's Shadow", koreanTitle = "왕의 그림자", status = DramaStatus.COMPLETED, year = 2025, genres = listOf("Historical", "Political"), airsOn = "Mon–Tue", network = "MBC", episodeCount = 20,
            synopsis = "A nameless royal secretary outmaneuvers an entire court to protect a king who never wanted the throne."),
        Drama(id = "d5", title = "Glass Petals", koreanTitle = "유리 꽃잎", status = DramaStatus.AIRING, year = 2026, genres = listOf("Melodrama", "Family"), airsOn = "Sat–Sun", network = "tvN", episodeCount = 16, watchingStatus = "PLAN_TO_WATCH",
            synopsis = "Three sisters inherit a failing glass workshop and the debts — and secrets — that come with it."),
        Drama(id = "d6", title = "Neon Dynasty", koreanTitle = "네온 왕조", status = DramaStatus.UPCOMING, year = 2026, genres = listOf("Sci-Fi", "Action"), airsOn = "Netflix", network = "Netflix", episodeCount = 8,
            synopsis = "In 2089 Seoul, a courier discovers the memories she delivers are being edited by the megacorp that owns the city."),
        Drama(id = "d7", title = "Eternal Spring", koreanTitle = "영원한 봄", status = DramaStatus.UPCOMING, year = 2027, genres = listOf("Romance", "Fantasy"), airsOn = "Fri–Sat", network = "tvN", episodeCount = 12,
            synopsis = "A time-traveling gardener relives the same spring day until she saves the person she loves — without erasing them."),
        Drama(id = "d8", title = "Whispering Tide", koreanTitle = "속삭이는 물결", status = DramaStatus.COMPLETED, year = 2023, genres = listOf("Fantasy", "Romance"), airsOn = "Sat–Sun", network = "tvN", episodeCount = 16,
            synopsis = "A diver who can hear the ocean's memories meets a woman whose every memory the sea has already claimed."),
    )

    val actors: MutableList<Actor> = mutableListOf(
        Actor(id = "a1", name = "Kim Ha-neul", koreanName = "김하늘", bio = "Known for understated, magnetic lead roles.", isFollowed = true, followerCount = 2_410_000),
        Actor(id = "a2", name = "Park Min-jae", koreanName = "박민재", bio = "Scene-stealer turned leading man.", followerCount = 1_880_000),
        Actor(id = "a3", name = "Lee Ji-hoon", koreanName = "이지훈", bio = "Rom-com staple with a theater background.", followerCount = 940_000),
        Actor(id = "a4", name = "Choi Seo-yeon", koreanName = "최서연", bio = "Critically adored for melodrama.", followerCount = 1_120_000),
        Actor(id = "a5", name = "Jung Woo-sung", koreanName = "정우성", bio = "Veteran of 25 years, still sells out.", followerCount = 3_400_000),
        Actor(id = "a6", name = "Bae Su-jin", koreanName = "배수진", bio = "Rising star of the thriller genre.", isFollowed = true, followerCount = 720_000),
        Actor(id = "a7", name = "Kang Do-hyun", koreanName = "강도현", bio = "Action lead, former athlete.", followerCount = 1_050_000),
        Actor(id = "a8", name = "Yoon Chae-won", koreanName = "윤채원", bio = "Beloved for sageuk and fantasy roles.", followerCount = 860_000),
        Actor(id = "a9", name = "Seo Jun-ho", koreanName = "서준호", bio = "Indie darling gone mainstream.", followerCount = 540_000),
        Actor(id = "a10", name = "Han Soo-ah", koreanName = "한수아", bio = "Newcomer with two record-breaking years.", followerCount = 610_000),
    )

    val communities: MutableList<Community> = mutableListOf(
        Community(id = "c1", name = "Moonlit Waves Stans", description = "Weekly live-threads + lighthouse theories.", memberCount = 128_400, visibility = CommunityVisibility.PUBLIC, isJoined = true),
        Community(id = "c2", name = "Theory Central", description = "Foreshadowing, symbolism, and receipts.", memberCount = 96_500, visibility = CommunityVisibility.PUBLIC, isJoined = true),
        Community(id = "c3", name = "OST Appreciation", description = "Soundtrack collectors and cover lovers.", memberCount = 54_200, visibility = CommunityVisibility.PUBLIC, isJoined = false),
        Community(id = "c4", name = "Meme HQ", description = "Chaebol heirs, second leads, and ramyeon.", memberCount = 214_000, visibility = CommunityVisibility.PUBLIC, isJoined = true),
        Community(id = "c5", name = "Sageuk Society", description = "Hanbok, court politics, and joseon lore.", memberCount = 33_100, visibility = CommunityVisibility.PUBLIC, isJoined = false),
        Community(id = "c6", name = "First-Watch Crew", description = "Spoiler-free zone for new viewers.", memberCount = 71_800, visibility = CommunityVisibility.PUBLIC, isJoined = false),
    )

    val posts: MutableList<Post> = mutableListOf(
        Post(
            id = "p1", authorId = "u_theory", author = profiles.first { it.id == "u_theory" },
            text = "Okay so in Ep 8 the lighthouse lamp flickers exactly three times before Hae-won appears. Three. The same three beats as the opening theme. This is not an accident — the sea is counting down.",
            category = PostCategory.THEORY, dramaId = "d1", dramaTitle = "Moonlit Waves", episodeNumber = 8, spoilerLevel = 8,
            likeCount = 4821, commentCount = 391, repostCount = 1204, isLiked = true, createdAt = "2026-09-11T08:42:00Z",
        ),
        Post(
            id = "p2", authorId = "u_drama_doc", author = profiles.first { it.id == "u_drama_doc" },
            text = "Moonlit Waves Ep 8 — the single best episode of television this year. That one-take harbor scene had me holding my breath for four straight minutes. Kim Ha-neul is doing career-best work.",
            category = PostCategory.REACTION, dramaId = "d1", dramaTitle = "Moonlit Waves", episodeNumber = 8, spoilerLevel = 8,
            likeCount = 8940, commentCount = 712, repostCount = 2311, createdAt = "2026-09-11T07:15:00Z",
        ),
        Post(
            id = "p3", authorId = "u_hana", author = profiles.first { it.id == "u_hana" },
            text = "Costume notes from Crimson Vows Ep 5: the bride's hanbok used a 1930s silhouette with a 2026 fabric — silk organza over jacquard. Every wedding is color-coded to the couple's fate and I am losing it.",
            category = PostCategory.FAN_CONTENT, dramaId = "d2", dramaTitle = "Crimson Vows", episodeNumber = 5, spoilerLevel = 5,
            likeCount = 1290, commentCount = 96, repostCount = 210, createdAt = "2026-09-10T22:03:00Z",
        ),
        Post(
            id = "p4", authorId = "u_bin", author = profiles.first { it.id == "u_bin" },
            text = "Just finished Seoul Bloom in one sitting and now I'm sitting in my kitchen at 3am making tteokbokki and reconsidering my whole life. 10/10 would ruin my sleep schedule again.",
            category = PostCategory.RECOMMENDATION, dramaId = "d3", dramaTitle = "Seoul Bloom", episodeNumber = 16,
            likeCount = 3402, commentCount = 188, repostCount = 640, isBookmarked = true, createdAt = "2026-09-10T18:30:00Z",
        ),
        Post(
            id = "p5", authorId = "u_meme", author = profiles.first { it.id == "u_meme" },
            text = "Second lead syndrome is real but have you considered: the THIRD lead who just quietly runs the family café and remembers everyone's order? Justice for Manager Ahn.",
            category = PostCategory.MEME, dramaId = "d1", dramaTitle = "Moonlit Waves", episodeNumber = 7,
            likeCount = 15020, commentCount = 1104, repostCount = 4820, isLiked = true, createdAt = "2026-09-10T15:12:00Z",
        ),
        Post(
            id = "p6", authorId = "u_ost", author = profiles.first { it.id == "u_ost" },
            text = "The Glass Petals score is 40% glass harmonics and 60% strings. Whoever chose to bow a wine glass as a sample — respect. Full breakdown thread inside.",
            category = PostCategory.FAN_CONTENT, dramaId = "d5", dramaTitle = "Glass Petals", episodeNumber = 4, spoilerLevel = 4,
            likeCount = 2110, commentCount = 144, repostCount = 320, createdAt = "2026-09-10T12:44:00Z",
        ),
        Post(
            id = "p7", authorId = "u_drama_doc", author = profiles.first { it.id == "u_drama_doc" },
            text = "Crimson Vows keeps subverting the whodunit every episode and somehow the answer was in the seating chart the whole time. This writer hates us and I respect it.",
            category = PostCategory.REACTION, dramaId = "d2", dramaTitle = "Crimson Vows", episodeNumber = 6, spoilerLevel = 6,
            likeCount = 5610, commentCount = 402, repostCount = 980, createdAt = "2026-09-10T09:58:00Z",
        ),
        Post(
            id = "p8", authorId = "u_official", author = profiles.first { it.id == "u_official" },
            text = "Neon Dynasty premieres November 14, all 8 episodes at once. New teaser drops Friday. Mark your calendars. #NeonDynasty",
            category = PostCategory.NEWS, dramaId = "d6", dramaTitle = "Neon Dynasty",
            likeCount = 22800, commentCount = 1890, repostCount = 6120, createdAt = "2026-09-09T20:00:00Z",
        ),
        Post(
            id = "p9", authorId = "u_theory", author = profiles.first { it.id == "u_theory" },
            text = "Whispering Tide theory that still lives rent-free: the diver never surfaced in Ep 1. Every episode since is the ocean showing him the life he could've had. Re-watch Ep 1 with that in mind and tell me I'm wrong.",
            category = PostCategory.THEORY, dramaId = "d8", dramaTitle = "Whispering Tide", episodeNumber = 16,
            likeCount = 7290, commentCount = 511, repostCount = 1430, createdAt = "2026-09-09T14:20:00Z",
        ),
        Post(
            id = "p10", authorId = "u_actor", author = profiles.first { it.id == "u_actor" },
            text = "Last day of filming Moonlit Waves today. This character taught me how to be quiet on screen. Thank you for watching us every weekend. 🌊",
            category = PostCategory.FAN_CONTENT, dramaId = "d1", dramaTitle = "Moonlit Waves",
            likeCount = 98400, commentCount = 6210, repostCount = 15200, createdAt = "2026-09-09T10:10:00Z",
        ),
        Post(
            id = "p11", authorId = "u_meme", author = profiles.first { it.id == "u_meme" },
            text = "POV: you're the CEO of a chaebol conglomerate but you keep visiting the same pojangmacha because the owner's daughter roasted you once in Ep 2.",
            category = PostCategory.MEME, dramaId = "d4", dramaTitle = "The King's Shadow", episodeNumber = 9,
            likeCount = 11080, commentCount = 890, repostCount = 3210, createdAt = "2026-09-08T19:35:00Z",
        ),
        Post(
            id = "p12", authorId = "u_bin", author = profiles.first { it.id == "u_bin" },
            text = "Question for the group: is it normal to feel personally attacked by a drama about three sisters inheriting a glass workshop? Asking for a friend (the friend is me).",
            category = PostCategory.QUESTION, dramaId = "d5", dramaTitle = "Glass Petals", episodeNumber = 3,
            likeCount = 880, commentCount = 176, repostCount = 90, createdAt = "2026-09-08T11:02:00Z",
        ),
        Post(
            id = "p13", authorId = "u_hana", author = profiles.first { it.id == "u_hana" },
            text = "The King's Shadow costume thread, part 4: the king's robes get progressively DARKER as his authority erodes. By Ep 18 he's wearing almost black. Costuming as character arc, exhibit A.",
            category = PostCategory.FAN_CONTENT, dramaId = "d4", dramaTitle = "The King's Shadow", episodeNumber = 18, spoilerLevel = 18,
            likeCount = 4460, commentCount = 260, repostCount = 730, createdAt = "2026-09-07T16:48:00Z",
        ),
        Post(
            id = "p14", authorId = "u_official", author = profiles.first { it.id == "u_official" },
            text = "Eternal Spring confirms a 2027 broadcast on tvN. More casting news next month. #EternalSpring",
            category = PostCategory.NEWS, dramaId = "d7", dramaTitle = "Eternal Spring",
            likeCount = 12900, commentCount = 820, repostCount = 3010, createdAt = "2026-09-06T21:00:00Z",
        ),
    )

    val comments: MutableList<Comment> = mutableListOf(
        Comment(id = "cm1", postId = "p1", authorId = "u_drama_doc", author = profiles.first { it.id == "u_drama_doc" }, text = "The three beats = the three times she turns back. CONFIRMED.", likeCount = 402, createdAt = "2026-09-11T08:50:00Z"),
        Comment(id = "cm2", postId = "p1", authorId = "u_hana", author = profiles.first { it.id == "u_hana" }, text = "I went back and counted. You're right and I'm scared.", likeCount = 211, createdAt = "2026-09-11T08:55:00Z"),
        Comment(id = "cm3", postId = "p1", authorId = "me", author = me, text = "Rewatching tonight. If this holds up I'm joining the theory.", likeCount = 96, isLiked = true, createdAt = "2026-09-11T09:02:00Z"),
        Comment(id = "cm4", postId = "p2", authorId = "u_meme", author = profiles.first { it.id == "u_meme" }, text = "Four minutes? I paused to breathe and forgot to unpause.", likeCount = 1280, createdAt = "2026-09-11T07:40:00Z"),
        Comment(id = "cm5", postId = "p2", authorId = "me", author = me, text = "Career-best is right. That harbor scene broke me.", likeCount = 240, createdAt = "2026-09-11T08:05:00Z"),
    )

    val notifications: MutableList<AppNotification> = mutableListOf(
        AppNotification(id = "n1", type = NotificationType.EPISODE_RELEASE, title = "Moonlit Waves · Ep 9 is out", body = "New episode just dropped. 12.4k fans are already discussing it.", dramaId = "d1", episodeNumber = 9, createdAt = "2026-09-11T08:00:00Z"),
        AppNotification(id = "n2", type = NotificationType.REPLY, title = "Drama Doc replied to your comment", body = "\"Career-best is right. That harbor scene broke me.\" — +240 likes", actor = profiles.first { it.id == "u_drama_doc" }, postId = "p2", createdAt = "2026-09-11T07:58:00Z"),
        AppNotification(id = "n3", type = NotificationType.MENTION, title = "Hana mentioned you", body = "in a comment on Midnight Theories' post.", actor = profiles.first { it.id == "u_hana" }, postId = "p1", createdAt = "2026-09-11T07:30:00Z"),
        AppNotification(id = "n4", type = NotificationType.TRENDING_POST, title = "Your fandom is blowing up", body = "K-Drama Memes' post hit 15K likes in Moonlit Waves Stans.", actor = profiles.first { it.id == "u_meme" }, postId = "p5", createdAt = "2026-09-10T20:15:00Z"),
        AppNotification(id = "n5", type = NotificationType.COMMUNITY_ANNOUNCEMENT, title = "Moonlit Waves Stans", body = "Live thread opens 1 hour before Ep 9 airs.", createdAt = "2026-09-10T18:00:00Z"),
        AppNotification(id = "n6", type = NotificationType.ACTOR_UPDATE, title = "Kim Ha-neul posted", body = "\"Last day of filming Moonlit Waves today…\"", actor = profiles.first { it.id == "u_actor" }, postId = "p10", createdAt = "2026-09-09T10:12:00Z"),
        AppNotification(id = "n7", type = NotificationType.OFFICIAL_ANNOUNCEMENT, title = "Hallyu", body = "Neon Dynasty premieres November 14. #NeonDynasty", actor = profiles.first { it.id == "u_official" }, postId = "p8", createdAt = "2026-09-09T20:00:00Z"),
        AppNotification(id = "n8", type = NotificationType.SYSTEM, title = "Welcome to Hallyu", body = "Follow dramas and actors to build your For You feed.", read = true, createdAt = "2026-09-08T10:00:00Z"),
    )

    val reports: MutableList<Report> = mutableListOf(
        Report(id = "r1", targetType = "POST", targetId = "p11", reporterId = "u_someone", reason = ReportReason.SPOILER, note = "Reveals the ending of Ep 9 without a spoiler tag.", status = ReportStatus.OPEN, createdAt = "2026-09-11T06:20:00Z", preview = "POV: you're the CEO of a chaebol conglomerate…"),
        Report(id = "r2", targetType = "COMMENT", targetId = "cm4", reporterId = "u_someone", reason = ReportReason.HARASSMENT, note = "Targeting another user.", status = ReportStatus.OPEN, createdAt = "2026-09-11T05:45:00Z", preview = "Four minutes? I paused to breathe…"),
        Report(id = "r3", targetType = "USER", targetId = "u_meme", reporterId = "u_someone", reason = ReportReason.SPAM, note = "Repetitive promotional posts.", status = ReportStatus.OPEN, createdAt = "2026-09-10T23:10:00Z", preview = "@kdrama_memes"),
        Report(id = "r4", targetType = "COMMUNITY", targetId = "c4", reporterId = "u_someone", reason = ReportReason.OTHER, note = "Off-topic flooding.", status = ReportStatus.OPEN, createdAt = "2026-09-10T21:30:00Z", preview = "Meme HQ"),
    )

    val trending: List<TrendingTopic> = listOf(
        TrendingTopic(rank = 1, tag = "MoonlitWaves", postCount = 48_200),
        TrendingTopic(rank = 2, tag = "CrimsonVows", postCount = 31_900),
        TrendingTopic(rank = 3, tag = "KimHaNeul", postCount = 22_400),
        TrendingTopic(rank = 4, tag = "NeonDynasty", postCount = 18_700),
        TrendingTopic(rank = 5, tag = "SecondLeadSyndrome", postCount = 12_300),
        TrendingTopic(rank = 6, tag = "WhisperingTide", postCount = 9_820),
    )

    val watchProgress: MutableList<WatchingStatus> = mutableListOf(
        WatchingStatus(dramaId = "d1", status = "WATCHING", watchedThroughEpisode = 8, updatedAt = "2026-09-11T08:40:00Z"),
        WatchingStatus(dramaId = "d5", status = "PLAN_TO_WATCH", watchedThroughEpisode = 0, updatedAt = "2026-09-09T12:00:00Z"),
        WatchingStatus(dramaId = "d3", status = "COMPLETED", watchedThroughEpisode = 16, updatedAt = "2026-09-02T22:00:00Z"),
    )

    /** Generates a full episode list for a drama, with hand-written titles for early episodes. */
    fun episodesFor(drama: Drama): List<Episode> {
        val titles = mapOf(
            1 to "The Tide Returns",
            2 to "What the Sea Keeps",
            3 to "Low Water",
            4 to "The Lighthouse",
            5 to "High Water",
            6 to "Undertow",
        )
        return (1..drama.episodeCount).map { n ->
            Episode(
                id = "${drama.id}_e$n",
                dramaId = drama.id,
                number = n,
                title = titles[n] ?: "Episode $n",
                synopsis = "Episode $n of ${drama.title}.",
                airDate = "2026-09-${(n * 2).coerceAtMost(28).toString().padStart(2, '0')}T00:00:00Z",
                discussionCount = (n * 173) % 2300 + 140,
                watched = n <= (watchProgress.firstOrNull { it.dramaId == drama.id }?.watchedThroughEpisode ?: 0),
            )
        }
    }
}
