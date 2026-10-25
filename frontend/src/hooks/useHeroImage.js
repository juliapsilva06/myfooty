import { useCallback, useEffect, useState } from "react";
import {
  fileToCompressedDataUrl,
  isAllowedImageSrc,
  loadHeroImage,
  removeHeroImage,
  saveHeroImage,
} from "../lib/imageStore.js";

// One team's custom countdown background, kept in this browser.
export function useHeroImage(teamId) {
  const [image, setImage] = useState(() => loadHeroImage(teamId));
  const [error, setError] = useState(null);

  useEffect(() => {
    setImage(loadHeroImage(teamId));
    setError(null);
  }, [teamId]);

  const commit = useCallback(
    (src) => {
      if (!saveHeroImage(teamId, src)) {
        setError("Couldn't save that picture in your browser. Try a smaller one.");
        return false;
      }
      setImage(src);
      setError(null);
      return true;
    },
    [teamId]
  );

  const setFromFile = useCallback(
    async (file) => {
      try {
        commit(await fileToCompressedDataUrl(file));
      } catch (e) {
        setError(e.message || "That image couldn't be used.");
      }
    },
    [commit]
  );

  const setFromUrl = useCallback(
    (url) => {
      const value = url.trim();
      if (!isAllowedImageSrc(value) || value.startsWith("data:")) {
        setError("Paste a link that starts with https://");
        return false;
      }
      return commit(value);
    },
    [commit]
  );

  const clear = useCallback(() => {
    removeHeroImage(teamId);
    setImage(null);
    setError(null);
  }, [teamId]);

  return { image, error, setFromFile, setFromUrl, clear };
}
