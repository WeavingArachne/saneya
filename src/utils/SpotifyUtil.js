const { getData } = require("spotify-url-info");

/**
 * Utility class for handling Spotify URLs and data
 */
class SpotifyUtil {
  /**
   * Check if a URL is a valid Spotify URL
   * @param {string} url The URL to check
   * @returns {boolean} Whether the URL is a valid Spotify URL
   */
  static isSpotifyUrl(url) {
    // return /^(?:https?:\\/\\/)?(?:open\\.)?spotify\\.com\\/(track|album|playlist|artist)\\/([a-zA-Z0-9]+)(.*)$/.test(url);
    return /^(?:https?:\/\/)?(?:open\.)?spotify\.com\/(track|album|playlist|artist)\/([a-zA-Z0-9]+)(.*)$/.test(
      url
    );
  }

  /**
   * Get the type of Spotify URL (track, album, playlist, artist)
   * @param {string} url The Spotify URL
   * @returns {string|null} The type of Spotify URL or null if invalid
   */
  static getSpotifyType(url) {
    // const match = url.match(/^(?:https?:\\/\\/)?(?:open\\.)?spotify\\.com\\/(track|album|playlist|artist)\\/([a-zA-Z0-9]+)(.*)$/);
    const match = url.match(
      /^(?:https?:\/\/)?(?:open\.)?spotify\.com\/(track|album|playlist|artist)\/([a-zA-Z0-9]+)(.*)$/
    );
    return match ? match[1] : null;
  }

  /**
   * Fetch data from a Spotify URL
   * @param {string} url The Spotify URL
   * @returns {Promise<Object>} The Spotify data
   */
  static async getData(url) {
    try {
      return await getData(url);
    } catch (error) {
      console.error("Error fetching Spotify data:", error);
      throw error;
    }
  }

  /**
   * Get formatted track info from Spotify data
   * @param {Object} data The Spotify track data
   * @returns {Object} Formatted track info
   */
  static formatTrackInfo(data) {
    return {
      title: data.name,
      artist: data.artists.map((artist) => artist.name).join(", "),
      album: data.album?.name || "Unknown Album",
      duration: data.duration_ms,
      coverArt: data.album?.images[0]?.url || null,
      url: data.external_urls?.spotify || null,
    };
  }

  /**
   * Format a Spotify playlist for search
   * @param {Object} data The Spotify playlist data
   * @returns {Array<string>} Array of search queries
   */
  static formatPlaylistForSearch(data) {
    if (!data || !data.tracks || !data.tracks.items) {
      return [];
    }

    return data.tracks.items
      .map((item) => {
        const track = item.track;
        if (!track) return null;

        const artists = track.artists.map((artist) => artist.name).join(" ");
        return `${track.name} ${artists}`;
      })
      .filter(Boolean);
  }
}

module.exports = SpotifyUtil;
