import { StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";
import { SITE_URL, TURNSTILE_SITE_KEY } from "@/lib/supabase";
import { colors } from "@/lib/theme";

/**
 * Cloudflare Turnstile inside a WebView. Supabase Auth has CAPTCHA on for this
 * project, so sign-in / sign-up must carry a token. The page is given the
 * website's origin as its baseUrl so the site key's hostname check passes.
 * Renders nothing (and the parent sends no token) when no site key is set.
 */
export function Turnstile({ onToken }: { onToken: (token: string) => void }) {
  if (!TURNSTILE_SITE_KEY) return null;
  const html = `<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1">
<script src="https://challenges.cloudflare.com/turnstile/v0/api.js?onload=ready" async defer></script>
<style>html,body{margin:0;background:${colors.bg};display:flex;justify-content:center}</style></head>
<body><div id="w"></div><script>
function ready(){turnstile.render('#w',{sitekey:'${TURNSTILE_SITE_KEY}',theme:'dark',callback:function(t){window.ReactNativeWebView.postMessage(t)},'expired-callback':function(){window.ReactNativeWebView.postMessage('')}})}
</script></body></html>`;
  return (
    <View style={styles.box}>
      <WebView
        originWhitelist={["*"]}
        source={{ html, baseUrl: SITE_URL }}
        onMessage={(e) => onToken(e.nativeEvent.data)}
        style={styles.web}
        scrollEnabled={false}
        javaScriptEnabled
      />
    </View>
  );
}

const styles = StyleSheet.create({
  box: { height: 72, overflow: "hidden" },
  web: { backgroundColor: "transparent" },
});
