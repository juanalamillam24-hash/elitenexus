import { createClient } from "@supabase/supabase-js";

const url = "https://cedqmpndpxmckwmqqylb.supabase.co";
const key =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNlZHFtcG5kcHhtY2t3bXFxeWxiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ2NTUzMTAsImV4cCI6MjEwMDIzMTMxMH0.vUQXtX-YMydu90IOsJrsPDA_Q99J_Wr-cSIoRBAAi14";

export const supabase = createClient(url, key);
