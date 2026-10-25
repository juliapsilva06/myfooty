import { useState } from "react";
import { LOGO_HEIGHT, LOGO_SRC, SITE_NAME } from "../../config/appearance.js";

// The site name in the header: your logo if there is one, otherwise plain text.
// It stays an <h1> so screen readers still announce the site name.
export default function Brand() {
  const [logoFailed, setLogoFailed] = useState(false);
  const showLogo = Boolean(LOGO_SRC) && !logoFailed;

  return (
    <h1 className="brand__name">
      {showLogo ? (
        <img
          src={LOGO_SRC}
          alt={SITE_NAME}
          onError={() => setLogoFailed(true)} // missing file: fall back to the text name
          // Sized here (not in a stylesheet) so it can never render at full size by accident.
          style={{ display: "block", height: LOGO_HEIGHT, width: "auto", maxWidth: "60vw" }}
        />
      ) : (
        SITE_NAME
      )}
    </h1>
  );
}
