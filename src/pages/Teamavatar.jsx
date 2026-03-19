// src/components/TeamAvatar.jsx
// Usage: <TeamAvatar team={team} size={48} />
export default function TeamAvatar({ team, size = 48 }) {
  const ac = team?.accent_color || "#00d4ff";
  const radius = Math.round(size * 0.25);
  const fontSize = Math.round(size * 0.35);

  if (team?.logo_url) return (
    <img
      src={team.logo_url}
      alt={team?.name || "team"}
      style={{ width:size, height:size, borderRadius:radius, objectFit:"cover", border:`2px solid ${ac}40`, background:"#0a1628", flexShrink:0 }}
      onError={e => { e.currentTarget.style.display = "none"; }}
    />
  );

  return (
    <div style={{
      width:size, height:size, borderRadius:radius,
      background:`linear-gradient(135deg,${ac}30,#0a1628)`,
      border:`2px solid ${ac}40`,
      display:"flex", alignItems:"center", justifyContent:"center",
      fontFamily:"Bebas Neue,cursive", color:ac,
      flexShrink:0, fontSize,
    }}>
      {team?.tag || "T"}
    </div>
  );
}