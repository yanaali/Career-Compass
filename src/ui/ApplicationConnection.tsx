import { useState } from "react";
import { useApplications } from "../store/applications";
import { Button } from "./Button";
import { Input } from "./Input";

export function ApplicationConnection() {
  const { mode, authMode, busy, error, connect, disconnect, refresh, importLocal } = useApplications();
  const [username, setUsername] = useState("compass");
  const [password, setPassword] = useState("");
  const [showSignIn, setShowSignIn] = useState(false);

  return (
    <div className="pt-3 space-y-2 text-xs text-slate-600 dark:text-slate-300">
      <p>{mode === "local" ? "Applications are saved in this browser." : "Applications are saved to your server."}</p>
      {mode === "local" && authMode === "oidc" ? (
        <a className="underline" href="/oauth2/authorization/cognito">Sign in to your workspace</a>
      ) : mode === "local" ? (
        <>
          <Button variant="ghost" disabled={busy} onClick={() => setShowSignIn(!showSignIn)}>Connect to server</Button>
          {showSignIn && (
            <form className="space-y-2" onSubmit={async (event) => {
              event.preventDefault();
              if (await connect(username, password)) { setPassword(""); setShowSignIn(false); }
            }}>
              <Input aria-label="Server username" autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value)} required />
              <Input aria-label="Server password" autoComplete="current-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              <Button disabled={busy || !username || !password} type="submit">{busy ? "Connecting..." : "Sign in"}</Button>
              <p>Your browser applications stay here. Once connected, you can import a copy to the server.</p>
            </form>
          )}
        </>
      ) : (
        <div className="flex flex-wrap gap-2">
          <Button variant="ghost" disabled={busy} onClick={() => void refresh()}>Refresh</Button>
          <Button variant="ghost" disabled={busy} onClick={() => void importLocal()}>Import browser applications</Button>
          <Button variant="ghost" disabled={busy} onClick={() => void disconnect()}>{authMode === "oidc" ? "Sign out" : "Disconnect"}</Button>
        </div>
      )}
      {mode === "server" && <p>Import keeps existing server entries. Disconnect to return to your browser copy.</p>}
      {busy && <p role="status">Saving or loading applications...</p>}
      {error && <p role="alert" className="text-red-700 dark:text-red-300">{error}</p>}
    </div>
  );
}
