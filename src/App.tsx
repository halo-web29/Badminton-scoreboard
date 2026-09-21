import React, { useState, useEffect } from 'react';
import {
  Trophy,
  RotateCcw,
  Plus,
  Download,
  Trash2,
  ChevronLeft,
  Edit2,
  Check,
  Palette,
  ArrowRight,
  Sparkles,
  X,
  Play as PlayIcon,
  Sun,
  Moon,
} from 'lucide-react';
import { ColorTheme, GameMode, MatchFormat, MatchState, MatchGroup, CourtSide } from './types';
import { C_BASE_LIGHT, C_BASE_DARK, THEMES, getBaseColors, getThemeConfig, TeamColorConfig } from './theme';
import { winIdx, getCourtForScore, calcNextRallyState, initializeDoublesCourts } from './bwfLogic';

interface ThemeContextType {
  isDark: boolean;
  toggleDark: () => void;
  theme: ColorTheme;
  setTheme: (t: ColorTheme) => void;
  cBase: typeof C_BASE_LIGHT;
  curTheme: { label: string; teamA: TeamColorConfig; teamB: TeamColorConfig };
}

const ThemeContext = React.createContext<ThemeContextType>({
  isDark: false,
  toggleDark: () => {},
  theme: 'coral',
  setTheme: () => {},
  cBase: C_BASE_LIGHT,
  curTheme: THEMES.coral,
});

export const useThemeContext = () => React.useContext(ThemeContext);

const S = (extra: React.CSSProperties = {}): React.CSSProperties => ({
  borderRadius: '16px',
  cursor: 'pointer',
  transition: 'all .2s ease',
  fontFamily: 'inherit',
  fontWeight: 600,
  ...extra,
});

const csvE = (v: unknown) => {
  const s = String(v == null ? '' : v);
  return /[,"\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
};

function dlCSV(fn: string, rows: (string | number)[][]) {
  const csv = rows.map((r) => r.map(csvE).join(',')).join('\n');
  const b = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const u = URL.createObjectURL(b);
  const a = document.createElement('a');
  a.href = u;
  a.download = fn;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(u), 1000);
}

const HDRS = ['Date', 'Mode', 'Format', 'Win Score', '+2 Rule', 'Player / Team 1', 'Player / Team 2', 'Score', 'Winner', 'Games', 'Status'];

const mRow = (m: MatchState) => {
  let p1: string;
  let p2: string;
  if (m.mode === 'Singles') {
    p1 = m.players[0] || 'Player 1';
    p2 = m.players[1] || 'Player 2';
  } else {
    p1 = m.teamNames?.[0] ? `${m.teamNames[0]} (${m.players[0] || '1A'} / ${m.players[1] || '1B'})` : `${m.players[0] || '1A'} / ${m.players[1] || '1B'}`;
    p2 = m.teamNames?.[1] ? `${m.teamNames[1]} (${m.players[2] || '2A'} / ${m.players[3] || '2B'})` : `${m.players[2] || '2A'} / ${m.players[3] || '2B'}`;
  }
  const sc = (m.games || [])
    .slice(0, m.gamesWonA + m.gamesWonB + (m.isDraft ? 1 : 0))
    .map((g) => `${g.scoreA}-${g.scoreB}`)
    .join('  ');
  const w = m.winner === 0 ? p1 : m.winner === 1 ? p2 : m.isDraft ? 'In Progress' : 'Incomplete';
  const gs = (m.games || []).map((g) => `${g.scoreA}-${g.scoreB}`).join('; ');
  return [m.date, m.mode, m.format, m.winScore, m.plus2 ? 'Yes' : 'No', p1, p2, sc, w, gs, m.isDraft ? 'Draft' : 'Completed'];
};

const fmtSc = (gs: { scoreA: number; scoreB: number }[]) =>
  (gs || []).map((g) => `${g.scoreA}-${g.scoreB}`).join('  ');

function Btn({
  children,
  onClick,
  disabled,
  variant = 'primary',
  size = 'md',
  style,
  id,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'teamA' | 'teamB' | 'ghost' | 'soft' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  style?: React.CSSProperties;
  id?: string;
}) {
  const { cBase, curTheme } = useThemeContext();
  const v: Record<string, React.CSSProperties> = {
    primary: { background: curTheme.teamA.primary, color: '#fff' },
    teamA: { background: curTheme.teamA.primary, color: '#fff' },
    teamB: { background: curTheme.teamB.primary, color: '#fff' },
    ghost: { background: 'transparent', color: cBase.text, border: `1.5px solid ${cBase.softBorder}` },
    soft: { background: cBase.softBg, color: cBase.text },
    danger: { background: cBase.danger, color: '#fff' },
  };
  const sz = {
    sm: { padding: '8px 14px', fontSize: '13px' },
    md: { padding: '12px 20px', fontSize: '15px' },
    lg: { padding: '16px 28px', fontSize: '17px' },
  };
  return (
    <button
      id={id}
      onClick={onClick}
      disabled={disabled}
      style={S({
        border: 'none',
        opacity: disabled ? 0.5 : 1,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        ...v[variant],
        ...sz[size],
        ...style,
      })}
    >
      {children}
    </button>
  );
}

function Card({ children, style, id }: { children: React.ReactNode; style?: React.CSSProperties; id?: string; key?: React.Key }) {
  const { cBase, isDark } = useThemeContext();
  return (
    <div
      id={id}
      style={{
        background: cBase.card,
        borderRadius: '20px',
        boxShadow: cBase.shadow,
        padding: '20px',
        border: isDark ? `1px solid ${cBase.border}` : 'none',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function Input({
  value,
  onChange,
  placeholder,
  style,
  id,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  style?: React.CSSProperties;
  id?: string;
}) {
  const { cBase, curTheme } = useThemeContext();
  return (
    <input
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        width: '100%',
        padding: '12px 16px',
        borderRadius: '14px',
        border: `1.5px solid ${cBase.softBorder}`,
        background: cBase.inputBg,
        fontSize: '15px',
        fontFamily: 'inherit',
        color: cBase.text,
        outline: 'none',
        boxSizing: 'border-box',
        ...style,
      }}
      onFocus={(e) => (e.target.style.borderColor = curTheme.teamA.primary)}
      onBlur={(e) => (e.target.style.borderColor = cBase.softBorder)}
    />
  );
}

function Toggle({ on, onClick, label, desc }: { on: boolean; onClick: () => void; label: string; desc?: string }) {
  const { cBase, isDark } = useThemeContext();
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0' }}>
      <div>
        <div style={{ fontWeight: 600, fontSize: '15px', color: cBase.text }}>{label}</div>
        {desc && <div style={{ fontSize: '13px', color: cBase.sub, marginTop: '2px' }}>{desc}</div>}
      </div>
      <div
        onClick={onClick}
        style={{
          width: '48px',
          height: '28px',
          borderRadius: '14px',
          background: on ? '#36A76A' : (isDark ? '#2A374A' : '#D9D5CC'),
          cursor: 'pointer',
          transition: 'background .2s',
          position: 'relative',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '3px',
            left: on ? '23px' : '3px',
            width: '22px',
            height: '22px',
            borderRadius: '50%',
            background: '#fff',
            boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
            transition: 'left .2s',
          }}
        />
      </div>
    </div>
  );
}

function SecTitle({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  const { cBase } = useThemeContext();
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
      <h2 style={{ fontSize: '17px', fontWeight: 700, margin: 0, color: cBase.text }}>{children}</h2>
      {action}
    </div>
  );
}

function PillBtn({
  active,
  onClick,
  children,
  activeColor,
  id,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  activeColor?: string;
  id?: string;
  key?: React.Key;
}) {
  const { cBase, curTheme } = useThemeContext();
  const ac = activeColor || curTheme.teamA.primary;
  return (
    <button
      id={id}
      onClick={onClick}
      style={S({
        flex: 1,
        padding: '14px',
        borderRadius: '14px',
        border: `2px solid ${active ? ac : cBase.softBorder}`,
        background: active ? ac : cBase.inputBg,
        color: active ? '#fff' : cBase.text,
        fontWeight: 600,
        fontSize: '15px',
      })}
    >
      {children}
    </button>
  );
}

// ----------------------------------------------------
// 1. SETUP SCREEN WITH TOP COLOR MODE OPTION
// ----------------------------------------------------
function Setup({
  st,
  set,
  theme,
  setTheme,
  goServe,
  goHist,
  recent,
}: {
  st: {
    mode: GameMode;
    format: MatchFormat;
    winScore: number;
    plus2: boolean;
    customWin: string;
    players: [string, string, string, string];
    teamNames?: [string, string];
  };
  set: (val: any) => void;
  theme: ColorTheme;
  setTheme: (t: ColorTheme) => void;
  goServe: () => void;
  goHist: () => void;
  recent: MatchState[];
}) {
  const { cBase: C_BASE, curTheme, isDark, toggleDark } = useThemeContext();
  const u = (p: any) => set({ ...st, ...p });
  const coralColors = getThemeConfig('coral', isDark);
  const greenColors = getThemeConfig('green', isDark);

  return (
    <div style={{ maxWidth: '580px', margin: '0 auto', padding: '20px 16px 48px' }}>
      {/* Top Header Row with Theme Selector & Dark Mode on Top Corner */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '10px',
          marginBottom: '20px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '12px',
              background: curTheme.teamA.primary,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
              boxShadow: `0 4px 12px ${curTheme.teamA.primary}40`,
            }}
          >
            🏸
          </div>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: 800, margin: 0, lineHeight: 1.2, color: C_BASE.text }}>Badminton</h1>
          </div>
        </div>

        {/* Right side controls: Color selection + Dark Mode Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Color Mode Option in Top Corner */}
          <div
            id="color-mode-picker"
            style={{
              display: 'flex',
              alignItems: 'center',
              background: C_BASE.card,
              padding: '3px',
              borderRadius: '12px',
              border: `1.5px solid ${C_BASE.softBorder}`,
              boxShadow: C_BASE.shadow,
              gap: '2px',
              flexShrink: 0,
            }}
          >
            <button
              id="theme-coral-btn"
              onClick={() => setTheme('coral')}
              title="Soft Blue & Soft Coral"
              style={S({
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                gap: '5px',
                padding: '6px 9px',
                borderRadius: '9px',
                border: theme === 'coral' ? `1.5px solid ${isDark ? 'rgba(255, 118, 96, 0.45)' : 'rgba(250, 110, 89, 0.25)'}` : '1.5px solid transparent',
                background: theme === 'coral' ? (isDark ? 'rgba(255, 118, 96, 0.22)' : '#FFF0ED') : 'transparent',
                color: theme === 'coral' ? (isDark ? '#FFA294' : '#B63620') : C_BASE.sub,
                fontSize: '12px',
                fontWeight: theme === 'coral' ? 700 : 500,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
              })}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '3px', flexShrink: 0 }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: coralColors.teamA.primary }} />
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: coralColors.teamB.primary }} />
              </span>
              <span style={{ textAlign: 'center' }}>
                <span className="hidden sm:inline">Blue & </span>Coral
              </span>
            </button>
            <button
              id="theme-green-btn"
              onClick={() => setTheme('green')}
              title="Soft Blue & Soft Green"
              style={S({
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                gap: '5px',
                padding: '6px 9px',
                borderRadius: '9px',
                border: theme === 'green' ? `1.5px solid ${isDark ? 'rgba(60, 216, 133, 0.45)' : 'rgba(54, 167, 106, 0.25)'}` : '1.5px solid transparent',
                background: theme === 'green' ? (isDark ? 'rgba(60, 216, 133, 0.22)' : '#EDF9F2') : 'transparent',
                color: theme === 'green' ? (isDark ? '#86EFAC' : '#18683B') : C_BASE.sub,
                fontSize: '12px',
                fontWeight: theme === 'green' ? 700 : 500,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
              })}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '3px', flexShrink: 0 }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: greenColors.teamA.primary }} />
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: greenColors.teamB.primary }} />
              </span>
              <span style={{ textAlign: 'center' }}>
                <span className="hidden sm:inline">Blue & </span>Green
              </span>
            </button>
          </div>

          {/* Dark Mode Toggle Button */}
          <button
            id="dark-mode-toggle-btn"
            onClick={toggleDark}
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            style={S({
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '38px',
              height: '38px',
              borderRadius: '12px',
              background: C_BASE.card,
              border: `1.5px solid ${C_BASE.softBorder}`,
              boxShadow: C_BASE.shadow,
              color: isDark ? '#FBBF24' : '#4B5563',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              flexShrink: 0,
            })}
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </div>

      <Card style={{ marginBottom: '16px' }}>
        <SecTitle>Game Mode</SecTitle>
        <div style={{ display: 'flex', gap: '10px' }}>
          {(['Singles', 'Doubles'] as GameMode[]).map((m) => (
            <PillBtn key={m} id={`mode-btn-${m.toLowerCase()}`} active={st.mode === m} activeColor="#4A80E8" onClick={() => u({ mode: m })}>
              {m}
            </PillBtn>
          ))}
        </div>
      </Card>

      <Card style={{ marginBottom: '16px' }}>
        <SecTitle>Match Format</SecTitle>
        <div style={{ display: 'flex', gap: '10px' }}>
          {(['Single Game', 'Best of 3'] as MatchFormat[]).map((f) => (
            <PillBtn key={f} id={`format-btn-${f.toLowerCase().replace(/\s+/g, '-')}`} active={st.format === f} activeColor="#4A80E8" onClick={() => u({ format: f })}>
              {f}
            </PillBtn>
          ))}
        </div>
      </Card>

      <Card style={{ marginBottom: '16px' }}>
        <SecTitle>Win Score</SecTitle>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
          {[11, 15, 21].map((n) => (
            <PillBtn
              key={n}
              id={`winscore-${n}`}
              active={st.winScore === n}
              activeColor="#4A80E8"
              onClick={() => u({ winScore: n, customWin: '' })}
            >
              {n}
            </PillBtn>
          ))}
        </div>
        <div style={{ fontSize: '13px', color: C_BASE.sub, marginBottom: '8px' }}>Custom win score:</div>
        <Input
          id="custom-win-input"
          value={st.customWin}
          onChange={(v) => {
            const num = v.replace(/[^0-9]/g, '');
            const n = num ? Math.min(30, parseInt(num)) : st.winScore;
            u({ customWin: num, winScore: n });
          }}
          placeholder="Enter 1-30"
          style={{ marginBottom: '14px' }}
        />
        <div style={{ background: C_BASE.softBg, borderRadius: '12px', padding: '12px 14px', fontSize: '13px', marginBottom: '6px' }}>
          {st.winScore === 21 ? (
            <span>
              📋 <strong>+2 Rule is compulsory</strong> for 21-point games. Win by 2, cap at 30. (BWF Law 7.4)
            </span>
          ) : (
            <span>
              📋 Win score: <strong>{st.winScore}</strong>. Max cap: 30.
            </span>
          )}
        </div>
        {st.winScore !== 21 && (
          <Toggle on={st.plus2} onClick={() => u({ plus2: !st.plus2 })} label="+2 Point Rule" desc="Win by 2-point lead (BWF Law 7.4)" />
        )}
      </Card>

      <Card style={{ marginBottom: '16px' }}>
        <SecTitle>
          <span>{st.mode === 'Singles' ? 'Players' : 'Teams & Players'}</span>
        </SecTitle>
        {st.mode === 'Singles' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: curTheme.teamA.text, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: curTheme.teamA.primary }} />
                Player 1
              </div>
              <Input
                id="player-1-input"
                value={st.players[0]}
                onChange={(v) => u({ players: [v, st.players[1], '', ''] })}
                placeholder="Player 1 name"
              />
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: curTheme.teamB.text, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: curTheme.teamB.primary }} />
                Player 2
              </div>
              <Input
                id="player-2-input"
                value={st.players[1]}
                onChange={(v) => u({ players: [st.players[0], v, '', ''] })}
                placeholder="Player 2 name"
              />
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {/* Team 1 Configuration */}
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: curTheme.teamA.text, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: curTheme.teamA.primary }} />
                Team 1
              </div>
              <div style={{ marginBottom: '8px' }}>
                <Input
                  id="team-1-name-input"
                  value={st.teamNames?.[0] || ''}
                  onChange={(v) => {
                    const tn: [string, string] = [v, st.teamNames?.[1] || ''];
                    u({ teamNames: tn });
                  }}
                  placeholder="Team 1 Name (Optional, e.g. Thunder)"
                />
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <Input
                  id="doubles-p1-input"
                  value={st.players[0]}
                  onChange={(v) => {
                    const p: [string, string, string, string] = [...st.players];
                    p[0] = v;
                    u({ players: p });
                  }}
                  placeholder="Player 1A"
                />
                <Input
                  id="doubles-p2-input"
                  value={st.players[1]}
                  onChange={(v) => {
                    const p: [string, string, string, string] = [...st.players];
                    p[1] = v;
                    u({ players: p });
                  }}
                  placeholder="Player 1B"
                />
              </div>
            </div>

            {/* Team 2 Configuration */}
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: curTheme.teamB.text, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: curTheme.teamB.primary }} />
                Team 2
              </div>
              <div style={{ marginBottom: '8px' }}>
                <Input
                  id="team-2-name-input"
                  value={st.teamNames?.[1] || ''}
                  onChange={(v) => {
                    const tn: [string, string] = [st.teamNames?.[0] || '', v];
                    u({ teamNames: tn });
                  }}
                  placeholder="Team 2 Name (Optional, e.g. Lightning)"
                />
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <Input
                  id="doubles-p3-input"
                  value={st.players[2]}
                  onChange={(v) => {
                    const p: [string, string, string, string] = [...st.players];
                    p[2] = v;
                    u({ players: p });
                  }}
                  placeholder="Player 2A"
                />
                <Input
                  id="doubles-p4-input"
                  value={st.players[3]}
                  onChange={(v) => {
                    const p: [string, string, string, string] = [...st.players];
                    p[3] = v;
                    u({ players: p });
                  }}
                  placeholder="Player 2B"
                />
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Continue to Serve Selection Button positioned above Recent Matches */}
      <Btn id="continue-to-serve-btn" variant="primary" size="lg" style={{ width: '100%', marginBottom: '16px' }} onClick={goServe}>
        Continue to Serve Selection →
      </Btn>

      {recent.length > 0 && (
        <Card style={{ marginBottom: '16px' }}>
          <SecTitle
            action={
              <button
                id="view-all-history-btn"
                onClick={goHist}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#4A80E8',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                View All →
              </button>
            }
          >
            Recent Matches
          </SecTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {recent.map((m, idx) => {
              const displayA = m.mode === 'Singles'
                ? (m.players[0] || 'Player 1')
                : m.teamNames?.[0]?.trim() || `${m.players[0] || '1A'} / ${m.players[1] || '1B'}`;
              const displayB = m.mode === 'Singles'
                ? (m.players[1] || 'Player 2')
                : m.teamNames?.[1]?.trim() || `${m.players[2] || '2A'} / ${m.players[3] || '2B'}`;

              return (
                <div
                  key={`${m.id}-${idx}`}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 14px',
                    borderRadius: '12px',
                    background: C_BASE.inputBg,
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '14px' }}>
                      {displayA} vs {displayB}
                    </div>
                    <div style={{ fontSize: '12px', color: C_BASE.sub }}>
                      {m.date} · {m.format}
                      {m.isDraft && (
                        <span style={{ marginLeft: '6px', color: '#B63620', fontWeight: 700 }}>
                          (Draft)
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: curTheme.teamA.primary }}>
                    {fmtSc(m.games.slice(0, m.gamesWonA + m.gamesWonB + (m.isDraft ? 1 : 0)))}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}

// ----------------------------------------------------
// 2. SERVE SELECTION SCREEN (BWF Law 11 compliant: asks Server AND Receiver)
// ----------------------------------------------------
function ServeSel({
  st,
  theme,
  startMatch,
  goBack,
}: {
  st: {
    mode: GameMode;
    format: MatchFormat;
    winScore: number;
    plus2: boolean;
    players: [string, string, string, string];
    teamNames?: [string, string];
  };
  theme: ColorTheme;
  startMatch: (srvSide: number, srvP: number, recvP: number) => void;
  goBack: () => void;
}) {
  const { cBase: C_BASE, curTheme, isDark } = useThemeContext();
  const isDoubles = st.mode === 'Doubles';

  // Selected serving side (0 for Team 1, 1 for Team 2)
  const [servingSide, setServingSide] = useState<number | null>(null);
  // Selected server player index
  const [serverPlayer, setServerPlayer] = useState<number | null>(null);
  // Selected receiver player index
  const [receiverPlayer, setReceiverPlayer] = useState<number | null>(null);

  const team1Label = isDoubles
    ? st.teamNames?.[0]?.trim() || `${st.players[0] || 'Player 1A'} / ${st.players[1] || 'Player 1B'}`
    : st.players[0] || 'Player 1';
  const team2Label = isDoubles
    ? st.teamNames?.[1]?.trim() || `${st.players[2] || 'Player 2A'} / ${st.players[3] || 'Player 2B'}`
    : st.players[1] || 'Player 2';

  // Check if selection is complete
  const canStart = isDoubles
    ? servingSide !== null && serverPlayer !== null && receiverPlayer !== null
    : servingSide !== null;

  const handleTeamSelect = (t: number) => {
    setServingSide(t);
    setServerPlayer(null);
    setReceiverPlayer(null);
  };

  const handleStart = () => {
    if (servingSide === null) return;
    if (!isDoubles) {
      startMatch(servingSide, servingSide, 1 - servingSide);
    } else {
      if (serverPlayer === null || receiverPlayer === null) return;
      startMatch(servingSide, serverPlayer, receiverPlayer);
    }
  };

  const receivingSide = servingSide !== null ? 1 - servingSide : null;
  const srvTeamColor = servingSide === 0 ? curTheme.teamA : curTheme.teamB;
  const recvTeamColor = receivingSide === 0 ? curTheme.teamA : curTheme.teamB;

  return (
    <div style={{ maxWidth: '580px', margin: '0 auto', padding: '24px 16px 48px' }}>
      <button
        id="back-to-setup-btn"
        onClick={goBack}
        style={{
          background: 'none',
          border: 'none',
          color: C_BASE.sub,
          fontSize: '15px',
          cursor: 'pointer',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontFamily: 'inherit',
          padding: 0,
        }}
      >
        <ChevronLeft size={18} /> Back to Setup
      </button>

      <h1 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '6px' }}>Opening Service Setup</h1>
      <p style={{ fontSize: '14px', color: C_BASE.sub, marginBottom: '20px' }}>
        {isDoubles
          ? 'Per BWF Law 11: select the opening serving side, the initial server, and the initial receiver.'
          : 'Tap the player who will deliver the first serve of the match.'}
      </p>

      {/* Step 1: Who serves first? */}
      <Card style={{ marginBottom: '16px' }}>
        <div style={{ fontSize: '16px', fontWeight: 700, marginBottom: '4px' }}>1. Which side serves first?</div>
        <div style={{ fontSize: '13px', color: C_BASE.sub, marginBottom: '14px' }}>
          Toss winner chooses to serve or receive (BWF Law 6).
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          {[0, 1].map((t) => {
            const isSelected = servingSide === t;
            const tColor = t === 0 ? curTheme.teamA : curTheme.teamB;
            const topHeader = !isDoubles
              ? (t === 0 ? 'PLAYER 1' : 'PLAYER 2')
              : (st.teamNames?.[t]?.trim() ? st.teamNames[t].toUpperCase() : (t === 0 ? 'TEAM 1' : 'TEAM 2'));
            const playerSubLabel = !isDoubles
              ? (st.players[t] || `Player ${t + 1}`)
              : (t === 0
                  ? `${st.players[0] || 'Player 1A'} / ${st.players[1] || 'Player 1B'}`
                  : `${st.players[2] || 'Player 2A'} / ${st.players[3] || 'Player 2B'}`);
            return (
              <button
                key={t}
                id={`serve-team-btn-${t}`}
                onClick={() => handleTeamSelect(t)}
                style={S({
                  flex: 1,
                  padding: '18px 14px',
                  borderRadius: '16px',
                  border: `2px solid ${isSelected ? tColor.primary : C_BASE.softBorder}`,
                  background: isSelected ? tColor.bg : C_BASE.inputBg,
                  color: isSelected ? tColor.text : C_BASE.text,
                  textAlign: 'center',
                })}
              >
                <div
                  style={{
                    fontSize: '13px',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.8px',
                    color: tColor.primary,
                    marginBottom: '6px',
                  }}
                >
                  {topHeader}
                </div>
                <div style={{ fontSize: '15px', fontWeight: 600, color: isSelected ? tColor.text : C_BASE.text }}>
                  {playerSubLabel}
                </div>
                {isSelected && (
                  <span
                    style={{
                      display: 'inline-block',
                      marginTop: '8px',
                      background: tColor.primary,
                      color: '#fff',
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '3px 8px',
                      borderRadius: '8px',
                    }}
                  >
                    SERVING FIRST
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </Card>

      {/* Step 2 & 3 for Doubles: Server AND Receiver */}
      {isDoubles && servingSide !== null && (
        <>
          {/* Step 2: Which player serves first? */}
          <Card style={{ marginBottom: '16px', border: `1.5px solid ${srvTeamColor.border}` }}>
            <div style={{ fontSize: '16px', fontWeight: 700, marginBottom: '4px' }}>
              2. Which player serves first?
            </div>
            <div style={{ fontSize: '13px', color: C_BASE.sub, marginBottom: '12px' }}>
              BWF Law 11.1.1: At score 0-0, this player serves from the <strong>Right Service Court</strong>. Partner takes Left court.
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              {[0, 1].map((offset) => {
                const idx = servingSide === 0 ? offset : offset + 2;
                const pName = st.players[idx] || (servingSide === 0 ? `Player 1${offset === 0 ? 'A' : 'B'}` : `Player 2${offset === 0 ? 'A' : 'B'}`);
                const isSelected = serverPlayer === idx;
                return (
                  <button
                    key={idx}
                    id={`select-server-player-${idx}`}
                    onClick={() => setServerPlayer(idx)}
                    style={S({
                      flex: 1,
                      padding: '14px',
                      borderRadius: '14px',
                      border: `2px solid ${isSelected ? srvTeamColor.primary : C_BASE.softBorder}`,
                      background: isSelected ? srvTeamColor.primary : C_BASE.inputBg,
                      color: isSelected ? '#fff' : C_BASE.text,
                      fontWeight: 600,
                      fontSize: '14px',
                      textAlign: 'center',
                    })}
                  >
                    <div>{pName}</div>
                    <div style={{ fontSize: '11px', opacity: isSelected ? 0.9 : 0.6, marginTop: '2px' }}>
                      {isSelected ? '🏸 Initial Server (Court R)' : 'Starts in Court L'}
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Step 3: Which player receives first? */}
          {serverPlayer !== null && receivingSide !== null && (
            <Card style={{ marginBottom: '16px', border: `1.5px solid ${recvTeamColor.border}` }}>
              <div style={{ fontSize: '16px', fontWeight: 700, marginBottom: '4px' }}>
                3. Which player receives first?
              </div>
              <div style={{ fontSize: '13px', color: C_BASE.sub, marginBottom: '12px' }}>
                BWF Law 9.1.3 & 11.1.4: Receiver stands <strong>diagonally opposite</strong> the server in the{' '}
                <strong>Right Service Court</strong>. Partner takes Left court.
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                {[0, 1].map((offset) => {
                  const idx = receivingSide === 0 ? offset : offset + 2;
                  const pName = st.players[idx] || (receivingSide === 0 ? `Player 1${offset === 0 ? 'A' : 'B'}` : `Player 2${offset === 0 ? 'A' : 'B'}`);
                  const isSelected = receiverPlayer === idx;
                  return (
                    <button
                      key={idx}
                      id={`select-receiver-player-${idx}`}
                      onClick={() => setReceiverPlayer(idx)}
                      style={S({
                        flex: 1,
                        padding: '14px',
                        borderRadius: '14px',
                        border: `2px solid ${isSelected ? recvTeamColor.primary : C_BASE.softBorder}`,
                        background: isSelected ? recvTeamColor.primary : C_BASE.inputBg,
                        color: isSelected ? '#fff' : C_BASE.text,
                        fontWeight: 600,
                        fontSize: '14px',
                        textAlign: 'center',
                      })}
                    >
                      <div>{pName}</div>
                      <div style={{ fontSize: '11px', opacity: isSelected ? 0.9 : 0.6, marginTop: '2px' }}>
                        {isSelected ? 'Initial Receiver (Court R)' : 'Starts in Court L'}
                      </div>
                    </button>
                  );
                })}
              </div>
            </Card>
          )}

          {/* Opening Position Confirmation Box */}
          {serverPlayer !== null && receiverPlayer !== null && (
            <div
              style={{
                background: C_BASE.softBg,
                borderRadius: '16px',
                padding: '14px 16px',
                marginBottom: '20px',
                border: `1.5px solid ${C_BASE.softBorder}`,
                fontSize: '13px',
              }}
            >
              <div style={{ fontWeight: 700, marginBottom: '6px', color: C_BASE.text, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Check size={16} color="#36A76A" /> Initial Service Court Positions (0-0)
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', color: C_BASE.sub }}>
                <div>
                  • <strong>{st.players[serverPlayer] || `Player ${serverPlayer + 1}`}</strong> serves from{' '}
                  <span style={{ color: srvTeamColor.text, fontWeight: 700 }}>Right Court (R)</span>
                </div>
                <div>
                  • <strong>{st.players[receiverPlayer] || `Player ${receiverPlayer + 1}`}</strong> receives in{' '}
                  <span style={{ color: recvTeamColor.text, fontWeight: 700 }}>Right Court (R)</span> (diagonally opposite)
                </div>
              </div>
            </div>
          )}
        </>
      )}

      <Btn
        id="start-match-btn"
        variant="primary"
        size="lg"
        style={{ width: '100%' }}
        disabled={!canStart}
        onClick={handleStart}
      >
        Start Match
      </Btn>
    </div>
  );
}

// ----------------------------------------------------
// 3. PLAY SCREEN (Dedicated Serve/Receive Row, No Jumping, 2 Team Colors)
// ----------------------------------------------------
function Play({
  match,
  setMatch,
  theme,
  goComplete,
  goHome,
  saveDraft,
}: {
  match: MatchState;
  setMatch: React.Dispatch<React.SetStateAction<MatchState | null>>;
  theme: ColorTheme;
  goComplete: (m: MatchState) => void;
  goHome: () => void;
  saveDraft: (m: MatchState) => void;
}) {
  const { cBase: C_BASE, curTheme, isDark } = useThemeContext();
  const [hist, setHist] = useState<MatchState[]>([]);
  const [showEnd, setShowEnd] = useState(false);
  const [showSwitch, setShowSwitch] = useState(false);
  const [switchNote, setSwitchNote] = useState(false);
  const [isPortrait, setIsPortrait] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.innerHeight > window.innerWidth;
  });
  const [showOrientationBanner, setShowOrientationBanner] = useState(true);

  useEffect(() => {
    const handleOrientation = () => {
      setIsPortrait(window.innerHeight > window.innerWidth);
    };
    window.addEventListener('resize', handleOrientation);
    window.addEventListener('orientationchange', handleOrientation);
    return () => {
      window.removeEventListener('resize', handleOrientation);
      window.removeEventListener('orientationchange', handleOrientation);
    };
  }, []);

  // Next Game Setup state (for Best of 3 between games)
  const [nextGameModal, setNextGameModal] = useState<{
    show: boolean;
    winningSide: number;
    nextGameIdx: number;
    chosenServer: number | null;
    chosenReceiver: number | null;
  } | null>(null);

  const cg = match.games[match.currentGame];
  const isDoubles = match.mode === 'Doubles';
  const isG3Switch = match.format === 'Best of 3' && match.winScore === 21 && match.currentGame === 2;

  const undo = () => {
    if (!hist.length) return;
    setMatch(hist[hist.length - 1]);
    setHist(hist.slice(0, -1));
  };

  const score = (side: number) => {
    // Snapshot state for robust undo
    const snap: MatchState = JSON.parse(JSON.stringify(match));
    setHist([...hist, snap]);

    const g = { ...match.games[match.currentGame] };
    if (side === 0) g.scoreA = Math.min(30, g.scoreA + 1);
    else g.scoreB = Math.min(30, g.scoreB + 1);

    const w = winIdx(g.scoreA, g.scoreB, match.winScore, match.plus2);
    const games = [...match.games];
    games[match.currentGame] = g;

    // Check if game won
    if (w >= 0) {
      g.winner = w;
      const gwa = match.gamesWonA + (w === 0 ? 1 : 0);
      const gwb = match.gamesWonB + (w === 1 ? 1 : 0);
      const moreGames = match.format === 'Best of 3' && gwa < 2 && gwb < 2;

      if (moreGames) {
        const nextGameIdx = match.currentGame + 1;
        games[nextGameIdx] = { scoreA: 0, scoreB: 0, winner: -1 };

        if (isDoubles) {
          // BWF Law 11.6: winner of game serves first, either player may serve, either loser may receive
          const defaultServer = w === 0 ? 0 : 2;
          const defaultReceiver = w === 0 ? 2 : 0;
          setNextGameModal({
            show: true,
            winningSide: w,
            nextGameIdx,
            chosenServer: defaultServer,
            chosenReceiver: defaultReceiver,
          });
          setMatch({
            ...match,
            games,
            gamesWonA: gwa,
            gamesWonB: gwb,
          });
          return;
        } else {
          // In singles, winner serves first
          const nextCourts = {
            0: 'R' as CourtSide,
            1: 'R' as CourtSide,
            2: 'R' as CourtSide,
            3: 'L' as CourtSide,
          };
          setMatch({
            ...match,
            games,
            gamesWonA: gwa,
            gamesWonB: gwb,
            currentGame: nextGameIdx,
            servingSide: w,
            currentServer: w,
            currentReceiver: 1 - w,
            courtPositions: nextCourts,
            sidesSwitched: false,
          });
          return;
        }
      } else {
        // Match over
        const fin: MatchState = {
          ...match,
          games,
          gamesWonA: gwa,
          gamesWonB: gwb,
          winner: w,
        };
        setMatch(fin);
        setTimeout(() => goComplete(fin), 350);
        return;
      }
    }

    // Game continues: calculate next rally state via airtight BWF Law 11
    const nextState = calcNextRallyState(
      match.mode,
      side,
      match.servingSide,
      g.scoreA,
      g.scoreB,
      match.currentServer,
      match.currentReceiver,
      match.courtPositions,
    );

    setMatch({
      ...match,
      games,
      servingSide: nextState.nextServingSide,
      currentServer: nextState.nextServer,
      currentReceiver: nextState.nextReceiver,
      courtPositions: nextState.nextCourtPositions,
    });

    // Check 11-point switch ends in Game 3
    if (isG3Switch && !match.sidesSwitched && ((side === 0 && g.scoreA === 11) || (side === 1 && g.scoreB === 11))) {
      setTimeout(() => setShowSwitch(true), 250);
    }
  };

  const confirmNextGame = () => {
    if (!nextGameModal) return;
    const { winningSide, nextGameIdx, chosenServer, chosenReceiver } = nextGameModal;
    const srv = chosenServer ?? (winningSide === 0 ? 0 : 2);
    const recv = chosenReceiver ?? (winningSide === 0 ? 2 : 0);

    const init = initializeDoublesCourts(winningSide, srv, recv);
    setMatch({
      ...match,
      currentGame: nextGameIdx,
      servingSide: init.servingSide,
      currentServer: init.currentServer,
      currentReceiver: init.currentReceiver,
      courtPositions: init.courtPositions,
      sidesSwitched: false,
    });
    setNextGameModal(null);
  };

  const confirmSw = (didSwitch: boolean) => {
    setShowSwitch(false);
    if (didSwitch) {
      setSwitchNote(true);
      setMatch({ ...match, sidesSwitched: true });
      setTimeout(() => setSwitchNote(false), 4000);
    }
  };

  // Render team score card with responsive dimensions and soft transparent backgrounds
  // ensuring mobile screen fit, clean aesthetic, and zero redundant clutter.
  const renderTeamBox = (side: number) => {
    const isTeamA = side === 0;
    const teamTheme = isTeamA ? curTheme.teamA : curTheme.teamB;
    const sc = isTeamA ? cg.scoreA : cg.scoreB;
    const isServingSide = match.servingSide === side;

    // In Doubles: 0,1 for Team A, 2,3 for Team B
    const playerIndices = isTeamA ? [0, 1] : [2, 3];

    // Determine current court for the server or receiver
    const servingCourt = getCourtForScore(sc);

    const teamCustomName = match.teamNames?.[side]?.trim();

    return (
      <div
        key={side}
        id={`team-box-${side}`}
        onClick={() => score(side)}
        style={{
          flex: 1,
          height: '100%',
          minHeight: 0,
          borderRadius: '20px',
          border: `2.5px solid ${isServingSide ? teamTheme.activeBorder : teamTheme.border}`,
          background: isServingSide ? teamTheme.serveBg : teamTheme.bg,
          boxShadow: isServingSide ? `0 8px 24px rgba(0,0,0,0.06), 0 0 0 1px ${teamTheme.primary}` : C_BASE.shadow,
          padding: '12px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          cursor: 'pointer',
          userSelect: 'none',
          WebkitTapHighlightColor: 'transparent',
          transition: 'border-color .15s ease, background .15s ease, box-shadow .15s ease',
          boxSizing: 'border-box',
          overflow: 'hidden',
        }}
      >
        {/* ROW 1: Header / Team Label (Only in Doubles when team name or team structure is relevant) */}
        {isDoubles ? (
          <div
            style={{
              height: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxSizing: 'border-box',
              flexShrink: 0,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span
                style={{
                  width: '9px',
                  height: '9px',
                  borderRadius: '50%',
                  background: teamTheme.primary,
                  display: 'inline-block',
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  fontSize: '13px',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.6px',
                  color: teamTheme.text,
                }}
              >
                {teamCustomName || (isTeamA ? 'Team 1' : 'Team 2')}
              </span>
            </div>
            {isServingSide && (
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  color: teamTheme.primary,
                  background: teamTheme.pillBg,
                  padding: '2px 7px',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px',
                }}
              >
                🏸 SERVING
              </span>
            )}
          </div>
        ) : (
          <div
            style={{
              height: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxSizing: 'border-box',
              flexShrink: 0,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span
                style={{
                  width: '9px',
                  height: '9px',
                  borderRadius: '50%',
                  background: teamTheme.primary,
                  display: 'inline-block',
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  fontSize: '13px',
                  fontWeight: 700,
                  color: teamTheme.primary,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: '120px',
                }}
              >
                {side === 0 ? 'Player 1' : 'Player 2'}
              </span>
            </div>
            {isServingSide && (
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  color: teamTheme.primary,
                  background: teamTheme.pillBg,
                  padding: '2px 7px',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px',
                }}
              >
                🏸 SERVING
              </span>
            )}
          </div>
        )}

        {/* ROW 2: Player Roster Area with Semi-transparent Soft Blocks */}
        <div
          style={{
            height: isDoubles ? '76px' : '40px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            gap: '5px',
            boxSizing: 'border-box',
            flexShrink: 0,
          }}
        >
          {!isDoubles ? (
            // Singles Roster Item
            <div
              style={{
                height: '38px',
                background: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.72)',
                borderRadius: '10px',
                padding: '0 10px',
                border: `1.5px solid ${isServingSide ? teamTheme.border : (isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0,0,0,0.06)')}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                boxSizing: 'border-box',
                backdropFilter: 'blur(4px)',
                WebkitBackdropFilter: 'blur(4px)',
              }}
            >
              <span
                style={{
                  fontSize: '13px',
                  fontWeight: 700,
                  color: C_BASE.text,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: '120px',
                }}
              >
                {match.players[side] || `Player ${side + 1}`}
              </span>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: isServingSide ? teamTheme.primary : C_BASE.sub,
                  background: isServingSide ? teamTheme.pillBg : (isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0,0,0,0.04)'),
                  padding: '2px 7px',
                  borderRadius: '6px',
                  flexShrink: 0,
                }}
              >
                {isServingSide ? `🏸 Court ${servingCourt}` : `Court ${servingCourt}`}
              </span>
            </div>
          ) : (
            // Doubles Roster Items (2 soft semi-transparent chips)
            playerIndices.map((idx) => {
              const pName =
                match.players[idx] ||
                (isTeamA ? `Player 1${idx === 0 ? 'A' : 'B'}` : `Player 2${idx === 2 ? 'A' : 'B'}`);
              const pCourt = match.courtPositions[idx] || 'R';
              const isCurrentServer = match.currentServer === idx;
              const isCurrentReceiver = match.currentReceiver === idx;

              let badgeText = `Court ${pCourt}`;
              let badgeBg = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0,0,0,0.04)';
              let badgeColor = C_BASE.sub;

              if (isCurrentServer) {
                badgeText = `🏸 SERVE · ${pCourt}`;
                badgeBg = teamTheme.primary;
                badgeColor = '#FFFFFF';
              } else if (isCurrentReceiver) {
                badgeText = `RECV · ${pCourt}`;
                badgeBg = teamTheme.primary;
                badgeColor = '#FFFFFF';
              }

              return (
                <div
                  key={idx}
                  style={{
                    height: '35px',
                    background: isCurrentServer || isCurrentReceiver
                      ? (isDark ? 'rgba(255, 255, 255, 0.14)' : 'rgba(255, 255, 255, 0.85)')
                      : (isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(255, 255, 255, 0.65)'),
                    borderRadius: '10px',
                    padding: '0 8px',
                    border: `1.5px solid ${
                      isCurrentServer || isCurrentReceiver ? teamTheme.primary : (isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0,0,0,0.06)')
                    }`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    boxSizing: 'border-box',
                    backdropFilter: 'blur(4px)',
                    WebkitBackdropFilter: 'blur(4px)',
                  }}
                >
                  <span
                    style={{
                      fontSize: '12px',
                      fontWeight: isCurrentServer || isCurrentReceiver ? 700 : 600,
                      color: C_BASE.text,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      maxWidth: '110px',
                    }}
                  >
                    {pName}
                  </span>
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      color: badgeColor,
                      background: badgeBg,
                      padding: '2px 6px',
                      borderRadius: '6px',
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                    }}
                  >
                    {badgeText}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* ROW 3: Responsive Clean Score Block */}
        <div
          style={{
            flex: 1,
            minHeight: '80px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            boxSizing: 'border-box',
            padding: '8px 0',
          }}
        >
          <div
            id={`score-display-${side}`}
            style={{
              fontSize: 'clamp(52px, 14vw, 84px)',
              fontWeight: 800,
              lineHeight: 1,
              color: teamTheme.text,
              fontVariantNumeric: 'tabular-nums',
              letterSpacing: '-1px',
            }}
          >
            {sc}
          </div>
          <div
            style={{
              fontSize: '11px',
              color: C_BASE.sub,
              fontWeight: 700,
              letterSpacing: '0.8px',
              height: '16px',
              lineHeight: '16px',
              marginTop: '6px',
              textTransform: 'uppercase',
              opacity: 0.85,
            }}
          >
            Tap to Score +1
          </div>
        </div>
      </div>
    );
  };

  return (
    <div
      style={{
        height: '100dvh',
        maxHeight: '100dvh',
        background: C_BASE.bg,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Small floating orientation recommendation banner */}
      {showOrientationBanner && isPortrait && (
        <div
          id="orientation-banner"
          style={{
            position: 'absolute',
            top: '50px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 40,
            background: 'rgba(23, 30, 43, 0.92)',
            color: '#FFFFFF',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            borderRadius: '999px',
            padding: '5px 10px 5px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.18)',
            fontSize: '12px',
            fontWeight: 600,
            maxWidth: '92%',
            boxSizing: 'border-box',
          }}
        >
          <span style={{ fontSize: '13px' }}>🔄</span>
          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            Rotate horizontal for best experience
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowOrientationBanner(false);
            }}
            style={{
              background: 'rgba(255,255,255,0.22)',
              border: 'none',
              borderRadius: '50%',
              width: '18px',
              height: '18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              cursor: 'pointer',
              padding: 0,
              flexShrink: 0,
              fontSize: '13px',
              lineHeight: 1,
            }}
            title="Dismiss reminder"
          >
            ×
          </button>
        </div>
      )}

      {/* Top Match Navigation Bar */}
      <div
        style={{
          background: C_BASE.card,
          padding: '8px 14px',
          boxShadow: C_BASE.shadow,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              background: '#4A80E8',
              color: '#fff',
              padding: '3px 8px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 700,
            }}
          >
            Game {match.currentGame + 1}
          </span>
          <span style={{ fontSize: '12px', color: C_BASE.sub, fontWeight: 600 }}>
            {match.mode} · To {match.winScore}
            {match.plus2 ? ' (+2)' : ''}
          </span>
        </div>

        {/* Games Won Tracker & Undo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '15px', fontWeight: 800, color: curTheme.teamA.primary }}>
              {match.gamesWonA}
            </span>
            <span style={{ fontSize: '12px', color: C_BASE.sub, fontWeight: 700 }}>-</span>
            <span style={{ fontSize: '15px', fontWeight: 800, color: curTheme.teamB.primary }}>
              {match.gamesWonB}
            </span>
          </div>

          <button
            id="undo-point-btn"
            onClick={undo}
            disabled={!hist.length}
            style={{
              background: C_BASE.softBg,
              border: 'none',
              borderRadius: '10px',
              padding: '6px 10px',
              cursor: hist.length ? 'pointer' : 'not-allowed',
              opacity: hist.length ? 1 : 0.4,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '12px',
              fontWeight: 600,
              fontFamily: 'inherit',
            }}
          >
            <RotateCcw size={13} /> Undo
          </button>
        </div>
      </div>

      {/* Deciding Game Switch Alert */}
      {switchNote && (
        <div
          style={{
            background: '#E8F8EE',
            color: '#18683B',
            padding: '6px 14px',
            textAlign: 'center',
            fontSize: '13px',
            fontWeight: 700,
            borderBottom: '1px solid #BFE9D0',
            flexShrink: 0,
          }}
        >
          ✓ Sides switched at 11 points (BWF Law 8.1.3)
        </div>
      )}

      {/* Main Scoring Court Area */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          gap: '10px',
          padding: '8px 12px',
          maxWidth: '780px',
          margin: '0 auto',
          width: '100%',
          boxSizing: 'border-box',
          alignItems: 'stretch',
          minHeight: 0,
        }}
      >
        {renderTeamBox(0)}
        {renderTeamBox(1)}
      </div>

      {/* Bottom Bar with End Match Button */}
      <div style={{ padding: '0 12px 8px', maxWidth: '780px', margin: '0 auto', width: '100%', boxSizing: 'border-box', flexShrink: 0 }}>
        <Btn
          id="end-match-modal-trigger-btn"
          variant="ghost"
          size="sm"
          style={{ width: '100%', padding: '6px 14px', fontSize: '13px' }}
          onClick={() => setShowEnd(true)}
        >
          End Match
        </Btn>
      </div>

      {/* End Match Options Dialog */}
      {showEnd && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '20px',
          }}
        >
          <Card style={{ width: '100%', maxWidth: '380px', textAlign: 'center', position: 'relative', padding: '24px 20px' }}>
            {/* Exit (✕) button in the top corner to close modal and resume playing */}
            <button
              id="close-end-match-modal-btn"
              onClick={() => setShowEnd(false)}
              style={{
                position: 'absolute',
                top: '14px',
                right: '14px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: C_BASE.sub,
                display: 'flex',
                padding: '4px',
              }}
              title="Close and resume match"
            >
              <X size={20} />
            </button>

            <div style={{ fontSize: '20px', fontWeight: 800, marginBottom: '6px' }}>End Match?</div>
            <div style={{ fontSize: '13px', color: C_BASE.sub, marginBottom: '20px', lineHeight: 1.4 }}>
              Choose how you would like to handle this match in progress:
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {/* Option 1: Save as Draft */}
              <Btn
                id="save-draft-match-btn"
                variant="teamA"
                size="md"
                style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
                onClick={() => {
                  setShowEnd(false);
                  saveDraft(match);
                }}
              >
                <span>💾</span> Save as Draft & Exit
              </Btn>

              {/* Option 2: End & Complete Match */}
              <Btn
                id="finalize-complete-match-btn"
                variant="primary"
                size="md"
                style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
                onClick={() => {
                  setShowEnd(false);
                  const curGame = match.games[match.currentGame];
                  let w = 0;
                  if (match.gamesWonA > match.gamesWonB) w = 0;
                  else if (match.gamesWonB > match.gamesWonA) w = 1;
                  else if (curGame.scoreA > curGame.scoreB) w = 0;
                  else if (curGame.scoreB > curGame.scoreA) w = 1;

                  const finalizedMatch: MatchState = {
                    ...match,
                    winner: w,
                    isDraft: false,
                  };
                  goComplete(finalizedMatch);
                }}
              >
                <span>🏆</span> End & Complete Match
              </Btn>
            </div>
          </Card>
        </div>
      )}

      {/* 11-Point End Switch Dialog */}
      {showSwitch && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '20px',
          }}
        >
          <Card style={{ width: '100%', maxWidth: '360px', textAlign: 'center' }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>🔄</div>
            <div style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>Switch Ends?</div>
            <div style={{ fontSize: '13px', color: C_BASE.sub, marginBottom: '20px' }}>
              BWF Law 8.1.3: Players shall change ends in the third game when a side first scores 11 points.
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <Btn id="skip-switch-btn" variant="soft" style={{ flex: 1 }} onClick={() => confirmSw(false)}>
                No
              </Btn>
              <Btn id="confirm-switch-btn" variant="teamA" style={{ flex: 1 }} onClick={() => confirmSw(true)}>
                Yes, Switched
              </Btn>
            </div>
          </Card>
        </div>
      )}

      {/* Between Game Setup Modal (BWF Law 11.6 for Doubles) */}
      {nextGameModal && nextGameModal.show && (() => {
        const serverSide = nextGameModal.winningSide;
        const receiverSide = 1 - serverSide;
        const srvTheme = serverSide === 0 ? curTheme.teamA : curTheme.teamB;
        const recvTheme = receiverSide === 0 ? curTheme.teamA : curTheme.teamB;
        const srvTeamName = serverSide === 0
          ? (match.teamNames?.[0]?.trim() || 'Team 1')
          : (match.teamNames?.[1]?.trim() || 'Team 2');
        const recvTeamName = receiverSide === 0
          ? (match.teamNames?.[0]?.trim() || 'Team 1')
          : (match.teamNames?.[1]?.trim() || 'Team 2');

        return (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 100,
              padding: '20px',
            }}
          >
            <Card style={{ width: '100%', maxWidth: '440px' }}>
              <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                <span style={{ fontSize: '32px' }}>🏸</span>
                <h2 style={{ fontSize: '20px', fontWeight: 800, margin: '8px 0 4px' }}>
                  Game {nextGameModal.nextGameIdx} Complete!
                </h2>
                <p style={{ fontSize: '13px', color: C_BASE.sub, margin: 0 }}>
                  <strong style={{ color: srvTheme.primary }}>{srvTeamName}</strong> won the game and will serve first in Game{' '}
                  {nextGameModal.nextGameIdx + 1} (BWF Law 7.6).
                </p>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: srvTheme.primary }} />
                  <span>Choose Server for <strong style={{ color: srvTheme.text }}>{srvTeamName}</strong>:</span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {[0, 1].map((offset) => {
                    const idx = serverSide === 0 ? offset : offset + 2;
                    const isSel = nextGameModal.chosenServer === idx;
                    return (
                      <button
                        key={idx}
                        id={`next-game-server-${idx}`}
                        onClick={() => setNextGameModal({ ...nextGameModal, chosenServer: idx })}
                        style={S({
                          flex: 1,
                          padding: '10px',
                          borderRadius: '12px',
                          border: `2px solid ${isSel ? srvTheme.primary : C_BASE.softBorder}`,
                          background: isSel ? srvTheme.primary : C_BASE.inputBg,
                          color: isSel ? '#fff' : C_BASE.text,
                          fontWeight: isSel ? 700 : 500,
                          fontSize: '13px',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        })}
                      >
                        {match.players[idx] || `Player ${idx + 1}`}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: recvTheme.primary }} />
                  <span>Choose Receiver for <strong style={{ color: recvTheme.text }}>{recvTeamName}</strong>:</span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {[0, 1].map((offset) => {
                    const idx = receiverSide === 0 ? offset : offset + 2;
                    const isSel = nextGameModal.chosenReceiver === idx;
                    return (
                      <button
                        key={idx}
                        id={`next-game-receiver-${idx}`}
                        onClick={() => setNextGameModal({ ...nextGameModal, chosenReceiver: idx })}
                        style={S({
                          flex: 1,
                          padding: '10px',
                          borderRadius: '12px',
                          border: `2px solid ${isSel ? recvTheme.primary : C_BASE.softBorder}`,
                          background: isSel ? recvTheme.primary : C_BASE.inputBg,
                          color: isSel ? '#fff' : C_BASE.text,
                          fontWeight: isSel ? 700 : 500,
                          fontSize: '13px',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        })}
                      >
                        {match.players[idx] || `Player ${idx + 1}`}
                      </button>
                    );
                  })}
                </div>
              </div>

              <Btn
                id="confirm-next-game-btn"
                variant="primary"
                size="lg"
                style={{ width: '100%' }}
                onClick={confirmNextGame}
              >
                Start Game {nextGameModal.nextGameIdx + 1}
              </Btn>
            </Card>
          </div>
        );
      })()}
    </div>
  );
}

// ----------------------------------------------------
// 4. COMPLETE SCREEN (Match result, Group assignment, Rematch)
// ----------------------------------------------------
function Complete({
  match,
  setMatch,
  theme,
  goSetup,
  goServe,
  goHist,
  groups,
  setGroups,
  saveMatch,
}: {
  match: MatchState;
  setMatch: React.Dispatch<React.SetStateAction<MatchState | null>>;
  theme: ColorTheme;
  goSetup: (preset?: any) => void;
  goServe: () => void;
  goHist: () => void;
  groups: MatchGroup[];
  setGroups: React.Dispatch<React.SetStateAction<MatchGroup[]>>;
  saveMatch: () => void;
}) {
  const { cBase: C_BASE, curTheme, isDark } = useThemeContext();
  const [newGrp, setNewGrp] = useState('');
  const [added, setAdded] = useState<string[]>([]);

  const t1Name =
    match.mode === 'Singles'
      ? match.players[0] || 'Player 1'
      : match.teamNames?.[0]?.trim() || `${match.players[0] || '1A'} / ${match.players[1] || '1B'}`;
  const t2Name =
    match.mode === 'Singles'
      ? match.players[1] || 'Player 2'
      : match.teamNames?.[1]?.trim() || `${match.players[2] || '2A'} / ${match.players[3] || '2B'}`;

  const winnerName = match.winner === 0 ? t1Name : t2Name;
  const winnerColor = match.winner === 0 ? curTheme.teamA.primary : curTheme.teamB.primary;

  const addGrp = (id: string) => {
    if (added.includes(id)) return;
    setAdded([...added, id]);
    const g = groups.find((x) => x.id === id);
    if (g) {
      g.matches.push(match.id);
      setGroups([...groups]);
    }
  };

  const createGrp = () => {
    if (!newGrp.trim()) return;
    const ng: MatchGroup = { id: 'g' + Date.now(), name: newGrp.trim(), matches: [match.id] };
    setGroups([...groups, ng]);
    setAdded([...added, ng.id]);
    setNewGrp('');
  };

  const rematch = () => {
    saveMatch();
    goServe();
  };

  const playedGames = match.games.slice(0, match.gamesWonA + match.gamesWonB);

  return (
    <div style={{ maxWidth: '560px', margin: '0 auto', padding: '32px 16px 48px', textAlign: 'center' }}>
      <div
        style={{
          width: '80px',
          height: '80px',
          borderRadius: '24px',
          background: 'linear-gradient(135deg, #FFD700, #FFA500)',
          margin: '0 auto 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 8px 24px rgba(255,165,0,0.3)',
        }}
      >
        <Trophy size={40} color="#fff" />
      </div>

      <h1 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '4px', color: winnerColor }}>
        {winnerName}
      </h1>
      <p style={{ fontSize: '16px', color: C_BASE.sub, marginBottom: '24px' }}>wins the match! 🎉</p>

      {/* Score Summary Card */}
      <Card style={{ marginBottom: '16px', textAlign: 'left' }}>
        <div style={{ fontSize: '16px', fontWeight: 700, marginBottom: '14px' }}>Final Score</div>
        {[
          { name: t1Name, gamesWon: match.gamesWonA, isWin: match.winner === 0, color: curTheme.teamA },
          { name: t2Name, gamesWon: match.gamesWonB, isWin: match.winner === 1, color: curTheme.teamB },
        ].map((t, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '14px',
              borderTop: i ? `1px solid ${C_BASE.border}` : 'none',
              paddingTop: i ? '14px' : '0',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: t.color.primary }} />
              <span style={{ fontSize: '15px', fontWeight: 600, color: C_BASE.text }}>{t.name}</span>
            </div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: t.isWin ? t.color.primary : C_BASE.sub }}>
              {t.gamesWon}
            </div>
          </div>
        ))}

        <div style={{ borderTop: `1px solid ${C_BASE.border}`, paddingTop: '14px' }}>
          <div style={{ fontSize: '13px', color: C_BASE.sub, marginBottom: '8px' }}>Game by game:</div>
          {playedGames.map((g, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '16px',
                padding: '6px 0',
                fontSize: '15px',
                fontWeight: 600,
              }}
            >
              <span style={{ color: g.winner === 0 ? curTheme.teamA.primary : C_BASE.sub, minWidth: '40px', textAlign: 'right' }}>
                {g.scoreA}
              </span>
              <span style={{ color: C_BASE.sub }}>Game {i + 1}</span>
              <span style={{ color: g.winner === 1 ? curTheme.teamB.primary : C_BASE.sub, minWidth: '40px', textAlign: 'left' }}>
                {g.scoreB}
              </span>
            </div>
          ))}
        </div>
      </Card>

      {/* Save to Group */}
      <Card style={{ marginBottom: '16px', textAlign: 'left' }}>
        <div style={{ fontSize: '16px', fontWeight: 700, marginBottom: '14px' }}>Save to Group?</div>
        {groups.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '14px' }}>
            {groups.map((g) => (
              <button
                key={g.id}
                onClick={() => addGrp(g.id)}
                disabled={added.includes(g.id)}
                style={S({
                  padding: '8px 14px',
                  borderRadius: '12px',
                  border: `1.5px solid ${added.includes(g.id) ? '#36A76A' : C_BASE.softBorder}`,
                  background: added.includes(g.id) ? (isDark ? 'rgba(54, 167, 106, 0.25)' : '#E8F8EE') : C_BASE.inputBg,
                  color: added.includes(g.id) ? (isDark ? '#86EFAC' : '#18683B') : C_BASE.text,
                  fontSize: '13px',
                  cursor: added.includes(g.id) ? 'default' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                })}
              >
                {added.includes(g.id) && <Check size={14} />}
                {g.name}
              </button>
            ))}
          </div>
        )}
        <div style={{ display: 'flex', gap: '8px' }}>
          <Input value={newGrp} onChange={setNewGrp} placeholder="New group name" style={{ flex: 1 }} />
          <Btn variant="primary" onClick={createGrp} disabled={!newGrp.trim()}>
            <Plus size={16} /> Create
          </Btn>
        </div>
        <button
          onClick={() => {
            saveMatch();
            goHist();
          }}
          style={{
            background: 'none',
            border: 'none',
            color: C_BASE.sub,
            fontSize: '14px',
            cursor: 'pointer',
            marginTop: '12px',
            fontFamily: 'inherit',
            padding: 0,
          }}
        >
          Skip →
        </button>
      </Card>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '10px' }}>
        <Btn id="rematch-btn" variant="soft" style={{ flex: 1 }} onClick={rematch}>
          <RotateCcw size={16} /> Rematch
        </Btn>
        <Btn
          id="new-match-btn"
          variant="primary"
          style={{ flex: 1 }}
          onClick={() => {
            saveMatch();
            goSetup();
          }}
        >
          New Match
        </Btn>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// 5. HISTORY SCREEN (Group filtering, CSV download, Reuse)
// ----------------------------------------------------
function History({
  matches,
  setMatches,
  groups,
  setGroups,
  goSetup,
  resumeMatch,
  goBack,
}: {
  matches: MatchState[];
  setMatches: React.Dispatch<React.SetStateAction<MatchState[]>>;
  groups: MatchGroup[];
  setGroups: React.Dispatch<React.SetStateAction<MatchGroup[]>>;
  goSetup: (m: any) => void;
  resumeMatch: (m: MatchState) => void;
  goBack: () => void;
}) {
  const { cBase: C_BASE, curTheme, isDark } = useThemeContext();
  const [selGrp, setSelGrp] = useState<string | null>(null);
  const [newGrp, setNewGrp] = useState('');
  const [editGrp, setEditGrp] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const createGrp = () => {
    if (!newGrp.trim()) return;
    setGroups([...groups, { id: 'g' + Date.now(), name: newGrp.trim(), matches: [] }]);
    setNewGrp('');
  };

  const delGrp = (id: string) => {
    setGroups(groups.filter((g) => g.id !== id));
    if (selGrp === id) setSelGrp(null);
  };

  const renameGrp = (g: MatchGroup) => {
    if (!editName.trim()) return;
    g.name = editName.trim();
    setGroups([...groups]);
    setEditGrp(null);
  };

  const delMatch = (id: string) => {
    setMatches(matches.filter((m) => m.id !== id));
    setGroups(groups.map((g) => ({ ...g, matches: g.matches.filter((mid) => mid !== id) })));
  };

  const reuse = (m: MatchState) =>
    goSetup({
      mode: m.mode,
      format: m.format,
      winScore: m.winScore,
      plus2: m.plus2,
      players: [...m.players],
      teamNames: m.teamNames ? [...m.teamNames] : undefined,
    });

  const dlGrp = (g: MatchGroup) => {
    const gm = matches.filter((m) => g.matches.includes(m.id));
    dlCSV(`${g.name.replace(/\s+/g, '_')}_matches.csv`, [HDRS, ...gm.map(mRow)]);
  };

  const dlAll = () => dlCSV('all_matches.csv', [HDRS, ...matches.map(mRow)]);

  const clearAll = () => {
    setShowClearConfirm(true);
  };

  const mCard = (m: MatchState, idx: number = 0, prefix: string = 'hist') => (
    <Card key={`${prefix}-${m.id}-${idx}`} style={{ marginBottom: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '13px', color: C_BASE.sub }}>{m.date}</span>
            {m.isDraft && (
              <span
                style={{
                  background: isDark ? 'rgba(255, 118, 96, 0.2)' : '#FFF0ED',
                  color: isDark ? '#FFA294' : '#C93B2B',
                  borderRadius: '6px',
                  padding: '1px 6px',
                  fontSize: '11px',
                  fontWeight: 700,
                }}
              >
                Draft
              </span>
            )}
          </div>
          <div style={{ fontSize: '12px', color: C_BASE.sub, marginTop: '2px' }}>
            {m.mode} · {m.format} · To {m.winScore} {m.plus2 ? '(+2)' : ''}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          {m.isDraft ? (
            <button
              onClick={() => resumeMatch(m)}
              style={{
                background: curTheme.teamA.primary,
                border: 'none',
                borderRadius: '10px',
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                color: '#FFFFFF',
                fontFamily: 'inherit',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <PlayIcon size={12} fill="#FFFFFF" /> Resume
            </button>
          ) : (
            <button
              onClick={() => reuse(m)}
              style={{
                background: C_BASE.softBg,
                border: 'none',
                borderRadius: '10px',
                padding: '6px 10px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                color: C_BASE.text,
                fontFamily: 'inherit',
              }}
            >
              Reuse
            </button>
          )}
          <button
            onClick={() => delMatch(m.id)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: C_BASE.danger, padding: '6px', display: 'flex' }}
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
      <div style={{ fontSize: '15px', fontWeight: 600, marginBottom: '6px', color: C_BASE.text }}>
        {m.mode === 'Singles'
          ? `${m.players[0] || 'Player 1'} vs ${m.players[1] || 'Player 2'}`
          : m.teamNames?.[0]?.trim() || m.teamNames?.[1]?.trim()
          ? `${m.teamNames?.[0]?.trim() || 'Team 1'} (${m.players[0] || '1A'} / ${m.players[1] || '1B'}) vs ${m.teamNames?.[1]?.trim() || 'Team 2'} (${m.players[2] || '2A'} / ${m.players[3] || '2B'})`
          : `${m.players[0] || '1A'} / ${m.players[1] || '1B'} vs ${m.players[2] || '2A'} / ${m.players[3] || '2B'}`}
      </div>
      <div style={{ fontSize: '20px', fontWeight: 800, color: curTheme.teamA.primary, marginBottom: '8px' }}>
        {m.isDraft
          ? `In Progress · Game ${m.currentGame + 1}: ${m.games[m.currentGame]?.scoreA || 0} - ${m.games[m.currentGame]?.scoreB || 0}`
          : fmtSc(m.games.slice(0, m.gamesWonA + m.gamesWonB))}
      </div>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {m.games.slice(0, m.isDraft ? m.currentGame + 1 : m.gamesWonA + m.gamesWonB).map((g, i) => (
          <span key={`g-${m.id}-${i}`} style={{ background: C_BASE.softBg, borderRadius: '8px', padding: '3px 8px', fontSize: '12px', color: C_BASE.sub }}>
            G{i + 1}: {g.scoreA}-{g.scoreB}
          </span>
        ))}
      </div>
      {m.groupTags && m.groupTags.length > 0 && (
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '8px' }}>
          {m.groupTags.map((t, ti) => (
            <span
              key={`t-${m.id}-${t}-${ti}`}
              style={{
                background: isDark ? 'rgba(54, 167, 106, 0.25)' : '#E8F8EE',
                color: isDark ? '#86EFAC' : '#18683B',
                borderRadius: '8px',
                padding: '3px 8px',
                fontSize: '11px',
                fontWeight: 600,
              }}
            >
              {t}
            </span>
          ))}
        </div>
      )}
    </Card>
  );

  return (
    <div style={{ minHeight: '100vh', background: C_BASE.bg }}>
      <div
        style={{
          background: C_BASE.card,
          padding: '14px 16px',
          boxShadow: C_BASE.shadow,
          display: 'flex',
          alignItems: 'center',
          position: 'relative',
        }}
      >
        <button
          onClick={goBack}
          style={{
            position: 'absolute',
            left: '16px',
            zIndex: 1,
            background: 'none',
            border: 'none',
            color: C_BASE.sub,
            fontSize: '15px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontFamily: 'inherit',
            padding: 0,
          }}
        >
          <ChevronLeft size={18} /> Back
        </button>
        <h1 style={{ fontSize: '20px', fontWeight: 700, margin: 0, width: '100%', textAlign: 'center' }}>Match History</h1>
      </div>

      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '20px 16px' }}>
        {/* Groups */}
        <Card style={{ marginBottom: '16px' }}>
          <SecTitle>Groups</SecTitle>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
            <Input value={newGrp} onChange={setNewGrp} placeholder="New group name" style={{ flex: 1 }} />
            <Btn variant="primary" onClick={createGrp} disabled={!newGrp.trim()}>
              <Plus size={16} /> New
            </Btn>
          </div>
          {groups.length === 0 ? (
            <div style={{ fontSize: '14px', color: C_BASE.sub, textAlign: 'center', padding: '12px' }}>
              No groups yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {groups.map((g) => (
                <div
                  key={g.id}
                  style={{
                    border: `1.5px solid ${selGrp === g.id ? curTheme.teamA.primary : C_BASE.softBorder}`,
                    borderRadius: '14px',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '12px 14px',
                      background: selGrp === g.id ? (isDark ? 'rgba(91, 150, 248, 0.2)' : '#F2F7FF') : C_BASE.inputBg,
                    }}
                  >
                    {editGrp === g.id ? (
                      <input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onBlur={() => renameGrp(g)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') renameGrp(g);
                        }}
                        autoFocus
                        style={{
                          flex: 1,
                          border: `1.5px solid ${curTheme.teamA.primary}`,
                          borderRadius: '10px',
                          padding: '6px 10px',
                          fontSize: '14px',
                          fontFamily: 'inherit',
                          outline: 'none',
                          background: C_BASE.card,
                          color: C_BASE.text,
                        }}
                      />
                    ) : (
                      <button
                        onClick={() => setSelGrp(selGrp === g.id ? null : g.id)}
                        style={{
                          flex: 1,
                          textAlign: 'left',
                          background: 'none',
                          border: 'none',
                          fontSize: '15px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          fontFamily: 'inherit',
                          padding: 0,
                          color: C_BASE.text,
                        }}
                      >
                        {g.name}{' '}
                        <span style={{ color: C_BASE.sub, fontWeight: 400, fontSize: '13px' }}>
                          ({g.matches.length})
                        </span>
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setEditGrp(g.id);
                        setEditName(g.name);
                      }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: C_BASE.sub, padding: '4px', display: 'flex' }}
                    >
                      <Edit2 size={15} />
                    </button>
                    <button
                      onClick={() => dlGrp(g)}
                      disabled={g.matches.length === 0}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: g.matches.length ? 'pointer' : 'not-allowed',
                        color: curTheme.teamA.primary,
                        padding: '4px',
                        display: 'flex',
                        opacity: g.matches.length ? 1 : 0.3,
                      }}
                    >
                      <Download size={16} />
                    </button>
                    <button
                      onClick={() => delGrp(g.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: C_BASE.danger, padding: '4px', display: 'flex' }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  {selGrp === g.id && (
                    <div style={{ padding: '12px 14px', borderTop: `1px solid ${C_BASE.border}` }}>
                      {matches.filter((m) => g.matches.includes(m.id)).length === 0 ? (
                        <div style={{ fontSize: '13px', color: C_BASE.sub, textAlign: 'center' }}>
                          No matches in this group.
                        </div>
                      ) : (
                        matches.filter((m) => g.matches.includes(m.id)).map((m, idx) => mCard(m, idx, `grp-${g.id}`))
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* All Matches */}
        <Card>
          <SecTitle
            action={
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={dlAll}
                  disabled={!matches.length}
                  style={{
                    background: '#4A80E8',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '6px 12px',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: matches.length ? 'pointer' : 'not-allowed',
                    opacity: matches.length ? 1 : 0.5,
                    fontFamily: 'inherit',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <Download size={14} /> CSV
                </button>
                <button
                  onClick={clearAll}
                  disabled={!matches.length}
                  style={{
                    background: C_BASE.danger,
                    color: '#fff',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '6px 12px',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: matches.length ? 'pointer' : 'not-allowed',
                    opacity: matches.length ? 1 : 0.5,
                    fontFamily: 'inherit',
                  }}
                >
                  Clear All
                </button>
              </div>
            }
          >
            All Matches ({matches.length})
          </SecTitle>
          {matches.length === 0 ? (
            <div style={{ fontSize: '14px', color: C_BASE.sub, textAlign: 'center', padding: '24px' }}>
              No matches played yet.
            </div>
          ) : (
            <div>{[...matches].reverse().map((m, idx) => mCard(m, idx, 'all'))}</div>
          )}
        </Card>
      </div>

      {/* Clear All Confirmation Modal */}
      {showClearConfirm && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '20px',
          }}
        >
          <Card style={{ width: '100%', maxWidth: '380px', textAlign: 'center', position: 'relative', padding: '24px 20px' }}>
            <button
              id="close-clear-modal-btn"
              onClick={() => setShowClearConfirm(false)}
              style={{
                position: 'absolute',
                top: '14px',
                right: '14px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: C_BASE.sub,
                display: 'flex',
                padding: '4px',
              }}
              title="Cancel"
            >
              <X size={18} />
            </button>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>🗑️</div>
            <div style={{ fontSize: '18px', fontWeight: 800, marginBottom: '8px' }}>Clear Match History?</div>
            <div style={{ fontSize: '14px', color: C_BASE.sub, marginBottom: '20px', lineHeight: 1.5 }}>
              Are you sure you want to clear all match history? This action cannot be undone.
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <Btn
                id="cancel-clear-history-btn"
                variant="soft"
                style={{ flex: 1 }}
                onClick={() => setShowClearConfirm(false)}
              >
                Cancel
              </Btn>
              <Btn
                id="confirm-clear-history-btn"
                variant="danger"
                style={{ flex: 1 }}
                onClick={() => {
                  setMatches([]);
                  setGroups(groups.map((g) => ({ ...g, matches: [] })));
                  setShowClearConfirm(false);
                }}
              >
                Clear All
              </Btn>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

// ----------------------------------------------------
// MAIN APP COMPONENT
// ----------------------------------------------------
export default function App() {
  const [screen, setScreen] = useState<'setup' | 'serve' | 'play' | 'complete' | 'history'>('setup');
  const [theme, setTheme] = useState<ColorTheme>(() => {
    try {
      const saved = localStorage.getItem('badminton_theme');
      if (saved === 'coral' || saved === 'green') return saved;
    } catch {}
    return 'coral';
  });

  const [isDark, setIsDark] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('badminton_dark_mode');
      return saved === 'true';
    } catch {
      return false;
    }
  });

  const toggleDark = () => {
    setIsDark((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('badminton_dark_mode', String(next));
      } catch {}
      return next;
    });
  };

  useEffect(() => {
    try {
      document.documentElement.style.backgroundColor = isDark ? '#12161F' : '#F7F6F2';
      document.body.style.backgroundColor = isDark ? '#12161F' : '#F7F6F2';
      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } catch {}
  }, [isDark]);

  const handleSetTheme = (t: ColorTheme) => {
    setTheme(t);
    try {
      localStorage.setItem('badminton_theme', t);
    } catch {}
  };

  const cBase = getBaseColors(isDark);
  const curTheme = getThemeConfig(theme, isDark);

  const [setup, setSetup] = useState<{
    mode: GameMode;
    format: MatchFormat;
    winScore: number;
    plus2: boolean;
    customWin: string;
    players: [string, string, string, string];
    teamNames?: [string, string];
  }>({
    mode: 'Singles',
    format: 'Best of 3',
    winScore: 21,
    plus2: true,
    customWin: '',
    players: ['', '', '', ''],
  });

  const [match, setMatch] = useState<MatchState | null>(null);
  const [matches, setMatches] = useState<MatchState[]>(() => {
    try {
      const saved = localStorage.getItem('badminton_matches');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [groups, setGroups] = useState<MatchGroup[]>(() => {
    try {
      const saved = localStorage.getItem('badminton_groups');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('badminton_matches', JSON.stringify(matches));
    } catch {}
  }, [matches]);

  useEffect(() => {
    try {
      localStorage.setItem('badminton_groups', JSON.stringify(groups));
    } catch {}
  }, [groups]);

  const startMatch = (servingSide: number, srvPlayer: number, recvPlayer: number) => {
    let initialCourts: Record<number, CourtSide>;
    if (setup.mode === 'Doubles') {
      const init = initializeDoublesCourts(servingSide, srvPlayer, recvPlayer);
      initialCourts = init.courtPositions;
    } else {
      initialCourts = {
        0: 'R',
        1: 'R',
        2: 'R',
        3: 'L',
      };
    }

    const newMatch: MatchState = {
      id: 'm' + Date.now(),
      date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
      mode: setup.mode,
      format: setup.format,
      winScore: setup.winScore,
      plus2: setup.plus2,
      players: [setup.players[0], setup.players[1], setup.players[2], setup.players[3]],
      teamNames: setup.teamNames ? [setup.teamNames[0], setup.teamNames[1]] : undefined,
      games: [
        { scoreA: 0, scoreB: 0, winner: -1 },
        { scoreA: 0, scoreB: 0, winner: -1 },
        { scoreA: 0, scoreB: 0, winner: -1 },
      ],
      gamesWonA: 0,
      gamesWonB: 0,
      currentGame: 0,
      servingSide,
      currentServer: srvPlayer,
      currentReceiver: recvPlayer,
      courtPositions: initialCourts,
      initialServer: srvPlayer,
      initialReceiver: recvPlayer,
      winner: -1,
      sidesSwitched: false,
      groupTags: [],
    };

    setMatch(newMatch);
    setScreen('play');
  };

  const goComplete = (m: MatchState) => {
    setMatch({ ...m, groupTags: [] });
    setScreen('complete');
  };

  const saveMatch = () => {
    if (match) {
      const tags = groups.filter((g) => g.matches.includes(match.id)).map((g) => g.name);
      setMatches((prev) => {
        const filtered = prev.filter((m) => m.id !== match.id);
        return [{ ...match, groupTags: tags }, ...filtered];
      });
    }
  };

  const saveDraft = (m: MatchState) => {
    const draftMatch: MatchState = {
      ...m,
      isDraft: true,
    };
    setMatches((prev) => {
      const filtered = prev.filter((item) => item.id !== draftMatch.id);
      return [draftMatch, ...filtered];
    });
    setScreen('history');
  };

  const goSetup = (preset?: any) => {
    if (preset) {
      setSetup({
        mode: preset.mode,
        format: preset.format,
        winScore: preset.winScore,
        plus2: preset.plus2,
        customWin: '',
        players: [
          preset.players?.[0] || '',
          preset.players?.[1] || '',
          preset.players?.[2] || '',
          preset.players?.[3] || '',
        ],
        teamNames: preset.teamNames ? [preset.teamNames[0] || '', preset.teamNames[1] || ''] : undefined,
      });
    }
    setScreen('setup');
  };

  return (
    <ThemeContext.Provider value={{ isDark, toggleDark, theme, setTheme: handleSetTheme, cBase, curTheme }}>
      <div
        id="app-root-container"
        style={{
          minHeight: '100vh',
          background: cBase.bg,
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", sans-serif',
          color: cBase.text,
          transition: 'background-color 0.2s ease, color 0.2s ease',
        }}
      >
        {screen === 'setup' && (
          <Setup
            st={setup}
            set={setSetup}
            theme={theme}
            setTheme={handleSetTheme}
            goServe={() => setScreen('serve')}
            goHist={() => setScreen('history')}
            recent={matches.slice(0, 3)}
          />
        )}

        {screen === 'serve' && (
          <ServeSel
            st={setup}
            theme={theme}
            startMatch={startMatch}
            goBack={() => setScreen('setup')}
          />
        )}

        {screen === 'play' && match && (
          <Play
            match={match}
            setMatch={setMatch}
            theme={theme}
            goComplete={goComplete}
            goHome={() => setScreen('setup')}
            saveDraft={saveDraft}
          />
        )}

        {screen === 'complete' && match && (
          <Complete
            match={match}
            setMatch={setMatch}
            theme={theme}
            goSetup={() => {
              saveMatch();
              goSetup();
            }}
            goServe={() => {
              saveMatch();
              setSetup({
                mode: match.mode,
                format: match.format,
                winScore: match.winScore,
                plus2: match.plus2,
                customWin: '',
                players: [match.players[0], match.players[1], match.players[2], match.players[3]],
                teamNames: match.teamNames ? [match.teamNames[0], match.teamNames[1]] : undefined,
              });
              setScreen('serve');
            }}
            goHist={() => setScreen('history')}
            groups={groups}
            setGroups={setGroups}
            saveMatch={saveMatch}
          />
        )}

        {screen === 'history' && (
          <History
            matches={matches}
            setMatches={setMatches}
            groups={groups}
            setGroups={setGroups}
            goSetup={goSetup}
            resumeMatch={(m) => {
              setMatch(m);
              setScreen('play');
            }}
            goBack={() => setScreen('setup')}
          />
        )}
      </div>
    </ThemeContext.Provider>
  );
}
