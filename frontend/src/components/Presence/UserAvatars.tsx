import { AwarenessState } from "../../types/presence.types";

interface UserAvatarsProps {
  peers: Map<number, AwarenessState>;
}

export function UserAvatars({ peers }: UserAvatarsProps) {
  const users = Array.from(peers.values()).filter((p) => p.user);

  if (users.length === 0) return null;

  return (
    <div className="flex items-center gap-1 px-3 py-1.5 bg-panel border-b border-subtle">
      {users.map((state, idx) => (
        <div
          key={idx}
          title={state.user.username}
          className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-semibold text-white border-2 border-subtle"
          style={{ backgroundColor: state.user.color, marginLeft: idx > 0 ? -6 : 0 }}
        >
          {state.user.username.slice(0, 2).toUpperCase()}
        </div>
      ))}
      <span className="text-xs text-muted ml-2">
        {users.length} online
      </span>
    </div>
  );
}
