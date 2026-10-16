/**
 * engineering-shorts 템플릿 — 예시 「피라미드는 원래 하얗게 빛났다」 그대로다.
 * 새 편: PUBLIC_DIR, SHOTS·CLIP_VOL·PLAN, ERAS, HookTitle·PlaceTitle 문구, Overlay 라벨만 바꾼다.
 * vo-timeline.ts 는 { scenes: [{ id, frames, audio, groups: [{text,startMs,endMs}] }] } 형식 (references/edit.md).
 * 글꼴: Pretendard가 설치돼 있지 않으면 Noto Sans KR로 보인다.
 *
 * - 장면: Flow Omni 1.1 Flash 360p 8초 멀티샷 클립 8개 (클립 하나에 샷 2~3개)
 * - 장면 길이(목소리)가 8초보다 짧아서, 장면 안에서 클립의 샷들을 나눠 이어 붙인다 (샷당 최소 0.8초)
 * - 음성: Typecast 필제, 대본 전체 한 번에 → 1.2배속 → 장면별로 자름
 */
import React from "react";
import { AbsoluteFill, Audio, interpolate, OffthreadVideo, Sequence, staticFile, useCurrentFrame } from "remotion";
import timeline from "./vo-timeline";

export const PYRAMID_FPS = 30;
const TAIL = 12;
const Y = "#F8E663";
const SHORTS_FONT = "Pretendard, 'Noto Sans KR', sans-serif";
const PUBLIC_DIR = "pyramid-white"; // public/ 아래 클립·목소리 폴더
const F = (f: string) => staticFile(`${PUBLIC_DIR}/${f}`);

type Group = { text: string; startMs: number; endMs: number };
type Scene = { id: string; frames: number; audio: string; groups: Group[] };
const scenes = (timeline as { scenes: Scene[] }).scenes.map((s, i, a) => ({ ...s, len: s.frames + (i === a.length - 1 ? TAIL : 0) }));
const starts = scenes.reduce<number[]>((a, s, i) => [...a, i ? a[i - 1] + scenes[i - 1].len : 0], []);
export const PYRAMID_FRAMES = starts[starts.length - 1] + scenes[scenes.length - 1].len;

// 클립별 샷 시작(초). 장면 전환 검출(scene>0.3)로 잰 값. c8은 첫 전환이 부드러워 3초를 직접 넣었다
const SHOTS: Record<string, number[]> = {
  "c1-white.mp4": [0, 3.0, 5.92],
  "c2-today.mp4": [0, 2.96, 5.92],
  "c3-casing.mp4": [0, 2.88, 5.96],
  "c4-aerial.mp4": [0, 3.96],
  "c5-question.mp4": [0, 3.88],
  "c6-removal.mp4": [0, 2.92, 5.96],
  "c7-19th.mp4": [0, 3.96],
  "c8-khafre.mp4": [0, 3.0, 6.0],
};
// 클립 바닥 소리를 약 -36 LUFS로 맞춘 볼륨 (측정: c6 -21.3 ~ c8 -49.3 LUFS)
const CLIP_VOL: Record<string, number> = {
  "c1-white.mp4": 0.37, "c2-today.mp4": 1, "c3-casing.mp4": 0.61, "c4-aerial.mp4": 0.22,
  "c5-question.mp4": 0.69, "c6-removal.mp4": 0.18, "c7-19th.mp4": 0.92, "c8-khafre.mp4": 1,
};
// 장면 → [클립, 쓸 샷 번호들]. 마무리 c8b·c8c는 앞 클립을 다시 쓴다(c8c는 첫 장면 클립 → 반복 재생 이음)
const PLAN: Record<string, [string, number[]]> = {
  c1: ["c1-white.mp4", [0, 1]],
  c2: ["c2-today.mp4", [0, 1, 2]],
  c3: ["c3-casing.mp4", [0, 1, 2]],
  c4: ["c4-aerial.mp4", [0, 1]],
  c5: ["c5-question.mp4", [0, 1]],
  c6: ["c6-removal.mp4", [0, 1, 2]],
  c7: ["c7-19th.mp4", [0, 1]],
  c8a: ["c8-khafre.mp4", [0, 1, 2]],
  c8b: ["c4-aerial.mp4", [1]],
  c8c: ["c1-white.mp4", [0]],
};
const MIN_SHOT = 24; // 0.8초

const outline = "0 0 2px #000," + [...Array(8)].map((_, i) => {
  const a = (i / 8) * Math.PI * 2;
  return `${(Math.cos(a) * 5).toFixed(1)}px ${(Math.sin(a) * 5).toFixed(1)}px 0 #000`;
}).join(",");
const ease = (f: number, a: number, b: number, from = 0, to = 1) =>
  interpolate(f, [a, b], [from, to], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const at = (groups: Group[], i: number) => Math.round(((groups[i]?.startMs ?? 0) / 1000) * PYRAMID_FPS);

// 장면 길이를 샷들에 나눠 이어 붙인다
const SceneClip: React.FC<{ clip: string; shots: number[]; len: number }> = ({ clip, shots, len }) => {
  const n = Math.max(1, Math.min(shots.length, Math.floor(len / MIN_SHOT)));
  const use = shots.slice(0, n);
  const each = Math.ceil(len / n);
  return (
    <>
      {use.map((shot, i) => (
        <Sequence key={i} from={i * each} durationInFrames={i === n - 1 ? len - i * each : each}>
          <OffthreadVideo src={F(clip)} startFrom={Math.round((SHOTS[clip][shot] + 0.15) * PYRAMID_FPS)} volume={CLIP_VOL[clip]}
            style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </Sequence>
      ))}
    </>
  );
};

const Label: React.FC<{ y: number; text: string; sub?: string; delay?: number; size?: number }> = ({ y, text, sub, delay = 0, size = 96 }) => {
  const f = useCurrentFrame();
  return (
    <div style={{ position: "absolute", left: 140, width: 800, top: y, textAlign: "center", transform: `scale(${ease(f, delay, delay + 6, 0.85, 1)})`, opacity: ease(f, delay, delay + 6), whiteSpace: "nowrap" }}>
      {sub && <div style={{ fontFamily: SHORTS_FONT, fontWeight: 700, fontSize: 40, color: "#fff", textShadow: outline }}>{sub}</div>}
      <div style={{ fontFamily: SHORTS_FONT, fontWeight: 800, fontSize: size, color: Y, textShadow: outline, lineHeight: 1.05 }}>{text}</div>
    </div>
  );
};

const Pill: React.FC<{ y: number; from: string; to: string; delay: number; color?: string }> = ({ y, from, to, delay, color = Y }) => {
  const f = useCurrentFrame();
  const o = ease(f, delay, delay + 6);
  const arrow = ease(f, delay + 6, delay + 14);
  return (
    <div style={{ position: "absolute", left: 140, width: 800, top: y, display: "flex", justifyContent: "center", alignItems: "center", gap: 18, opacity: o }}>
      <span style={{ background: "rgba(16,16,18,0.82)", color: "#fff", fontFamily: SHORTS_FONT, fontWeight: 800, fontSize: 46, padding: "10px 26px", borderRadius: 60, whiteSpace: "nowrap" }}>{from}</span>
      <span style={{ fontFamily: SHORTS_FONT, fontWeight: 800, fontSize: 52, color, textShadow: outline, opacity: arrow }}>→</span>
      <span style={{ background: color, color: "#101012", fontFamily: SHORTS_FONT, fontWeight: 800, fontSize: 46, padding: "10px 26px", borderRadius: 60, whiteSpace: "nowrap", opacity: arrow }}>{to}</span>
    </div>
  );
};

// 연표: 완성 → 12세기 → 19세기 → 지금 (점은 같은 간격)
const ERAS = [
  { key: "built", label: "기원전 2500년대", sub: "완성" },
  { key: "c12", label: "12세기", sub: "뜯기 시작" },
  { key: "c19", label: "19세기", sub: "대부분 사라짐" },
  { key: "now", label: "지금", sub: "꼭대기만 남음" },
];
const X0 = 240, X1 = 840, TY = 420;
const xOf = (i: number) => X0 + (i / (ERAS.length - 1)) * (X1 - X0);
const Timeline: React.FC<{ era: number; prev?: number }> = ({ era, prev }) => {
  const f = useCurrentFrame();
  const cur = prev !== undefined ? interpolate(f, [0, 12], [prev, era], { extrapolateRight: "clamp" }) : era;
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, opacity: prev !== undefined ? 1 : ease(f, 0, 8) }}>
      <rect x={X0 - 110} y={TY - 78} width={X1 - X0 + 220} height={176} rx={28} fill="rgba(16,16,18,0.72)" />
      <line x1={X0} y1={TY} x2={X1} y2={TY} stroke="#5a5a62" strokeWidth={8} strokeLinecap="round" />
      <line x1={X0} y1={TY} x2={xOf(cur)} y2={TY} stroke={Y} strokeWidth={8} strokeLinecap="round" />
      {ERAS.map((d, i) => {
        const on = i <= cur + 0.01, now = i === era;
        return (
          <g key={d.key}>
            <circle cx={xOf(i)} cy={TY} r={now ? 15 : 10} fill={on ? Y : "#5a5a62"} stroke="#101012" strokeWidth={4} />
            <text x={xOf(i)} y={TY - 24} textAnchor="middle" fontFamily={SHORTS_FONT} fontWeight={800} fontSize={now ? 30 : 24} fill={now ? Y : on ? "#fff" : "#8a8a92"}>{d.label}</text>
            {now && <text x={xOf(i)} y={TY + 52} textAnchor="middle" fontFamily={SHORTS_FONT} fontWeight={700} fontSize={30} fill="#fff">{d.sub}</text>}
          </g>
        );
      })}
    </svg>
  );
};

const HookTitle: React.FC = () => (
  <div style={{ position: "absolute", left: 140, width: 800, top: 340, textAlign: "center", fontFamily: SHORTS_FONT, fontWeight: 800, lineHeight: 1.15, textShadow: outline, whiteSpace: "nowrap" }}>
    <div style={{ fontSize: 96, color: "#fff" }}>피라미드는</div>
    <div style={{ fontSize: 96, color: "#fff" }}>원래 <span style={{ color: Y }}>하얀색</span>이었다</div>
  </div>
);

const StepChip: React.FC<{ text: string; delay: number; last: boolean }> = ({ text, delay, last }) => {
  const f = useCurrentFrame();
  const o = ease(f, delay, delay + 6);
  return (
    <span style={{ opacity: o, display: "inline-flex", alignItems: "center", gap: 12 }}>
      <span style={{ background: last ? Y : "rgba(16,16,18,0.82)", color: last ? "#101012" : "#fff", fontFamily: SHORTS_FONT, fontWeight: 800, fontSize: 40, padding: "10px 18px", borderRadius: 50, whiteSpace: "nowrap" }}>{text}</span>
      {!last && <span style={{ fontFamily: SHORTS_FONT, fontWeight: 800, fontSize: 38, color: "#fff", textShadow: outline }}>›</span>}
    </span>
  );
};

const PlaceTitle: React.FC = () => {
  const f = useCurrentFrame();
  const o = ease(f, 2, 10);
  return (
    <div style={{ position: "absolute", left: 140, width: 800, top: 760, textAlign: "center", opacity: o }}>
      <div style={{ fontFamily: SHORTS_FONT, fontWeight: 800, fontSize: 100, lineHeight: 1.1, color: "#fff", textShadow: outline, whiteSpace: "nowrap" }}>이집트 기자</div>
      <div style={{ fontFamily: SHORTS_FONT, fontWeight: 800, fontSize: 100, lineHeight: 1.1, color: "#fff", textShadow: outline, whiteSpace: "nowrap" }}>피라미드</div>
      <div style={{ display: "inline-block", marginTop: 24, opacity: ease(f, 10, 18), background: Y, color: "#101012", fontFamily: SHORTS_FONT, fontWeight: 800, fontSize: 50, padding: "10px 34px", borderRadius: 60 }}>원래는 하얀색</div>
    </div>
  );
};

const Overlay: React.FC<{ id: string; groups: Group[] }> = ({ id, groups }) => {
  if (id === "c1") return <HookTitle />;
  if (id === "c2") return <Label y={620} sub="지금 보이는 돌계단" text="속살" delay={at(groups, 1)} size={120} />;
  if (id === "c3") return <Label y={620} sub="원래 겉면" text="흰 석회암 겉돌" delay={at(groups, 1)} />;
  if (id === "c4")
    return (
      <>
        <Timeline era={0} />
        <Label y={640} sub="원래 높이" text="146.5m" delay={4} size={120} />
        <Label y={860} sub="세계에서 가장 높은 건축물" text="3,800년" delay={at(groups, 1)} size={100} />
      </>
    );
  if (id === "c5") return <Label y={640} text="겉돌은 어디로?" delay={at(groups, 1)} size={96} />;
  if (id === "c6") return <><Timeline era={1} prev={0} /><Pill y={640} from="피라미드 겉돌" to="카이로 건물로" delay={at(groups, 1)} /></>;
  if (id === "c7") return <><Timeline era={2} prev={1} /><Pill y={640} from="흰 겉돌" to="속돌만" delay={at(groups, 1)} /></>;
  if (id === "c8a") return <><Timeline era={3} prev={2} /><Label y={660} sub="지금도 남은 흰 겉돌" text="카프레 피라미드 꼭대기" delay={at(groups, 1)} size={72} /></>;
  if (id === "c8b")
    return (
      <div style={{ position: "absolute", left: 140, width: 800, top: 620, display: "flex", justifyContent: "center", gap: 12 }}>
        {["하얀 피라미드", "겉돌 뜯김", "돌계단"].map((t, i) => <StepChip key={t} text={t} delay={i * 6} last={i === 2} />)}
      </div>
    );
  if (id === "c8c") return <PlaceTitle />;
  return null;
};

const Caption: React.FC<{ groups: Group[] }> = ({ groups }) => {
  const f = useCurrentFrame();
  const ms = (f / PYRAMID_FPS) * 1000;
  const cur = groups.find((c) => ms >= c.startMs && ms < c.endMs);
  if (!cur) return null;
  return (
    <div style={{ position: "absolute", left: 140, width: 800, top: 1267, textAlign: "center" }}>
      <span style={{ fontFamily: SHORTS_FONT, fontWeight: 800, fontSize: 68, lineHeight: 1.3, color: "#fff", textShadow: outline, wordBreak: "keep-all" }}>{cur.text}</span>
    </div>
  );
};

export const PyramidShort: React.FC = () => (
  <AbsoluteFill style={{ background: "#000" }}>
    {scenes.map((s, i) => {
      const [clip, shots] = PLAN[s.id];
      return (
        <Sequence key={s.id} from={starts[i]} durationInFrames={s.len}>
          <SceneClip clip={clip} shots={shots} len={s.len} />
          <Overlay id={s.id} groups={s.groups} />
          <Caption groups={s.groups} />
          <Audio src={F(s.audio)} />
        </Sequence>
      );
    })}
    <div style={{ position: "absolute", left: 48, top: 270, fontFamily: SHORTS_FONT, fontWeight: 700, fontSize: 28, color: "#fff", background: "rgba(0,0,0,0.45)", padding: "6px 14px" }}>AI 재현 이미지</div>
  </AbsoluteFill>
);
