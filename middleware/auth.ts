import { verify } from "@/lib/token"; export function auth(req){ const h=req.headers.get("authorization"); if(!h) return null; try{ return verify(h.replace("Bearer ","")); }catch{ return null; }}
