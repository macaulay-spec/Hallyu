import { httpRouter } from "convex/server";
import { auth } from "./auth";

const http = httpRouter();

// Convex Auth token endpoints (client refresh + provider callbacks).
auth.addHttpRoutes(http);

export default http;
