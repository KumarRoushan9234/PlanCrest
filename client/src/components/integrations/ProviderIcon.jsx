import { PROVIDER_META } from "./providerMeta";

export default function ProviderIcon({ id, size = 36 }) {
  const meta = PROVIDER_META[id] || PROVIDER_META.github;
  const Icon = meta.icon;
  return (
    <span className="pc-ico" style={{ width: size, height: size, borderRadius: size * 0.26, color: meta.color, background: `${meta.color}1f`, boxShadow: `inset 0 0 0 1px ${meta.color}33` }}>
      <Icon size={size * 0.5} />
    </span>
  );
}
