import { me, refresh, getToken } from "../auth.js";
import { render } from "./render.js";

// Startpunkt der App.
//
// Idee:
// - Wenn ein Access-Token da ist: direkt /me abfragen
// - wenn das nicht klappt: refresh versuchen und nochmal /me
// - am Ende wird immer gerendert (mit user oder ohne)
export async function bootstrap() {
  let user = null;

  try {
    const token = getToken();
    if (token) user = await me();
  } catch {
    // ignore
  }

  if (!user) {
    try {
      await refresh();
      user = await me();
    } catch {
      // ignore
    }
  }

  render({ user, bootstrap });
}