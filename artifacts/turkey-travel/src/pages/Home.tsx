import { useState, useRef, useEffect } from 'react';
import { 
  ChevronLeft, 
  MoreVertical, 
  Search, 
  Paperclip, 
  Mic, 
  Send,
  Check,
  Building2
} from 'lucide-react';
import { 
  useCreateChatSession, 
  useGetChatMessages, 
  useSendChatMessage,
  useListCountries
} from '@workspace/api-client-react';

const STATIC_COUNTRIES = [
  { code: 'SA', name: 'Saudi Arabia', flag: '🇸🇦' },
  { code: 'EG', name: 'Egypt', flag: '🇪🇬' },
  { code: 'AE', name: 'United Arab Emirates', flag: '🇦🇪' },
  { code: 'CN', name: 'China', flag: '🇨🇳' },
  { code: 'PK', name: 'Pakistan', flag: '🇵🇰' },
  { code: 'IN', name: 'India', flag: '🇮🇳' },
  { code: 'PH', name: 'Philippines', flag: '🇵🇭' },
  { code: 'US', name: 'United States', flag: '🇺🇸' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'TR', name: 'Turkey', flag: '🇹🇷' },
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
  { code: 'SY', name: 'Syria', flag: '🇸🇾' },
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
];

const POPULAR_CODES = ['SA', 'EG', 'AE', 'CN', 'PK', 'IN', 'PH'];

export default function Home() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Queries & Mutations
  const { data: apiCountries } = useListCountries();
  const createSession = useCreateChatSession();
  const { data: apiMessages } = useGetChatMessages(sessionId || '', {
    query: { enabled: !!sessionId, queryKey: ['chatMessages', sessionId] }
  });
  const sendMessage = useSendChatMessage();

  // Combine API countries and static fallback
  const countries = apiCountries?.length ? apiCountries : STATIC_COUNTRIES;
  
  const popularCountries = POPULAR_CODES.map(
    code => countries.find(c => c.code === code)
  ).filter(Boolean) as typeof countries;

  const filteredCountries = countries.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [apiMessages, isTyping, sessionId]);

  const handleSelectCountry = (countryCode: string) => {
    setSelectedCountry(countryCode);
    createSession.mutate(
      { data: { passportCountryCode: countryCode } },
      {
        onSuccess: (session) => {
          setSessionId(session.id);
        }
      }
    );
  };

  const handleSendMessage = () => {
    if (!inputValue.trim() || !sessionId) return;
    
    const text = inputValue.trim();
    setInputValue('');
    setIsTyping(true);
    
    sendMessage.mutate(
      { sessionId, data: { text } },
      {
        onSuccess: () => {
          setIsTyping(false);
        },
        onError: () => {
          setIsTyping(false);
          // Normally would show toast here, skipping for simplicity
        }
      }
    );
  };

  const selectedCountryData = countries.find(c => c.code === selectedCountry);

  return (
    <div className="min-h-[100dvh] w-full flex flex-col items-center bg-background md:py-4">
      <div className="w-full max-w-[720px] h-[100dvh] md:h-[calc(100dvh-2rem)] md:rounded-3xl md:border md:shadow-xl bg-white flex flex-col overflow-hidden relative">
        
        {/* Header */}
        <header className="flex items-center justify-between px-4 py-3 bg-white border-b sticky top-0 z-10 shrink-0">
          <div className="flex items-center gap-3">
            <button className="p-2 -ml-2 rounded-full hover:bg-muted md:hidden" data-testid="btn-back">
              <ChevronLeft className="w-6 h-6 text-foreground" />
            </button>
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-accent">
                <Building2 className="w-5 h-5 fill-current" />
              </div>
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
            </div>
            <div>
              <h1 className="font-semibold text-[15px] leading-tight text-primary">Turkey Travel Assistant</h1>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <span className="text-green-500">Online</span>
              </p>
            </div>
          </div>
          <button className="p-2 rounded-full hover:bg-muted text-muted-foreground" data-testid="btn-menu">
            <MoreVertical className="w-5 h-5" />
          </button>
        </header>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto bg-[#F0F2F5] px-4 py-6 scroll-smooth">
          <div className="flex flex-col gap-4 max-w-full">
            
            {/* Initial Assistant Bubble */}
            <div className="flex items-start gap-2">
              <div className="w-8 h-8 rounded-full bg-amber-100 shrink-0 flex items-center justify-center text-accent shadow-sm">
                <Building2 className="w-4 h-4 fill-current" />
              </div>
              <div className="bg-white px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm text-[15px] text-foreground max-w-[85%] leading-relaxed">
                Welcome! To help you better, which country issued your passport?
              </div>
            </div>

            {/* Passport Selector Card (State 1) */}
            {!sessionId && (
              <div 
                className="bg-white rounded-2xl shadow-sm border border-border p-4 ml-10 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out"
                data-testid="passport-selector"
              >
                <h3 className="font-semibold text-primary mb-3">My passport</h3>
                
                {/* Search */}
                <div className="relative mb-4">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input 
                    type="text"
                    placeholder="Search country"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-muted/50 border border-transparent focus:bg-white focus:border-primary/20 focus:ring-2 focus:ring-primary/10 rounded-xl py-2.5 pl-9 pr-4 text-[14px] outline-none transition-all placeholder:text-muted-foreground"
                    data-testid="input-search-country"
                  />
                </div>

                {/* Popular Chips */}
                {!searchQuery && (
                  <div className="mb-4">
                    <p className="text-[13px] text-muted-foreground mb-2">Popular</p>
                    <div className="flex flex-wrap gap-2">
                      {popularCountries.map((c) => (
                        <button
                          key={c.code}
                          onClick={() => handleSelectCountry(c.code)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border bg-white hover:bg-muted transition-colors text-[14px]"
                          data-testid={`btn-popular-${c.code}`}
                        >
                          <span>{c.flag}</span>
                          <span className="font-medium text-foreground">{c.code}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Country List */}
                <div className="max-h-[240px] overflow-y-auto -mx-2 px-2 scroll-smooth">
                  {filteredCountries.map((c) => (
                    <button
                      key={c.code}
                      onClick={() => handleSelectCountry(c.code)}
                      className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-muted/60 transition-colors text-left"
                      data-testid={`btn-country-${c.code}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl leading-none">{c.flag}</span>
                        <span className="font-medium text-[15px] text-foreground">{c.name}</span>
                      </div>
                      <span className="text-[13px] text-muted-foreground font-medium">{c.code}</span>
                    </button>
                  ))}
                  {filteredCountries.length === 0 && (
                    <div className="text-center py-6 text-muted-foreground text-sm">
                      No countries found.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Conversation (State 2) */}
            {sessionId && (
              <>
                {/* User Passport Selection Bubble */}
                {selectedCountryData && (
                  <div className="flex items-end justify-end gap-2 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="bg-primary text-primary-foreground px-4 py-3 rounded-2xl rounded-tr-sm shadow-sm text-[15px] max-w-[85%]">
                      {selectedCountryData.flag} {selectedCountryData.code}
                    </div>
                  </div>
                )}
                
                {/* Second Assistant Bubble */}
                <div className="flex items-start gap-2 animate-in fade-in slide-in-from-bottom-2 duration-500 delay-150 fill-mode-both">
                  <div className="w-8 h-8 rounded-full bg-amber-100 shrink-0 flex items-center justify-center text-accent shadow-sm">
                    <Building2 className="w-4 h-4 fill-current" />
                  </div>
                  <div className="bg-white px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm text-[15px] text-foreground max-w-[85%] leading-relaxed">
                    How can I help you?
                  </div>
                </div>

                {/* Dynamic Messages */}
                {apiMessages?.map((msg, i) => (
                  <div 
                    key={msg.id} 
                    className={`flex ${msg.role === 'user' ? 'items-end justify-end' : 'items-start'} gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300`}
                  >
                    {msg.role === 'assistant' && (
                      <div className="w-8 h-8 rounded-full bg-amber-100 shrink-0 flex items-center justify-center text-accent shadow-sm">
                        <Building2 className="w-4 h-4 fill-current" />
                      </div>
                    )}
                    <div 
                      className={`px-4 py-3 rounded-2xl shadow-sm text-[15px] max-w-[85%] leading-relaxed whitespace-pre-wrap ${
                        msg.role === 'user' 
                          ? 'bg-primary text-primary-foreground rounded-tr-sm' 
                          : 'bg-white text-foreground rounded-tl-sm'
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))}
                
                {/* Local user message (optimistic UI while typing) */}
                {isTyping && inputValue.trim() === '' && (
                  <div className="flex items-start gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="w-8 h-8 rounded-full bg-amber-100 shrink-0 flex items-center justify-center text-accent shadow-sm">
                      <Building2 className="w-4 h-4 fill-current" />
                    </div>
                    <div className="bg-white px-4 py-4 rounded-2xl rounded-tl-sm shadow-sm text-[15px] text-foreground max-w-[85%] flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                      <span className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                      <span className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-full animate-bounce"></span>
                    </div>
                  </div>
                )}
              </>
            )}
            
            <div ref={messagesEndRef} className="h-2" />
          </div>
        </div>

        {/* Footer Composer */}
        <div className="bg-white shrink-0 p-3 pt-2">
          <div className="relative flex items-end gap-2 bg-muted/40 border border-border rounded-3xl px-1.5 py-1.5 focus-within:bg-white focus-within:border-primary/20 focus-within:ring-4 focus-within:ring-primary/5 transition-all">
            
            <button className="p-2.5 text-muted-foreground hover:text-foreground shrink-0 rounded-full" disabled={!sessionId} data-testid="btn-attach">
              <Paperclip className="w-5 h-5" />
            </button>
            
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder={sessionId ? "Message Turkey Travel Assistant..." : "Select your passport country to start chatting…"}
              disabled={!sessionId}
              rows={1}
              className="flex-1 bg-transparent resize-none outline-none py-3 text-[15px] placeholder:text-muted-foreground max-h-32 min-h-[44px] disabled:opacity-60"
              style={{ overflowY: inputValue.split('\n').length > 1 ? 'auto' : 'hidden' }}
              data-testid="input-message"
            />
            
            {sessionId && !inputValue.trim() ? (
              <button className="p-2.5 text-muted-foreground hover:text-foreground shrink-0 rounded-full" data-testid="btn-mic">
                <Mic className="w-5 h-5" />
              </button>
            ) : (
              <button 
                onClick={handleSendMessage}
                disabled={!sessionId || !inputValue.trim() || isTyping}
                className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white shrink-0 disabled:opacity-40 disabled:bg-muted disabled:text-muted-foreground transition-all ml-1 mr-0.5 mb-0.5"
                data-testid="btn-send"
              >
                <Send className="w-4 h-4 ml-0.5" />
              </button>
            )}
          </div>
          
          <div className="text-center mt-3 mb-1">
            <p className="text-[11px] text-muted-foreground font-medium">
              AI guidance · Human travel experts available.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
