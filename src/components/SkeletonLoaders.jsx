/* ═══════════════════════════════════════════════════════════════
   SKELETON LOADERS  —  CipherPool v6
   Animated placeholders pendant le chargement des données.
   Usage:
     <StatCardSkeleton />
     <HeroBannerSkeleton />
     <TournamentCardSkeleton />
     <LeaderboardSkeleton rows={10} />
     <ProfileSkeleton />
     <NewsCardSkeleton />
     <TableSkeleton rows={5} cols={4} />
   ═══════════════════════════════════════════════════════════════ */

const shimmer = `
  @keyframes shimmer {
    0%   { background-position: -800px 0; }
    100% { background-position:  800px 0; }
  }
`;

// ── Base shimmer bar ──────────────────────────────────────────
function Bone({ w = "100%", h = 16, r = 8, style: extra }) {
  return (
    <div style={{
      width: w, height: h, borderRadius: r,
      background: "linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.09) 50%, rgba(255,255,255,0.04) 75%)",
      backgroundSize: "800px 100%",
      animation: "shimmer 1.6s infinite linear",
      flexShrink: 0,
      ...extra,
    }}/>
  );
}

// ── Card wrapper ──────────────────────────────────────────────
function SkeletonCard({ children, style: extra }) {
  return (
    <div style={{
      background: "rgba(15,15,23,0.85)",
      border: "1px solid rgba(255,255,255,0.05)",
      borderRadius: 18,
      padding: "22px 20px",
      overflow: "hidden",
      position: "relative",
      ...extra,
    }}>
      {children}
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// STAT CARD
// ────────────────────────────────────────────────────────────
export function StatCardSkeleton() {
  return (
    <SkeletonCard>
      <Bone w={34} h={34} r={10} extra={{ marginBottom: 14 }}/>
      <Bone w="55%" h={38} r={6} extra={{ marginBottom: 10 }}/>
      <Bone w="70%" h={10} r={5}/>
      <style>{shimmer}</style>
    </SkeletonCard>
  );
}

// ────────────────────────────────────────────────────────────
// HERO BANNER
// ────────────────────────────────────────────────────────────
export function HeroBannerSkeleton() {
  return (
    <div style={{ borderRadius: 22, overflow: "hidden", minHeight: 330, background: "rgba(10,10,15,0.9)", border: "1px solid rgba(255,255,255,0.05)", padding: "40px 44px", display: "flex", flexDirection: "column", justifyContent: "flex-end", gap: 14 }}>
      <div style={{ display:"flex", gap:10, marginBottom:8 }}>
        <Bone w={60} h={24} r={7}/>
        <Bone w={120} h={24} r={7}/>
      </div>
      <Bone w="65%" h={52} r={8}/>
      <Bone w="45%" h={18} r={6}/>
      <div style={{ display:"flex", gap:14, marginTop:10 }}>
        <Bone w={80} h={56} r={10}/>
        <Bone w={80} h={56} r={10}/>
        <Bone w={80} h={56} r={10}/>
      </div>
      <div style={{ display:"flex", gap:10, marginTop:10 }}>
        <Bone w={140} h={44} r={12}/>
        <Bone w={100} h={44} r={12}/>
      </div>
      <style>{shimmer}</style>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// TOURNAMENT CARD
// ────────────────────────────────────────────────────────────
export function TournamentCardSkeleton() {
  return (
    <div style={{ background:"rgba(15,15,23,0.85)", border:"1px solid rgba(255,255,255,0.05)", borderRadius:20, overflow:"hidden" }}>
      <Bone w="100%" h={100} r={0}/>
      <div style={{ padding:"16px 18px", display:"flex", flexDirection:"column", gap:10 }}>
        <Bone w="75%" h={16} r={5}/>
        <Bone w="50%" h={10} r={4}/>
        <div style={{ display:"flex", justifyContent:"space-between" }}>
          <Bone w="35%" h={22} r={5}/>
          <Bone w="25%" h={22} r={5}/>
        </div>
        <Bone w="100%" h={4} r={4}/>
        <Bone w="100%" h={38} r={10} extra={{ marginTop:4 }}/>
      </div>
      <style>{shimmer}</style>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// LEADERBOARD ROW
// ────────────────────────────────────────────────────────────
export function LeaderboardRowSkeleton() {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:14, padding:"12px 16px", borderRadius:12, background:"rgba(255,255,255,0.02)" }}>
      <Bone w={30} h={22} r={5}/>
      <Bone w={38} h={38} r={10}/>
      <Bone w="30%" h={14} r={5}/>
      <div style={{ flex:1 }}/>
      <Bone w={60} h={14} r={5}/>
      <Bone w={50} h={14} r={5}/>
      <Bone w={55} h={14} r={5}/>
    </div>
  );
}

export function LeaderboardSkeleton({ rows = 8 }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
      {Array.from({ length: rows }).map((_, i) => <LeaderboardRowSkeleton key={i}/>)}
      <style>{shimmer}</style>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// PROFILE
// ────────────────────────────────────────────────────────────
export function ProfileSkeleton() {
  return (
    <SkeletonCard style={{ padding: "32px" }}>
      <div style={{ display:"flex", gap:20, alignItems:"flex-end", marginBottom:24 }}>
        <Bone w={80} h={80} r={18}/>
        <div style={{ flex:1, display:"flex", flexDirection:"column", gap:8 }}>
          <Bone w="50%" h={28} r={7}/>
          <Bone w="35%" h={12} r={5}/>
          <Bone w="60%" h={10} r={5}/>
        </div>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12, marginTop:8 }}>
        {[0,1,2].map(i => (
          <div key={i} style={{ background:"rgba(255,255,255,0.03)", borderRadius:12, padding:"16px", display:"flex", flexDirection:"column", gap:8 }}>
            <Bone w="40%" h={10} r={4}/>
            <Bone w="60%" h={24} r={6}/>
          </div>
        ))}
      </div>
      <style>{shimmer}</style>
    </SkeletonCard>
  );
}

// ────────────────────────────────────────────────────────────
// NEWS CARD
// ────────────────────────────────────────────────────────────
export function NewsCardSkeleton() {
  return (
    <SkeletonCard style={{ padding: 0, overflow:"hidden" }}>
      <Bone w="100%" h={160} r={0}/>
      <div style={{ padding:"16px 18px", display:"flex", flexDirection:"column", gap:10 }}>
        <Bone w="30%" h={10} r={4}/>
        <Bone w="85%" h={20} r={5}/>
        <Bone w="100%" h={12} r={4}/>
        <Bone w="75%" h={12} r={4}/>
        <div style={{ display:"flex", justifyContent:"space-between", marginTop:4 }}>
          <Bone w="25%" h={10} r={4}/>
          <Bone w="20%" h={10} r={4}/>
        </div>
      </div>
      <style>{shimmer}</style>
    </SkeletonCard>
  );
}

// ────────────────────────────────────────────────────────────
// TABLE (admin pages)
// ────────────────────────────────────────────────────────────
export function TableRowSkeleton({ cols = 5 }) {
  return (
    <div style={{ display:"grid", gridTemplateColumns:`repeat(${cols},1fr)`, gap:12, padding:"14px 16px", borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
      {Array.from({ length: cols }).map((_, i) => (
        <Bone key={i} w={i === 0 ? "80%" : i === cols-1 ? "60%" : "70%"} h={12} r={4}/>
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 5 }) {
  return (
    <div style={{ borderRadius:14, overflow:"hidden", border:"1px solid rgba(255,255,255,0.05)" }}>
      {/* header */}
      <div style={{ display:"grid", gridTemplateColumns:`repeat(${cols},1fr)`, gap:12, padding:"14px 16px", background:"rgba(255,255,255,0.03)" }}>
        {Array.from({ length: cols }).map((_, i) => <Bone key={i} w="60%" h={10} r={4}/>)}
      </div>
      {Array.from({ length: rows }).map((_, i) => <TableRowSkeleton key={i} cols={cols}/>)}
      <style>{shimmer}</style>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// SIDEBAR MINI PROFILE
// ────────────────────────────────────────────────────────────
export function SidebarProfileSkeleton() {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:10, padding:"13px 14px" }}>
      <Bone w={40} h={40} r={11}/>
      <div style={{ flex:1, display:"flex", flexDirection:"column", gap:6 }}>
        <Bone w="70%" h={12} r={5}/>
        <Bone w="45%" h={9} r={4}/>
      </div>
      <style>{shimmer}</style>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// FULL PAGE SKELETON (route transition)
// ────────────────────────────────────────────────────────────
export function PageSkeleton() {
  return (
    <div style={{ padding:"32px 32px 48px", minHeight:"calc(100vh - 64px)" }}>
      {/* Header */}
      <div style={{ marginBottom:28 }}>
        <Bone w={120} h={10} r={5} extra={{ marginBottom:12 }}/>
        <Bone w="40%" h={44} r={8} extra={{ marginBottom:10 }}/>
        <div style={{ display:"flex", gap:8 }}>
          <Bone w={110} h={24} r={7}/>
          <Bone w={120} h={24} r={7}/>
        </div>
      </div>

      {/* Stat cards */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16, marginBottom:26 }}>
        {[0,1,2,3].map(i => <StatCardSkeleton key={i}/>)}
      </div>

      {/* Hero + right col */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 300px", gap:18, marginBottom:20 }}>
        <HeroBannerSkeleton/>
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          <SkeletonCard style={{ padding:20 }}>
            <Bone w="50%" h={10} r={5} extra={{ marginBottom:12 }}/>
            <Bone w="45%" h={52} r={8} extra={{ marginBottom:14 }}/>
            <Bone w="100%" h={5} r={4} extra={{ marginBottom:6 }}/>
          </SkeletonCard>
          {[0,1,2,3,4].map(i => <Bone key={i} w="100%" h={48} r={13}/>)}
        </div>
      </div>

      {/* Tournament grid */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:16 }}>
        {[0,1,2].map(i => <TournamentCardSkeleton key={i}/>)}
      </div>

      <style>{shimmer}</style>
    </div>
  );
}