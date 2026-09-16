import React from "react";
import { View } from "react-native";
import { RADIUS, SPACE } from "../tokens";
import { useTheme } from "../theme";
import { IC, Icon, IconName } from "../icons";
import { Badge, Button, Chip, Col, Divider, Fill, IconButton, Press, Row, Screen, Scroll, Segmented, Switch, T, TabBar, TopBar, type Nav } from "../ui";
import { NotificationRow, WatchingRow } from "../cards";
import { DRAMAS, NOTIFICATIONS, WATCHLIST } from "../data";

/* ------------------------------ notifications ----------------------------- */

export function Notifications({ nav }: { nav?: Nav }) {
  const { p } = useTheme();
  const fresh = NOTIFICATIONS.filter((n) => n.unread);
  const earlier = NOTIFICATIONS.filter((n) => !n.unread);
  return (
    <Screen pad={false}>
      <View style={{ paddingHorizontal: SPACE.md, paddingTop: 8, gap: 12 }}>
        <Row style={{ justifyContent: "space-between" }}>
          <T t="display">Inbox</T>
          <Row gap={4}>
            <IconButton name={IC.check} onPress={() => {}} />
            <IconButton name={IC.settings} onPress={() => nav?.("settings")} />
          </Row>
        </Row>
        <View style={{ flexDirection: "row", gap: 8, alignItems: "center", backgroundColor: p.surface, borderRadius: RADIUS.md, paddingHorizontal: 12, paddingVertical: 10 }}>
          <Icon name={IC.moon} size={15} color={p.warn} />
          <Fill>
            <T t="caption" color={p.textDim}>
              Quiet hours on — non-critical pings wait until 08:00.
            </T>
          </Fill>
          <Press>
            <T t="captionEmph" color={p.accent}>
              Edit
            </T>
          </Press>
        </View>
        <Row gap={8}>
          {["All", "Unread", "Episodes", "Mentions", "Official"].map((c, i) => (
            <Chip key={c} label={c} selected={i === 0} />
          ))}
        </Row>
      </View>

      <Scroll pad={false} style={{ marginTop: 8 }}>
        <View style={{ paddingHorizontal: SPACE.md }}>
          <T t="micro" color={p.textFaint} style={{ marginBottom: 4 }}>
            NEW
          </T>
          <View style={{ backgroundColor: p.surface, borderRadius: RADIUS.card, paddingHorizontal: 14 }}>
            {fresh.map((n, i) => (
              <View key={n.id}>
                {i > 0 ? <Divider /> : null}
                <NotificationRow n={n} onPress={() => nav?.("episode", {})} />
              </View>
            ))}
          </View>

          <T t="micro" color={p.textFaint} style={{ marginTop: 20, marginBottom: 4 }}>
            EARLIER
          </T>
          <View style={{ backgroundColor: p.surface, borderRadius: RADIUS.card, paddingHorizontal: 14 }}>
            {earlier.map((n, i) => (
              <View key={n.id}>
                {i > 0 ? <Divider /> : null}
                <NotificationRow n={n} onPress={() => nav?.("post", { id: "p1" })} />
              </View>
            ))}
          </View>
        </View>
      </Scroll>
      <TabBar active="notifications" onTab={(id) => nav?.(id)} unread={3} />
    </Screen>
  );
}

/* -------------------------------- watchlist ------------------------------- */

export function Watchlist({ nav }: { nav?: Nav }) {
  const { p } = useTheme();
  const watching = WATCHLIST.filter((w) => w.status === "watching");
  const rest = WATCHLIST.filter((w) => w.status !== "watching");
  return (
    <Screen pad={false}>
      <View style={{ paddingHorizontal: SPACE.md, paddingTop: 8 }}>
        <TopBar title="Currently watching" onBack={() => nav?.("profile")} right={<IconButton name="add-circle-outline" />} />
        <T t="caption" color={p.textDim}>
          Your progress powers spoiler protection everywhere.
        </T>
      </View>
      <Scroll pad={false} style={{ marginTop: 12 }}>
        <View style={{ paddingHorizontal: SPACE.md, gap: 16 }}>
          {/* progress editor */}
          <View style={{ backgroundColor: p.surface, borderRadius: RADIUS.card, padding: 16, gap: 12 }}>
            <Row gap={12}>
              <View style={{ width: 48, height: 68, borderRadius: 10, overflow: "hidden" }}>
                <View style={{ flex: 1, backgroundColor: DRAMAS.midnight!.art.to }} />
              </View>
              <Fill style={{ gap: 4 }}>
                <T t="bodyEmph">{DRAMAS.midnight!.title}</T>
                <T t="caption" color={p.textDim}>
                  Watched through Episode 6 of 16
                </T>
                <Row gap={8} style={{ marginTop: 4 }}>
                  <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: p.fill, alignItems: "center", justifyContent: "center" }}>
                    <T t="captionEmph">−</T>
                  </View>
                  <View style={{ width: 44, height: 32, borderRadius: 10, backgroundColor: p.accent, alignItems: "center", justifyContent: "center" }}>
                    <T t="captionEmph" color={p.onAccent}>
                      Ep 6
                    </T>
                  </View>
                  <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: p.fill, alignItems: "center", justifyContent: "center" }}>
                    <T t="captionEmph">+</T>
                  </View>
                </Row>
              </Fill>
            </Row>
            <Row gap={8}>
              <Button label="Jump to Ep 7 discussion" variant="soft" size="sm" icon={IC.comment} style={{ flex: 1 }} onPress={() => nav?.("episode", { n: "7" })} />
              <Button label="Mark completed" variant="ghost" size="sm" />
            </Row>
          </View>

          <View>
            <T t="micro" color={p.textFaint} style={{ marginBottom: 6 }}>
              WATCHING
            </T>
            <View style={{ backgroundColor: p.surface, borderRadius: RADIUS.card, paddingHorizontal: 14 }}>
              {watching.map((w, i) => (
                <View key={w.drama.id}>
                  {i > 0 ? <Divider /> : null}
                  <WatchingRow drama={w.drama} progress={w.progress} status={w.status} onPress={() => nav?.("drama", { id: w.drama.id })} />
                </View>
              ))}
            </View>
          </View>

          <View>
            <T t="micro" color={p.textFaint} style={{ marginBottom: 6 }}>
              PLANNING · COMPLETED · ON HOLD
            </T>
            <View style={{ backgroundColor: p.surface, borderRadius: RADIUS.card, paddingHorizontal: 14 }}>
              {rest.map((w, i) => (
                <View key={w.drama.id}>
                  {i > 0 ? <Divider /> : null}
                  <WatchingRow drama={w.drama} progress={w.progress} status={w.status} onPress={() => nav?.("drama", { id: w.drama.id })} />
                </View>
              ))}
            </View>
          </View>
        </View>
      </Scroll>
    </Screen>
  );
}

/* --------------------------------- settings ------------------------------- */

function SettingRow({ icon, label, value, on, onToggle, onPress, danger }: { icon: IconName; label: string; value?: string; on?: boolean; onToggle?: (v: boolean) => void; onPress?: () => void; danger?: boolean }) {
  const { p } = useTheme();
  return (
    <Press onPress={onPress ?? (() => onToggle?.(!on))}>
      <Row gap={12} style={{ paddingVertical: 13 }}>
        <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: danger ? p.dangerSoft : p.fill, alignItems: "center", justifyContent: "center" }}>
          <Icon name={icon} size={16} color={danger ? p.danger : p.textDim} />
        </View>
        <Fill>
          <T t="bodyEmph" color={danger ? p.danger : p.text}>
            {label}
          </T>
        </Fill>
        {value ? (
          <Row gap={4}>
            <T t="caption" color={p.textDim}>
              {value}
            </T>
            <Icon name={IC.forward} size={14} color={p.textFaint} />
          </Row>
        ) : null}
        {on !== undefined ? <Switch on={on} onChange={onToggle} /> : null}
      </Row>
    </Press>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  const { p } = useTheme();
  return (
    <View style={{ gap: 8 }}>
      <T t="micro" color={p.textFaint}>
        {title.toUpperCase()}
      </T>
      <View style={{ backgroundColor: p.surface, borderRadius: RADIUS.card, paddingHorizontal: 14 }}>{children}</View>
    </View>
  );
}

export function Settings({ nav }: { nav?: Nav }) {
  const { p } = useTheme();
  return (
    <Screen pad={false}>
      <View style={{ paddingHorizontal: SPACE.md, paddingTop: 8 }}>
        <TopBar title="Settings" onBack={() => nav?.("profile")} />
      </View>
      <Scroll pad={false} style={{ marginTop: 4 }}>
        <Col gap={20} style={{ paddingHorizontal: SPACE.md }}>
          <Group title="Account">
            <SettingRow icon={IC.person} label="Mina Park" value="@seoulights · email + Google" onPress={() => {}} />
            <Divider />
            <SettingRow icon={IC.edit} label="Edit profile" onPress={() => {}} />
            <Divider />
            <SettingRow icon={IC.shield} label="Private account" on={false} onToggle={() => {}} />
          </Group>

          <Group title="Spoiler protection">
            <SettingRow icon={IC.lock} label="Protection level" value="Balanced" onPress={() => {}} />
            <Divider />
            <SettingRow icon={IC.eye} label="Ask before revealing" on onToggle={() => {}} />
            <Divider />
            <SettingRow icon={IC.mute} label="Muted dramas" value="2" onPress={() => {}} />
            <Divider />
            <SettingRow icon={IC.tv} label="Watch progress" value="5 dramas" onPress={() => nav?.("watchlist")} />
          </Group>

          <Group title="Notifications">
            <SettingRow icon={IC.bell} label="Episode releases" value="Critical · push + in-app" onPress={() => {}} />
            <Divider />
            <SettingRow icon={IC.comment} label="Replies & mentions" value="Push + in-app" onPress={() => {}} />
            <Divider />
            <SettingRow icon={IC.moon} label="Quiet hours" value="23:00 – 08:00" onPress={() => {}} />
          </Group>

          <Group title="Privacy & safety">
            <SettingRow icon={IC.flag} label="Blocked accounts" value="1" onPress={() => {}} />
            <Divider />
            <SettingRow icon={IC.mute} label="Muted accounts" value="3" onPress={() => {}} />
            <Divider />
            <SettingRow icon={IC.shield} label="Report a problem" onPress={() => nav?.("report")} />
          </Group>

          <Group title="Appearance">
            <Row gap={12} style={{ paddingVertical: 13 }}>
              <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: p.fill, alignItems: "center", justifyContent: "center" }}>
                <Icon name={IC.moon} size={16} color={p.textDim} />
              </View>
              <Fill>
                <T t="bodyEmph">Theme</T>
              </Fill>
              <Segmented tabs={[{ id: "d", label: "Dark" }, { id: "l", label: "Light" }]} value="d" onChange={() => {}} />
            </Row>
          </Group>

          <Group title="About">
            <SettingRow icon={IC.info} label="Version" value="0.2.0 (design prototype)" onPress={() => {}} />
            <Divider />
            <SettingRow icon={IC.logout} label="Log out" danger onPress={() => nav?.("welcome")} />
          </Group>
          <View style={{ height: 8 }} />
        </Col>
      </Scroll>
    </Screen>
  );
}
