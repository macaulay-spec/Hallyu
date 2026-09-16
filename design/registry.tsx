import React from "react";
import type { Nav } from "./ui";
import { Splash, Welcome, SignIn, SignUp, Onboarding } from "./screens/auth";
import { Home, HomeEmpty } from "./screens/home";
import { Discover, Search, SearchIdle } from "./screens/discover";
import { DramaHub, EpisodePage } from "./screens/drama";
import { ActorPage, CommunityPage, Profile, OtherProfile } from "./screens/people";
import { PostDetail, Composer } from "./screens/social";
import { Notifications, Watchlist, Settings } from "./screens/personal";
import { StatesSheet, ReportSheet, ModerationQueue } from "./screens/system";
import { DesignSystemSheet, LightModeSheet } from "./screens/foundations";

export interface ScreenDef {
  id: string;
  title: string;
  group: string;
  /** Frame height in design points (default 844). Taller = scroll sheet. */
  height?: number;
  make: (nav: Nav) => React.ReactElement;
}

export const SCREENS: ScreenDef[] = [
  { id: "01-splash", title: "Splash", group: "First run", make: () => <Splash /> },
  { id: "02-welcome", title: "Welcome", group: "First run", make: (n) => <Welcome nav={n} /> },
  { id: "03-signin", title: "Sign in", group: "First run", make: (n) => <SignIn nav={n} /> },
  { id: "04-signup", title: "Sign up", group: "First run", make: (n) => <SignUp nav={n} /> },
  { id: "05-onboarding", title: "Onboarding · interests", group: "First run", make: (n) => <Onboarding nav={n} /> },

  { id: "06-home-foryou", title: "Home · For You", group: "Core loop", make: (n) => <Home nav={n} feed="foryou" /> },
  { id: "07-home-following", title: "Home · Following", group: "Core loop", make: (n) => <Home nav={n} feed="following" /> },
  { id: "08-home-empty", title: "Home · empty state", group: "States", make: (n) => <HomeEmpty nav={n} /> },
  { id: "09-discover", title: "Discover", group: "Core loop", make: (n) => <Discover nav={n} /> },
  { id: "10-search-idle", title: "Search · idle", group: "Core loop", make: (n) => <SearchIdle nav={n} /> },
  { id: "11-search-results", title: "Search · results", group: "Core loop", make: (n) => <Search nav={n} /> },

  { id: "12-drama-hub", title: "Drama hub", group: "Drama graph", make: (n) => <DramaHub nav={n} /> },
  { id: "13-episode", title: "Episode discussion", group: "Drama graph", make: (n) => <EpisodePage nav={n} /> },
  { id: "14-actor", title: "Actor profile", group: "Drama graph", make: (n) => <ActorPage nav={n} /> },

  { id: "15-post-detail", title: "Post detail · comments", group: "Social", make: (n) => <PostDetail nav={n} /> },
  { id: "16-composer", title: "Composer", group: "Social", make: (n) => <Composer nav={n} /> },
  { id: "17-community", title: "Community", group: "Social", make: (n) => <CommunityPage nav={n} /> },

  { id: "18-notifications", title: "Notifications", group: "Personal", make: (n) => <Notifications nav={n} /> },
  { id: "19-profile", title: "Profile", group: "Personal", make: (n) => <Profile nav={n} /> },
  { id: "20-profile-other", title: "Profile · other fan", group: "Personal", make: (n) => <OtherProfile nav={n} /> },
  { id: "21-watchlist", title: "Watchlist · progress", group: "Personal", make: (n) => <Watchlist nav={n} /> },
  { id: "22-settings", title: "Settings", group: "Personal", height: 1500, make: (n) => <Settings nav={n} /> },

  { id: "23-report", title: "Report sheet", group: "Trust", make: (n) => <ReportSheet nav={n} /> },
  { id: "24-moderation", title: "Moderation queue", group: "Trust", make: (n) => <ModerationQueue nav={n} /> },

  { id: "25-states", title: "Loading · empty · error · offline", group: "States", height: 1750, make: () => <StatesSheet /> },
  { id: "26-design-system", title: "Design system", group: "Foundations", height: 2400, make: () => <DesignSystemSheet /> },
  { id: "27-light-mode", title: "Light mode", group: "Foundations", make: (n) => <LightModeSheet nav={n} /> },
];

export const GROUPS = [...new Set(SCREENS.map((s) => s.group))];
