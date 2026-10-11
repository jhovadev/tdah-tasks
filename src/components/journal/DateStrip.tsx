import React, { useMemo, useRef, useEffect, useState } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from "react-native";
import { useThemedStyles, type Theme } from "../../theme";
import {
  addDays,
  monthLabel,
  parseISODate,
  shortLabel,
  toISODate,
  weekdayLabel,
} from "../../lib/date";

interface Props {
  /** ISO YYYY-MM-DD de la fecha activa. */
  selectedDate: string;
  onSelect: (date: string) => void;
}

const RANGE = 30; // días antes y después de hoy
const ITEM_WIDTH = 62;
const GAP = 8;

interface DayCell {
  iso: string;
  date: Date;
  isToday: boolean;
}

export function DateStrip({ selectedDate, onSelect }: Props) {
  const styles = useThemedStyles(makeStyles);
  const listRef = useRef<FlatList<DayCell>>(null);
  const [focusedMonth, setFocusedMonth] = useState(() =>
    monthLabel(parseISODate(selectedDate))
  );

  const days = useMemo<DayCell[]>(() => {
    const today = new Date();
    const list: DayCell[] = [];
    for (let offset = -RANGE; offset <= RANGE; offset++) {
      const date = addDays(today, offset);
      list.push({ iso: toISODate(date), date, isToday: offset === 0 });
    }
    return list;
  }, []);

  const selectedIndex = useMemo(
    () => Math.max(0, days.findIndex((d) => d.iso === selectedDate)),
    [days, selectedDate]
  );

  // Centra el día seleccionado al abrir o al cambiar de fecha externa.
  useEffect(() => {
    const index = Math.max(0, selectedIndex - 2);
    const timer = setTimeout(() => {
      listRef.current?.scrollToIndex({ index, animated: true, viewPosition: 0 });
    }, 60);
    return () => clearTimeout(timer);
  }, [selectedIndex]);

  const handleSelect = (cell: DayCell) => {
    onSelect(cell.iso);
    setFocusedMonth(monthLabel(cell.date));
  };

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const center = e.nativeEvent.contentOffset.x + ITEM_WIDTH / 2;
    const approx = Math.round(center / (ITEM_WIDTH + GAP));
    const cell = days[Math.min(days.length - 1, Math.max(0, approx))];
    if (cell) setFocusedMonth(monthLabel(cell.date));
  };

  const goToday = () => {
    onSelect(toISODate(new Date()));
    setFocusedMonth(monthLabel(new Date()));
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.box}>
        <View style={styles.header}>
          <Text style={styles.month}>{focusedMonth}</Text>
          <Pressable style={styles.todayBtn} onPress={goToday} hitSlop={8}>
            <Text style={styles.todayText}>Hoy</Text>
          </Pressable>
        </View>

        <FlatList
          ref={listRef}
          data={days}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.iso}
          contentContainerStyle={styles.content}
          getItemLayout={(_, index) => ({
            length: ITEM_WIDTH + GAP,
            offset: (ITEM_WIDTH + GAP) * index,
            index,
          })}
          onScroll={handleScroll}
          scrollEventThrottle={64}
          initialScrollIndex={Math.max(0, RANGE - 2)}
          renderItem={({ item }) => {
            const active = item.iso === selectedDate;
            return (
              <Pressable
                onPress={() => handleSelect(item)}
                style={[
                  styles.cell,
                  active && styles.cellActive,
                  item.isToday && !active && styles.cellToday,
                ]}
              >
                <Text style={[styles.weekday, active && styles.textActive]}>
                  {item.isToday ? "hoy" : weekdayLabel(item.date)}
                </Text>
                <Text style={[styles.day, active && styles.textActive]}>
                  {shortLabel(item.date)}
                </Text>
              </Pressable>
            );
          }}
        />
      </View>
    </View>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    wrapper: {
      paddingHorizontal: t.spacing.lg,
      paddingTop: t.spacing.sm,
      paddingBottom: t.spacing.sm,
    },
    box: {
      backgroundColor: t.colors.surface,
      borderRadius: t.radius.lg,
      borderWidth: 0.5,
      borderColor: t.colors.border,
      paddingVertical: t.spacing.md,
      paddingHorizontal: t.spacing.sm,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: t.spacing.sm,
      marginBottom: t.spacing.sm,
    },
    month: {
      color: t.colors.text,
      fontSize: t.font.body,
      fontWeight: "700",
      textTransform: "capitalize",
    },
    todayBtn: {
      backgroundColor: t.colors.accentSoft,
      borderRadius: t.radius.pill,
      paddingHorizontal: t.spacing.md,
      paddingVertical: 4,
    },
    todayText: {
      color: t.colors.accent,
      fontSize: t.font.small,
      fontWeight: "600",
    },
    content: { paddingHorizontal: 2, gap: GAP },
    cell: {
      width: ITEM_WIDTH,
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: t.spacing.sm,
      borderRadius: t.radius.md,
      borderWidth: 1,
      borderColor: "transparent",
    },
    cellActive: { backgroundColor: t.colors.accent },
    cellToday: { borderColor: t.colors.accent },
    weekday: {
      fontSize: t.font.tiny,
      color: t.colors.textSecondary,
      textTransform: "lowercase",
      marginBottom: 2,
    },
    day: { fontSize: t.font.small, fontWeight: "600", color: t.colors.text },
    textActive: { color: t.colors.onAccent },
  });
