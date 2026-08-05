import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  Pressable,
  StyleSheet,
  Platform,
  ActivityIndicator,
  useColorScheme,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { Ionicons, Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useQueryClient } from '@tanstack/react-query';
import { useColors } from '@/hooks/useColors';
import {
  useListCountries,
  useCreateChatSession,
  useGetChatMessages,
  useSendChatMessage,
} from '@workspace/api-client-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type Country = { code: string; name: string; flag: string };
type ChatMessage = {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant';
  text: string;
  createdAt: string;
};
type OptimisticMessage = ChatMessage & { optimistic?: boolean };

// ─── Static fallback country list ─────────────────────────────────────────────

const STATIC_COUNTRIES: Country[] = [
  { code: 'SA', name: 'Saudi Arabia', flag: '🇸🇦' },
  { code: 'EG', name: 'Egypt', flag: '🇪🇬' },
  { code: 'AE', name: 'United Arab Emirates', flag: '🇦🇪' },
  { code: 'CN', name: 'China', flag: '🇨🇳' },
  { code: 'PK', name: 'Pakistan', flag: '🇵🇰' },
  { code: 'IN', name: 'India', flag: '🇮🇳' },
  { code: 'PH', name: 'Philippines', flag: '🇵🇭' },
  { code: 'US', name: 'United States', flag: '🇺🇸' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪' },
  { code: 'FR', name: 'France', flag: '🇫🇷' },
  { code: 'IT', name: 'Italy', flag: '🇮🇹' },
  { code: 'ES', name: 'Spain', flag: '🇪🇸' },
  { code: 'RU', name: 'Russia', flag: '🇷🇺' },
  { code: 'JP', name: 'Japan', flag: '🇯🇵' },
  { code: 'KR', name: 'South Korea', flag: '🇰🇷' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺' },
  { code: 'BR', name: 'Brazil', flag: '🇧🇷' },
  { code: 'MX', name: 'Mexico', flag: '🇲🇽' },
  { code: 'ZA', name: 'South Africa', flag: '🇿🇦' },
  { code: 'NG', name: 'Nigeria', flag: '🇳🇬' },
  { code: 'SG', name: 'Singapore', flag: '🇸🇬' },
  { code: 'MY', name: 'Malaysia', flag: '🇲🇾' },
  { code: 'ID', name: 'Indonesia', flag: '🇮🇩' },
  { code: 'TH', name: 'Thailand', flag: '🇹🇭' },
  { code: 'VN', name: 'Vietnam', flag: '🇻🇳' },
  { code: 'BD', name: 'Bangladesh', flag: '🇧🇩' },
  { code: 'LK', name: 'Sri Lanka', flag: '🇱🇰' },
  { code: 'NP', name: 'Nepal', flag: '🇳🇵' },
  { code: 'IR', name: 'Iran', flag: '🇮🇷' },
  { code: 'IQ', name: 'Iraq', flag: '🇮🇶' },
  { code: 'JO', name: 'Jordan', flag: '🇯🇴' },
  { code: 'LB', name: 'Lebanon', flag: '🇱🇧' },
  { code: 'OM', name: 'Oman', flag: '🇴🇲' },
  { code: 'QA', name: 'Qatar', flag: '🇶🇦' },
  { code: 'KW', name: 'Kuwait', flag: '🇰🇼' },
  { code: 'BH', name: 'Bahrain', flag: '🇧🇭' },
  { code: 'YE', name: 'Yemen', flag: '🇾🇪' },
  { code: 'DZ', name: 'Algeria', flag: '🇩🇿' },
  { code: 'MA', name: 'Morocco', flag: '🇲🇦' },
  { code: 'TN', name: 'Tunisia', flag: '🇹🇳' },
  { code: 'AR', name: 'Argentina', flag: '🇦🇷' },
  { code: 'CO', name: 'Colombia', flag: '🇨🇴' },
  { code: 'PE', name: 'Peru', flag: '🇵🇪' },
  { code: 'CL', name: 'Chile', flag: '🇨🇱' },
  { code: 'NL', name: 'Netherlands', flag: '🇳🇱' },
  { code: 'BE', name: 'Belgium', flag: '🇧🇪' },
  { code: 'CH', name: 'Switzerland', flag: '🇨🇭' },
  { code: 'SE', name: 'Sweden', flag: '🇸🇪' },
  { code: 'NO', name: 'Norway', flag: '🇳🇴' },
  { code: 'DK', name: 'Denmark', flag: '🇩🇰' },
  { code: 'FI', name: 'Finland', flag: '🇫🇮' },
  { code: 'PL', name: 'Poland', flag: '🇵🇱' },
  { code: 'GR', name: 'Greece', flag: '🇬🇷' },
  { code: 'PT', name: 'Portugal', flag: '🇵🇹' },
  { code: 'IE', name: 'Ireland', flag: '🇮🇪' },
  { code: 'NZ', name: 'New Zealand', flag: '🇳🇿' },
  { code: 'KZ', name: 'Kazakhstan', flag: '🇰🇿' },
  { code: 'UZ', name: 'Uzbekistan', flag: '🇺🇿' },
  { code: 'AZ', name: 'Azerbaijan', flag: '🇦🇿' },
  { code: 'GE', name: 'Georgia', flag: '🇬🇪' },
  { code: 'AM', name: 'Armenia', flag: '🇦🇲' },
  { code: 'UA', name: 'Ukraine', flag: '🇺🇦' },
];

const POPULAR_CODES = ['SA', 'EG', 'AE', 'CN', 'PK', 'IN', 'PH', 'US', 'GB'];

// ─── Sub-components ────────────────────────────────────────────────────────────

function AssistantAvatar({ size = 36 }: { size?: number }) {
  const colors = useColors();
  return (
    <View
      style={[
        styles.avatar,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: colors.accent + '22',
        },
      ]}
    >
      <Ionicons name="globe-outline" size={size * 0.5} color={colors.accent} />
    </View>
  );
}

function TypingIndicator() {
  const colors = useColors();
  return (
    <View style={styles.typingRow}>
      <AssistantAvatar size={32} />
      <View style={[styles.typingBubble, { backgroundColor: colors.card }]}>
        <ActivityIndicator size="small" color={colors.accent} />
      </View>
    </View>
  );
}

function MessageBubble({ msg, colors }: { msg: OptimisticMessage; colors: ReturnType<typeof useColors> }) {
  const isUser = msg.role === 'user';
  return (
    <View
      style={[
        styles.messageRow,
        isUser ? styles.messageRowUser : styles.messageRowAssistant,
      ]}
    >
      {!isUser && <AssistantAvatar size={32} />}
      <View
        style={[
          styles.bubble,
          isUser
            ? [styles.bubbleUser, { backgroundColor: colors.primary }]
            : [styles.bubbleAssistant, { backgroundColor: colors.card }],
          msg.optimistic && { opacity: 0.7 },
        ]}
      >
        <Text
          style={[
            styles.bubbleText,
            { color: isUser ? colors.primaryForeground : colors.foreground },
          ]}
        >
          {msg.text}
        </Text>
      </View>
    </View>
  );
}

// ─── Passport Selection Screen ─────────────────────────────────────────────────

function PassportScreen({
  countries,
  onSelect,
  loading,
}: {
  countries: Country[];
  onSelect: (c: Country) => void;
  loading: boolean;
}) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');

  const filtered = query
    ? countries.filter(
        (c) =>
          c.name.toLowerCase().includes(query.toLowerCase()) ||
          c.code.toLowerCase().includes(query.toLowerCase()),
      )
    : countries;

  const popular = POPULAR_CODES.map((code) =>
    countries.find((c) => c.code === code),
  ).filter(Boolean) as Country[];

  const handleSelect = (c: Country) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSelect(c);
  };

  const renderCountry = useCallback(
    ({ item }: { item: Country }) => (
      <Pressable
        testID={`btn-country-${item.code}`}
        onPress={() => handleSelect(item)}
        style={({ pressed }) => [
          styles.countryRow,
          { borderBottomColor: colors.border },
          pressed && { backgroundColor: colors.muted },
        ]}
      >
        <Text style={styles.countryFlag}>{item.flag}</Text>
        <Text style={[styles.countryName, { color: colors.foreground }]}>
          {item.name}
        </Text>
        <Text style={[styles.countryCode, { color: colors.mutedForeground }]}>
          {item.code}
        </Text>
      </Pressable>
    ),
    [colors],
  );

  const topInset = Platform.OS === 'web' ? 67 : insets.top;

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View
        style={[
          styles.passportHeader,
          {
            paddingTop: topInset + 12,
            backgroundColor: colors.primary,
          },
        ]}
      >
        <AssistantAvatar size={44} />
        <View style={{ marginLeft: 12 }}>
          <Text style={styles.headerTitle}>Turkey Travel</Text>
          <View style={styles.onlineRow}>
            <View style={styles.onlineDot} />
            <Text style={styles.onlineText}>Online</Text>
          </View>
        </View>
      </View>

      {/* Welcome card */}
      <View style={[styles.welcomeCard, { backgroundColor: colors.card }]}>
        <View
          style={[styles.accentBar, { backgroundColor: colors.accent }]}
        />
        <Text style={[styles.welcomeTitle, { color: colors.foreground }]}>
          Which country issued your passport?
        </Text>
        <Text
          style={[styles.welcomeSubtitle, { color: colors.mutedForeground }]}
        >
          I'll give you tailored visa & entry info for Turkey.
        </Text>
      </View>

      {/* Search */}
      <View
        style={[styles.searchContainer, { backgroundColor: colors.background }]}
      >
        <View
          style={[
            styles.searchBox,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Feather name="search" size={16} color={colors.mutedForeground} />
          <TextInput
            testID="input-search-country"
            placeholder="Search country..."
            placeholderTextColor={colors.mutedForeground}
            value={query}
            onChangeText={setQuery}
            style={[styles.searchInput, { color: colors.foreground }]}
            autoCapitalize="none"
            clearButtonMode="while-editing"
          />
        </View>

        {/* Popular chips */}
        {!query && (
          <View style={styles.popularRow}>
            <Text
              style={[styles.popularLabel, { color: colors.mutedForeground }]}
            >
              Popular
            </Text>
            <FlatList
              horizontal
              data={popular}
              keyExtractor={(c) => c.code}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8, paddingVertical: 4 }}
              renderItem={({ item }) => (
                <Pressable
                  testID={`btn-popular-${item.code}`}
                  onPress={() => handleSelect(item)}
                  style={({ pressed }) => [
                    styles.chip,
                    {
                      backgroundColor: pressed
                        ? colors.accent + '33'
                        : colors.card,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Text style={styles.chipFlag}>{item.flag}</Text>
                  <Text
                    style={[styles.chipCode, { color: colors.foreground }]}
                  >
                    {item.code}
                  </Text>
                </Pressable>
              )}
            />
          </View>
        )}
      </View>

      {/* Country list */}
      {loading ? (
        <ActivityIndicator
          style={{ marginTop: 40 }}
          color={colors.accent}
          size="large"
        />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(c) => c.code}
          renderItem={renderCountry}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          scrollEnabled={!!filtered.length}
          ListEmptyComponent={
            <Text
              style={[
                styles.emptyText,
                { color: colors.mutedForeground },
              ]}
            >
              No countries found
            </Text>
          }
          contentContainerStyle={{
            paddingBottom:
              (Platform.OS === 'web' ? 34 : insets.bottom) + 16,
          }}
        />
      )}
    </View>
  );
}

// ─── Chat Screen ───────────────────────────────────────────────────────────────

function ChatScreen({
  sessionId,
  selectedCountry,
  onBack,
  apiMessages,
  messagesLoading,
}: {
  sessionId: string;
  selectedCountry: Country;
  onBack: () => void;
  apiMessages: ChatMessage[] | undefined;
  messagesLoading: boolean;
}) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [input, setInput] = useState('');
  const [optimisticMsgs, setOptimisticMsgs] = useState<OptimisticMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const sendMessage = useSendChatMessage();
  const queryClient = useQueryClient();

  // Merge API messages with optimistic ones, deduplicated by id
  const allMessages: OptimisticMessage[] = [
    ...(apiMessages ?? []),
    ...optimisticMsgs.filter(
      (opt) => !(apiMessages ?? []).find((m) => m.id === opt.id),
    ),
  ].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );

  // Reversed for inverted FlatList
  const reversed = [...allMessages].reverse();

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;
    setInput('');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const optimisticId =
      Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const optimistic: OptimisticMessage = {
      id: optimisticId,
      sessionId,
      role: 'user',
      text,
      createdAt: new Date().toISOString(),
      optimistic: true,
    };
    // Capture sessionId before async operation to avoid stale closure
    const currentSessionId = sessionId;
    setOptimisticMsgs((prev) => [...prev, optimistic]);
    setIsTyping(true);
    sendMessage.mutate(
      { sessionId: currentSessionId, data: { text } },
      {
        onSuccess: (assistantMsg) => {
          setIsTyping(false);
          // Remove the optimistic user msg — it will be present in the refetch
          setOptimisticMsgs((prev) =>
            prev.filter((m) => m.id !== optimisticId),
          );
          // Invalidate so React Query fetches the real message list
          // (includes both the user message and the assistant reply)
          queryClient.invalidateQueries({
            queryKey: ['chatMessages', currentSessionId],
          });
        },
        onError: () => {
          setIsTyping(false);
          // Mark the optimistic message as failed (keep it visible but dim)
          setOptimisticMsgs((prev) =>
            prev.map((m) =>
              m.id === optimisticId ? { ...m, text: `${m.text} ⚠️` } : m,
            ),
          );
        },
      },
    );
    // Keep keyboard open after send
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const bottomInset = Platform.OS === 'web' ? 34 : insets.bottom;

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View
        style={[
          styles.chatHeader,
          {
            paddingTop: topInset + 10,
            backgroundColor: colors.primary,
          },
        ]}
      >
        <Pressable
          onPress={onBack}
          testID="btn-back"
          hitSlop={12}
          style={({ pressed }) => [
            styles.backBtn,
            pressed && { opacity: 0.6 },
          ]}
        >
          <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
        </Pressable>
        <AssistantAvatar size={38} />
        <View style={styles.chatHeaderInfo}>
          <Text style={styles.chatHeaderTitle}>Turkey Travel</Text>
          <View style={styles.onlineRow}>
            <View style={styles.onlineDot} />
            <Text style={styles.onlineText}>Online</Text>
          </View>
        </View>
        <View style={styles.passportBadge}>
          <Text style={styles.passportFlag}>{selectedCountry.flag}</Text>
          <Text style={styles.passportCode}>{selectedCountry.code}</Text>
        </View>
      </View>

      {/* Messages */}
      <KeyboardAvoidingView
        style={styles.flex}
        behavior="padding"
        keyboardVerticalOffset={0}
      >
        {messagesLoading ? (
          <ActivityIndicator
            style={{ flex: 1 }}
            color={colors.accent}
            size="large"
          />
        ) : (
          <FlatList
            data={reversed}
            keyExtractor={(m) => m.id}
            inverted
            keyboardDismissMode="interactive"
            keyboardShouldPersistTaps="handled"
            scrollEnabled={!!reversed.length}
            contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 8 }}
            ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
            ListHeaderComponent={isTyping ? <TypingIndicator /> : null}
            ListFooterComponent={
              <View
                style={[
                  styles.welcomeIntro,
                  { backgroundColor: colors.card },
                ]}
              >
                <Text
                  style={[
                    styles.welcomeIntroText,
                    { color: colors.foreground },
                  ]}
                >
                  How can I help you plan your Turkey trip?
                </Text>
              </View>
            }
            renderItem={({ item }) => (
              <MessageBubble msg={item} colors={colors} />
            )}
          />
        )}

        {/* Input bar */}
        <View
          style={[
            styles.inputBar,
            {
              backgroundColor: colors.card,
              borderTopColor: colors.border,
              paddingBottom: bottomInset + 8,
            },
          ]}
        >
          <TextInput
            ref={inputRef}
            testID="input-message"
            value={input}
            onChangeText={setInput}
            placeholder="Message Turkey Travel Assistant..."
            placeholderTextColor={colors.mutedForeground}
            style={[
              styles.textInput,
              {
                backgroundColor: colors.background,
                color: colors.foreground,
                borderColor: colors.border,
              },
            ]}
            multiline
            maxLength={1000}
            returnKeyType="send"
            onSubmitEditing={handleSend}
            blurOnSubmit={false}
          />
          <Pressable
            testID="btn-send"
            onPress={handleSend}
            disabled={!input.trim() || sendMessage.isPending}
            style={({ pressed }) => [
              styles.sendBtn,
              {
                backgroundColor:
                  input.trim() ? colors.accent : colors.muted,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
          >
            {sendMessage.isPending ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Ionicons
                name="send"
                size={18}
                color={input.trim() ? '#FFFFFF' : colors.mutedForeground}
              />
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const { data: apiCountries, isLoading: countriesLoading } = useListCountries();
  const createSession = useCreateChatSession();

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);

  const { data: apiMessages, isLoading: messagesLoading } = useGetChatMessages(
    sessionId ?? '',
    { query: { enabled: !!sessionId, queryKey: ['chatMessages', sessionId] } },
  );

  const countries: Country[] =
    apiCountries && apiCountries.length > 0 ? apiCountries : STATIC_COUNTRIES;

  const handleSelectCountry = (c: Country) => {
    setSelectedCountry(c);
    createSession.mutate(
      { data: { passportCountryCode: c.code } },
      { onSuccess: (session) => setSessionId(session.id) },
    );
  };

  const handleBack = () => {
    setSessionId(null);
    setSelectedCountry(null);
  };

  if (sessionId && selectedCountry) {
    return (
      <ChatScreen
        sessionId={sessionId}
        selectedCountry={selectedCountry}
        onBack={handleBack}
        apiMessages={apiMessages as ChatMessage[] | undefined}
        messagesLoading={messagesLoading}
      />
    );
  }

  return (
    <PassportScreen
      countries={countries}
      onSelect={handleSelectCountry}
      loading={countriesLoading || createSession.isPending}
    />
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  flex: { flex: 1 },

  // Passport screen
  passportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700' as const,
    letterSpacing: 0.2,
  },
  onlineRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#22C55E',
  },
  onlineText: { color: '#A7F3D0', fontSize: 12, fontWeight: '500' as const },

  welcomeCard: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 4,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  accentBar: {
    width: 4,
    borderRadius: 2,
    alignSelf: 'stretch',
    marginRight: 12,
  },
  welcomeTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    flex: 1,
    lineHeight: 22,
  },
  welcomeSubtitle: {
    fontSize: 13,
    marginTop: 4,
    lineHeight: 19,
  },

  searchContainer: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchInput: { flex: 1, fontSize: 15, fontWeight: '400' as const },

  popularRow: { marginTop: 12 },
  popularLabel: { fontSize: 11, fontWeight: '600' as const, letterSpacing: 0.8, marginBottom: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipFlag: { fontSize: 16 },
  chipCode: { fontSize: 12, fontWeight: '600' as const },

  countryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  countryFlag: { fontSize: 22, marginRight: 12 },
  countryName: { flex: 1, fontSize: 15, fontWeight: '500' as const },
  countryCode: { fontSize: 12, fontWeight: '500' as const },
  emptyText: {
    textAlign: 'center',
    paddingVertical: 40,
    fontSize: 14,
  },

  // Chat screen
  avatar: { alignItems: 'center', justifyContent: 'center' },

  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingBottom: 12,
    gap: 10,
  },
  backBtn: { padding: 4 },
  chatHeaderInfo: { flex: 1 },
  chatHeaderTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700' as const,
  },
  passportBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  passportFlag: { fontSize: 16 },
  passportCode: { color: '#FFFFFF', fontSize: 12, fontWeight: '600' as const },

  messageRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  messageRowUser: { justifyContent: 'flex-end' },
  messageRowAssistant: { justifyContent: 'flex-start' },
  bubble: {
    maxWidth: '80%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
  },
  bubbleUser: { borderBottomRightRadius: 4 },
  bubbleAssistant: {
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  bubbleText: { fontSize: 15, lineHeight: 22 },

  typingRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginBottom: 8 },
  typingBubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },

  welcomeIntro: {
    alignSelf: 'flex-start',
    maxWidth: '80%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderBottomLeftRadius: 4,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  welcomeIntroText: { fontSize: 15, lineHeight: 22 },

  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    paddingHorizontal: 12,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  textInput: {
    flex: 1,
    borderRadius: 22,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    fontSize: 15,
    maxHeight: 120,
    lineHeight: 22,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
