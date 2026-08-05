import React, { useState, useRef, useCallback, useEffect } from 'react';
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
  I18nManager,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
} from '@workspace/api-client-react';

const PASSPORT_STORAGE_KEY = 'turkey_travel_passport_country';
const LANGUAGE_STORAGE_KEY = 'turkey_travel_language';
const SESSION_STORAGE_KEY = 'turkey_travel_session_id';

// ─── Types ────────────────────────────────────────────────────────────────────

type Lang = 'EN' | 'ES' | 'AR' | 'FR' | 'TR';

type Country = { code: string; name: string; flag: string };
type ChatMessage = {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant';
  text: string;
  createdAt: string;
};
type OptimisticMessage = ChatMessage & { optimistic?: boolean };

// ─── Translations ─────────────────────────────────────────────────────────────

const TRANSLATIONS: Record<Lang, Record<string, string>> = {
  EN: {
    title: 'Turkey Travel',
    online: 'Online',
    welcome: 'Which country issued your passport?',
    subtitle: "I'll give you tailored visa & entry info for Turkey.",
    searchCountry: 'Search country...',
    popular: 'POPULAR',
    noCountries: 'No countries found',
    howCanIHelp: 'How can I help you plan your Turkey trip?',
    messagePlaceholder: 'Message Turkey Travel Assistant...',
  },
  ES: {
    title: 'Turkey Travel',
    online: 'En línea',
    welcome: '¿Qué país emitió tu pasaporte?',
    subtitle: 'Te daré información de visado personalizada para Turquía.',
    searchCountry: 'Buscar país...',
    popular: 'POPULAR',
    noCountries: 'No se encontraron países',
    howCanIHelp: '¿Cómo puedo ayudarte a planear tu viaje a Turquía?',
    messagePlaceholder: 'Escribe un mensaje...',
  },
  AR: {
    title: 'Turkey Travel',
    online: 'متصل',
    welcome: 'ما هي الدولة التي أصدرت جواز سفرك؟',
    subtitle: 'سأقدم لك معلومات التأشيرة والدخول المخصصة لتركيا.',
    searchCountry: '...ابحث عن دولة',
    popular: 'الأكثر شيوعاً',
    noCountries: 'لا توجد دول',
    howCanIHelp: 'كيف يمكنني مساعدتك في التخطيط لرحلتك إلى تركيا؟',
    messagePlaceholder: '...أرسل رسالة',
  },
  FR: {
    title: 'Turkey Travel',
    online: 'En ligne',
    welcome: 'Quel pays a délivré votre passeport ?',
    subtitle: 'Je vous donnerai des informations visa personnalisées pour la Turquie.',
    searchCountry: 'Rechercher un pays...',
    popular: 'POPULAIRE',
    noCountries: 'Aucun pays trouvé',
    howCanIHelp: 'Comment puis-je vous aider à planifier votre voyage en Turquie ?',
    messagePlaceholder: "Message à l'assistant...",
  },
  TR: {
    title: 'Turkey Travel',
    online: 'Çevrimiçi',
    welcome: 'Pasaportunuzu hangi ülke verdi?',
    subtitle: 'Türkiye için özel vize ve giriş bilgisi sunacağım.',
    searchCountry: 'Ülke ara...',
    popular: 'POPÜLER',
    noCountries: 'Ülke bulunamadı',
    howCanIHelp: 'Türkiye gezinizi planlamanıza nasıl yardımcı olabilirim?',
    messagePlaceholder: 'Mesaj yazın...',
  },
};

const LANGUAGES: Lang[] = ['EN', 'ES', 'AR', 'FR', 'TR'];

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

// ─── Language cycling button ──────────────────────────────────────────────────

function LangButton({
  lang,
  onPress,
}: {
  lang: Lang;
  onPress: () => void;
}) {
  return (
    <Pressable
      testID="btn-cycle-language"
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => [
        styles.langButton,
        pressed && { opacity: 0.7 },
      ]}
    >
      <Text style={styles.langButtonText}>{lang}</Text>
    </Pressable>
  );
}

// ─── Passport Selection Screen ─────────────────────────────────────────────────

function PassportScreen({
  countries,
  onSelect,
  loading,
  lang,
  onCycleLang,
  t,
  isRTL,
  showRestoreError,
}: {
  countries: Country[];
  onSelect: (c: Country) => void;
  loading: boolean;
  lang: Lang;
  onCycleLang: () => void;
  t: Record<string, string>;
  isRTL: boolean;
  showRestoreError?: boolean;
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

  const rtlText = isRTL ? { textAlign: 'right' as const, writingDirection: 'rtl' as const } : {};

  const renderCountry = useCallback(
    ({ item }: { item: Country }) => (
      <Pressable
        testID={`btn-country-${item.code}`}
        onPress={() => handleSelect(item)}
        style={({ pressed }) => [
          styles.countryRow,
          isRTL && styles.countryRowRTL,
          { borderBottomColor: colors.border },
          pressed && { backgroundColor: colors.muted },
        ]}
      >
        <Text style={styles.countryFlag}>{item.flag}</Text>
        <Text style={[styles.countryName, { color: colors.foreground }, rtlText]}>
          {item.name}
        </Text>
        <Text style={[styles.countryCode, { color: colors.mutedForeground }]}>
          {item.code}
        </Text>
      </Pressable>
    ),
    [colors, isRTL],
  );

  const topInset = Platform.OS === 'web' ? 67 : insets.top;

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View
        style={[
          styles.passportHeader,
          isRTL && styles.rowRTL,
          {
            paddingTop: topInset + 12,
            backgroundColor: colors.primary,
          },
        ]}
      >
        <AssistantAvatar size={44} />
        <View style={[{ marginLeft: isRTL ? 0 : 12, marginRight: isRTL ? 12 : 0, flex: 1 }]}>
          <Text style={[styles.headerTitle, rtlText]}>{t.title}</Text>
          <View style={[styles.onlineRow, isRTL && styles.rowRTL]}>
            <View style={styles.onlineDot} />
            <Text style={styles.onlineText}>{t.online}</Text>
          </View>
        </View>
        <LangButton lang={lang} onPress={onCycleLang} />
      </View>

      {/* Welcome card */}
      <View style={[styles.welcomeCard, { backgroundColor: colors.card }]}>
        <View
          style={[styles.accentBar, { backgroundColor: colors.accent }]}
        />
        <View style={{ flex: 1 }}>
          <Text style={[styles.welcomeTitle, { color: colors.foreground }, rtlText]}>
            {t.welcome}
          </Text>
          <Text
            style={[styles.welcomeSubtitle, { color: colors.mutedForeground }, rtlText]}
          >
            {t.subtitle}
          </Text>
        </View>
      </View>

      {/* Error notice when auto-login failed */}
      {showRestoreError && (
        <View style={[styles.restoreErrorBanner, { backgroundColor: '#FEF2F2', borderColor: '#FECACA' }]}>
          <Ionicons name="warning-outline" size={15} color="#DC2626" />
          <Text style={[styles.restoreErrorText, { color: '#DC2626' }]}>
            Couldn't restore your previous session. Please select your passport again.
          </Text>
        </View>
      )}

      {/* Search */}
      <View
        style={[styles.searchContainer, { backgroundColor: colors.background }]}
      >
        <View
          style={[
            styles.searchBox,
            isRTL && styles.rowRTL,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Feather name="search" size={16} color={colors.mutedForeground} />
          <TextInput
            testID="input-search-country"
            placeholder={t.searchCountry}
            placeholderTextColor={colors.mutedForeground}
            value={query}
            onChangeText={setQuery}
            style={[styles.searchInput, { color: colors.foreground }, rtlText]}
            autoCapitalize="none"
            clearButtonMode="while-editing"
            textAlign={isRTL ? 'right' : 'left'}
          />
        </View>

        {/* Popular chips */}
        {!query && (
          <View style={styles.popularRow}>
            <Text
              style={[styles.popularLabel, { color: colors.mutedForeground }, rtlText]}
            >
              {t.popular}
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
                rtlText,
              ]}
            >
              {t.noCountries}
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
  onChangePassport,
  apiMessages,
  messagesLoading,
  lang,
  onCycleLang,
  t,
  isRTL,
}: {
  sessionId: string;
  selectedCountry: Country;
  onBack: () => void;
  onChangePassport: () => void;
  apiMessages: ChatMessage[] | undefined;
  messagesLoading: boolean;
  lang: Lang;
  onCycleLang: () => void;
  t: Record<string, string>;
  isRTL: boolean;
}) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [input, setInput] = useState('');
  const [optimisticMsgs, setOptimisticMsgs] = useState<OptimisticMessage[]>([]);
  // isTyping: spinner shown before first token arrives
  const [isTyping, setIsTyping] = useState(false);
  // historyTrimmed: true once the server has trimmed old messages from context
  const [historyTrimmed, setHistoryTrimmed] = useState(false);
  // streamingText: non-null once the first SSE token arrives; grows token by token
  const [streamingText, setStreamingText] = useState<string | null>(null);
  const inputRef = useRef<TextInput>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const queryClient = useQueryClient();

  // Reset trimming notice whenever the active session changes
  useEffect(() => {
    setHistoryTrimmed(false);
  }, [sessionId]);

  // Abort any in-flight SSE stream when the component unmounts
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  const rtlText = isRTL ? { textAlign: 'right' as const, writingDirection: 'rtl' as const } : {};

  // Build the streaming assistant bubble (null when not streaming)
  const streamingMessage: OptimisticMessage | null =
    streamingText !== null
      ? {
          id: 'streaming-assistant',
          sessionId,
          role: 'assistant',
          text: streamingText || '…',
          createdAt: new Date().toISOString(),
        }
      : null;

  // Merge API messages with optimistic ones, deduplicated by id, plus the live streaming bubble
  const allMessages: OptimisticMessage[] = [
    ...(apiMessages ?? []),
    ...optimisticMsgs.filter(
      (opt) => !(apiMessages ?? []).find((m) => m.id === opt.id),
    ),
    ...(streamingMessage ? [streamingMessage] : []),
  ].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );

  // Reversed for inverted FlatList
  const reversed = [...allMessages].reverse();

  // true while a request is in-flight (typing indicator or streaming)
  const isSending = isTyping || streamingText !== null;

  const handleSend = () => {
    const text = input.trim();
    if (!text || isSending) return;
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

    // Cancel any previously in-flight stream
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    // Build the absolute API URL using the same domain Expo uses for all API calls
    const apiBase = `https://${process.env.EXPO_PUBLIC_DOMAIN}`;
    const url = `${apiBase}/api/chat/session/${currentSessionId}/messages`;

    (async () => {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'text/event-stream',
          },
          body: JSON.stringify({ text }),
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        // First token is about to arrive — hide typing indicator, show streaming bubble
        setIsTyping(false);
        setStreamingText('');

        const reader = response.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          // Split on newlines; keep the last (possibly incomplete) line in the buffer
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const data = line.slice(6);

            if (data === '[DONE]') {
              // Stream complete — finalise
              setStreamingText(null);
              setOptimisticMsgs((prev) =>
                prev.filter((m) => m.id !== optimisticId),
              );
              queryClient.invalidateQueries({
                queryKey: ['chatMessages', currentSessionId],
              });
              return;
            }

            // Server notifies that old messages were trimmed from context
            if (data === '[TRIMMED]') {
              setHistoryTrimmed(true);
              continue;
            }

            if (data.startsWith('[ERROR]')) {
              throw new Error(data.slice(8).trim() || 'AI error');
            }

            // Server escapes literal newlines as \\n — restore them
            const token = data.replace(/\\n/g, '\n');
            setStreamingText((prev) => (prev ?? '') + token);
          }
        }

        // Reached end of stream without an explicit [DONE] — still clean up
        setStreamingText(null);
        setOptimisticMsgs((prev) =>
          prev.filter((m) => m.id !== optimisticId),
        );
        queryClient.invalidateQueries({
          queryKey: ['chatMessages', currentSessionId],
        });
      } catch (err: unknown) {
        // AbortError means the user navigated away or sent a new message — ignore silently
        if (err instanceof Error && err.name === 'AbortError') return;

        setIsTyping(false);
        setStreamingText(null);
        // Mark the optimistic message as failed (keep it visible but indicate error)
        setOptimisticMsgs((prev) =>
          prev.map((m) =>
            m.id === optimisticId ? { ...m, text: `${m.text} ⚠️` } : m,
          ),
        );
      }
    })();

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
          isRTL && styles.rowRTL,
          {
            paddingTop: topInset + 10,
            backgroundColor: colors.primary,
          },
        ]}
      >
        <AssistantAvatar size={38} />
        <View style={styles.chatHeaderInfo}>
          <Text style={[styles.chatHeaderTitle, rtlText]}>{t.title}</Text>
          <View style={[styles.onlineRow, isRTL && styles.rowRTL]}>
            <View style={styles.onlineDot} />
            <Text style={styles.onlineText}>{t.online}</Text>
          </View>
        </View>
        <LangButton lang={lang} onPress={onCycleLang} />
        <Pressable
          testID="btn-change-passport"
          onPress={onChangePassport}
          hitSlop={8}
          style={({ pressed }) => [
            styles.passportBadge,
            pressed && { opacity: 0.7 },
          ]}
        >
          <Text style={styles.passportFlag}>{selectedCountry.flag}</Text>
          <Text style={styles.passportCode}>{selectedCountry.code}</Text>
          <Feather name="edit-2" size={11} color="rgba(255,255,255,0.75)" />
        </Pressable>
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
                    rtlText,
                  ]}
                >
                  {t.howCanIHelp}
                </Text>
              </View>
            }
            renderItem={({ item }) => (
              <MessageBubble msg={item} colors={colors} />
            )}
          />
        )}

        {/* History trimming notice — shown once trimming has occurred */}
        {historyTrimmed && (
          <View style={styles.trimNotice}>
            <Text style={[styles.trimNoticeText, { color: colors.mutedForeground }]}>
              Earlier messages are no longer included for efficiency
            </Text>
          </View>
        )}

        {/* Input bar */}
        <View
          style={[
            styles.inputBar,
            isRTL && styles.rowRTL,
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
            placeholder={t.messagePlaceholder}
            placeholderTextColor={colors.mutedForeground}
            style={[
              styles.textInput,
              {
                backgroundColor: colors.background,
                color: colors.foreground,
                borderColor: colors.border,
              },
              rtlText,
            ]}
            multiline
            maxLength={1000}
            returnKeyType="send"
            onSubmitEditing={handleSend}
            blurOnSubmit={false}
            textAlign={isRTL ? 'right' : 'left'}
          />
          <Pressable
            testID="btn-send"
            onPress={handleSend}
            disabled={!input.trim() || isSending}
            style={({ pressed }) => [
              styles.sendBtn,
              {
                backgroundColor:
                  input.trim() ? colors.accent : colors.muted,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
          >
            {isSending ? (
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
  // true while we're checking AsyncStorage on first launch
  const [isLoadingPrefs, setIsLoadingPrefs] = useState(true);
  // set to true when auto-login fails so the user sees a brief error notice
  const [autoLoginError, setAutoLoginError] = useState(false);
  const [lang, setLang] = useState<Lang>('EN');

  const { data: apiMessages, isLoading: messagesLoading } = useGetChatMessages(
    sessionId ?? '',
    { query: { enabled: !!sessionId, queryKey: ['chatMessages', sessionId] } },
  );

  const countries: Country[] =
    apiCountries && apiCountries.length > 0 ? apiCountries : STATIC_COUNTRIES;

  const t = TRANSLATIONS[lang];
  const isRTL = lang === 'AR';

  // ── Load saved passport + language + session on first launch ─────────────
  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem(PASSPORT_STORAGE_KEY),
      AsyncStorage.getItem(LANGUAGE_STORAGE_KEY),
      AsyncStorage.getItem(SESSION_STORAGE_KEY),
    ])
      .then(async ([passportRaw, langRaw, savedSessionId]) => {
        // Restore language
        if (langRaw && LANGUAGES.includes(langRaw as Lang)) {
          setLang(langRaw as Lang);
        }
        // Restore passport
        if (!passportRaw) {
          setIsLoadingPrefs(false);
          return;
        }
        let saved: Country;
        try {
          saved = JSON.parse(passportRaw);
        } catch {
          // Corrupted storage — remove the bad entry and show passport selection
          AsyncStorage.removeItem(PASSPORT_STORAGE_KEY).catch(() => {/* ignore */});
          setIsLoadingPrefs(false);
          return;
        }
        setSelectedCountry(saved);

        // Try to restore the previous session before falling back to a new one
        if (savedSessionId) {
          try {
            const apiBase = `https://${process.env.EXPO_PUBLIC_DOMAIN}`;
            const resp = await fetch(
              `${apiBase}/api/chat/session/${savedSessionId}`,
            );
            if (resp.ok) {
              // Session still exists — pick up right where the user left off
              setSessionId(savedSessionId);
              setIsLoadingPrefs(false);
              return;
            }
            // Session is gone — remove the stale key so future launches don't retry it
            AsyncStorage.removeItem(SESSION_STORAGE_KEY).catch(() => {/* ignore */});
          } catch {
            // Network error — fall through to create a new session
          }
        }

        // No valid saved session — create a fresh one
        createSession.mutate(
          { data: { passportCountryCode: saved.code } },
          {
            onSuccess: (session) => {
              setSessionId(session.id);
              AsyncStorage.setItem(SESSION_STORAGE_KEY, session.id).catch(
                () => {/* ignore */},
              );
            },
            onError: () => {
              // Auto-login failed — clear the stored passport so the user starts fresh,
              // and show a brief error notice on the passport selection screen
              AsyncStorage.multiRemove([PASSPORT_STORAGE_KEY, SESSION_STORAGE_KEY]).catch(
                () => {/* ignore */},
              );
              setSelectedCountry(null);
              setAutoLoginError(true);
            },
            onSettled: () => setIsLoadingPrefs(false),
          },
        );
      })
      .catch(() => setIsLoadingPrefs(false));
    // Run once on mount only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Cycle to next language ───────────────────────────────────────────────
  const handleCycleLang = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLang((prev) => {
      const idx = LANGUAGES.indexOf(prev);
      const next = LANGUAGES[(idx + 1) % LANGUAGES.length];
      AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, next).catch(() => {/* ignore */});
      return next;
    });
  }, []);

  // ── Persist + create session when user picks a country ───────────────────
  const handleSelectCountry = (c: Country) => {
    setSelectedCountry(c);
    AsyncStorage.setItem(PASSPORT_STORAGE_KEY, JSON.stringify(c)).catch(
      () => {/* ignore storage errors */},
    );
    createSession.mutate(
      { data: { passportCountryCode: c.code } },
      {
        onSuccess: (session) => {
          setSessionId(session.id);
          AsyncStorage.setItem(SESSION_STORAGE_KEY, session.id).catch(
            () => {/* ignore */},
          );
        },
      },
    );
  };

  // ── "Change passport" — clear session and go back to selection ───────────
  const handleChangePassport = () => {
    setSessionId(null);
    setSelectedCountry(null);
    AsyncStorage.multiRemove([PASSPORT_STORAGE_KEY, SESSION_STORAGE_KEY]).catch(
      () => {/* ignore */},
    );
  };

  // Show a loading indicator while we check AsyncStorage / create the session
  if (isLoadingPrefs) {
    return (
      <View style={[styles.flex, styles.loadingCenter]}>
        <ActivityIndicator size="large" color="#F59E0B" />
      </View>
    );
  }

  if (sessionId && selectedCountry) {
    return (
      <ChatScreen
        sessionId={sessionId}
        selectedCountry={selectedCountry}
        onBack={handleChangePassport}
        onChangePassport={handleChangePassport}
        apiMessages={apiMessages as ChatMessage[] | undefined}
        messagesLoading={messagesLoading}
        lang={lang}
        onCycleLang={handleCycleLang}
        t={t}
        isRTL={isRTL}
      />
    );
  }

  return (
    <PassportScreen
      countries={countries}
      onSelect={handleSelectCountry}
      loading={countriesLoading || createSession.isPending}
      lang={lang}
      onCycleLang={handleCycleLang}
      t={t}
      isRTL={isRTL}
      showRestoreError={autoLoginError}
    />
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  flex: { flex: 1 },
  loadingCenter: { alignItems: 'center', justifyContent: 'center' },

  // RTL helpers
  rowRTL: { flexDirection: 'row-reverse' },

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
  countryRowRTL: {
    flexDirection: 'row-reverse',
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

  // Language button
  langButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 12,
  },
  langButtonText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700' as const,
    letterSpacing: 0.5,
  },

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

  trimNotice: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  trimNoticeText: {
    fontSize: 11,
    textAlign: 'center',
  },

  restoreErrorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  restoreErrorText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },

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
